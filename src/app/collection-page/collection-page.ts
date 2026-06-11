import { Component, signal, computed, OnInit, inject, HostListener } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Review } from '../review.data';
import { HttpClient } from '@angular/common/http';
import { ImgFadeDirective } from '../shared/img-fade.directive';
import { environment } from '../../environments/environment';
import { LanguageService } from '../shared/language.service';
import { LikedStateService } from '../shared/liked-state.service';

@Component({
  selector: 'app-collection-page',
  imports: [RouterModule, FormsModule, CommonModule, ImgFadeDirective],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css'
})

export class CollectionPage implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  langService = inject(LanguageService);
  private likedService = inject(LikedStateService);

  reviews = signal<Review[]>([]);

  showLatestOnly = signal(false);

  // Add your API url
  private apiUrl = environment.apiUrl;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.showLatestOnly.set(params['filter'] === 'latest');
    });

    this.likedService.init();

    this.http.get<{ reviews: Review[] }>(`${this.apiUrl}/reviews?published=true`).subscribe({
      next: (data) => {
        this.reviews.set(data.reviews);
      },
      error: (error) => {
        console.error('Error fetching live reviews:', error);
      }
    });
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showSortMenu() && !target.closest('.sort-container')) {
      this.showSortMenu.set(false);
    }
    if (this.shareMenuId() !== null && !target.closest('.share-menu-wrap')) {
      this.shareMenuId.set(null);
    }
  }

  isLiked(id: number): boolean {
    return this.likedService.isLiked(id);
  }

  toggleLike(review: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.http.post<{ liked: boolean; likes: number }>(`${this.apiUrl}/reviews/${review.id}/like`, {}).subscribe({
      next: (res) => {
        this.likedService.setLiked(review.id, res.liked);
        review.likes = res.likes;
        this.reviews.set([...this.reviews()]);
      }
    });
  }

  toggleShareMenuForReview(id: number) {
    this.shareMenuId.update(cur => cur === id ? null : id);
  }

  copyReviewLink(review: any) {
    const slug = review.slug || review.id;
    navigator.clipboard.writeText(`${window.location.origin}/reviews/${slug}`);
    this.shareMenuId.set(null);
    this.copiedReviewId.set(review.id);
    setTimeout(() => this.copiedReviewId.set(null), 2000);
  }

  async shareReviewCard(review: any) {
    this.generatingCard.set(true);
    this.shareMenuId.set(null);
    try {
      const res = await fetch(`${this.apiUrl}/share-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'review', title: review.album, artist: review.artist, image: review.image })
      });
      if (!res.ok) throw new Error('Card generation failed');
      const blob = await res.blob();
      const file = new File([blob], 'review-card.png', { type: 'image/png' });
      const nav = navigator as any;
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = 'review-card.png';
        a.click();
        URL.revokeObjectURL(url);
        this.cardDownloaded.set(true);
        setTimeout(() => this.cardDownloaded.set(false), 3500);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Share card failed:', err);
    } finally {
      this.generatingCard.set(false);
    }
  }

  searchTerm = signal('');
  selectedGenre = signal<string | null>(null);
  selectedDecade = signal<string | null>(null);
  selectedYear = signal<string | null>(null);
  selectedCountry = signal<string | null>(null);

  viewMode = signal<'list' | 'grid'>('list');
  showFilters = signal(true);
  gridSize = signal(16);
  sortBy = signal<'date' | 'name' | 'score'>('date');
  showSortMenu = signal(false);

  selectedPreview = signal<any | null>(null);
  shareMenuId = signal<number | null>(null);
  generatingCard = signal(false);
  copiedReviewId = signal<number | null>(null);
  cardDownloaded = signal(false);
  
  togglePreview(review: any) {
    if (window.innerWidth <= 768) {
      this.router.navigate(['/reviews', review.slug || review.id]);
      return;
    }
    if (this.selectedPreview()?.id === review.id) {
      this.selectedPreview.set(null);
    } else {
      this.selectedPreview.set(review);
    }
  }

  getSplitGenres(genreData: any): string[] {
    if (!genreData) return [];
    if (Array.isArray(genreData)) return genreData;
    
    // Splits by comma, removes whitespace, and filters out empty strings
    return genreData.split(',')
      .map((g: string) => g.trim())
      .filter((g: string) => g.length > 0);
  }

  applyFilterFromTag(type: 'year' | 'country' | 'genre', value: string) {
    if (!value) return;

    if (type === 'year') {
      this.selectedYear.set(value);
      // Automatically set the decade so the UI dropdown matches!
      const decade = value.slice(0, 3) + '0s';
      this.selectedDecade.set(decade);
    } 
    else if (type === 'country') {
      // Find the exact casing from your countries array, or default to the value
      const exactCountry = this.countries.find(c => c.toLowerCase() === value.toLowerCase()) || value;
      this.selectedCountry.set(exactCountry);
    } 
    else if (type === 'genre') {
      const exactGenre = this.genres.find(g => g.toLowerCase() === value.toLowerCase()) || value;
      this.selectedGenre.set(exactGenre);
    }
    
    // Reset to page 1 and scroll to top
    this.currentPage.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateSort(sortType: string) {
    this.sortBy.set(sortType as 'date' | 'name' | 'score');
    this.currentPage.set(1);
    this.selectedPreview.set(null);
    this.showSortMenu.set(false); // Closes the dropdown after selection
  }
  
  currentPage = signal(1);

  gridColumns = computed(() => Math.ceil(Math.sqrt(this.gridSize())));

  itemsPerPage = computed(() => this.viewMode() === 'grid' ? this.gridSize() : 7);

  genres = ['Rock', 'Pop', 'Jazz', 'Soul', 'Electronica', 'Hip Hop', 'Indie', 'Folk', 'Metal', 'Classical', 'Reggae', 'Blues', 'Country'];
  decades = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
  countries = ['US', 'UK', 'Brazil', 'Japan', 'Germany', 'France', 'Canada'];

  showAllGenres = signal(false);
  showAllCountries = signal(false);

  displayedGenres = computed(() => {
    return this.showAllGenres() ? this.genres : this.genres.slice(0, 7);
  });

  displayedCountries = computed(() => {
    return this.showAllCountries() ? this.countries : this.countries.slice(0, 5);
  });

  availableYears = computed(() => {
    const decade = this.selectedDecade();
    if (!decade) return [];
    const start = parseInt(decade.replace('s', ''), 10);
    return Array.from({ length: 10 }, (_, i) => (start + i).toString());
  });

  filteredReviews = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const genre = this.selectedGenre()?.toLowerCase(); 
    const decade = this.selectedDecade();
    const year = this.selectedYear();
    const country = this.selectedCountry()?.toLowerCase();

    const filteredArray =  this.reviews().filter((review: any) => {
      
      const reviewAlbum = review.album ? review.album.toLowerCase() : '';
      const matchesSearch = !term || reviewAlbum.includes(term);

      let matchesGenre = true;
      if (genre) {
        const reviewGenres = review.genres || review.genre || '';
        const normalizedGenres = Array.isArray(reviewGenres) 
            ? reviewGenres.join(', ').toLowerCase() 
            : reviewGenres.toLowerCase();
        
        matchesGenre = normalizedGenres.includes(genre);
      }

      const rawYear = review.year || review.releaseDate || '';
      const reviewYear = rawYear.toString();
      
      const matchesDecade = !decade || reviewYear.startsWith(decade.slice(0, 3));
      const matchesYear = !year || reviewYear.startsWith(year);

      const reviewCountry = review.country ? review.country.toLowerCase().trim() : '';
      const matchesCountry = !country || reviewCountry === country.trim();
      

      return matchesSearch && matchesGenre && matchesDecade && matchesYear && matchesCountry;
    });

    filteredArray.sort((a: any, b: any) => {
      const currentSort = this.sortBy();

      if (currentSort === 'date') {
        // Sort by Recency (Newest first)
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA); 
      } 
      else if (currentSort === 'name') {
        // Sort by Album Name (A-Z)
        const nameA = a.album || '';
        const nameB = b.album || '';
        return nameA.localeCompare(nameB);
      } 
      else if (currentSort === 'score') {
        // Sort by Recommendation Score (Highest first)
        // We use Number() to ensure we are comparing mathematical values
        const scoreA = a.score != null ? Number(a.score) : 0;
        const scoreB = b.score != null ? Number(b.score) : 0;
        return scoreB - scoreA;
      }
      
      return 0; // Default fallback
    });

    if (this.showLatestOnly()) {
      return filteredArray.slice(0, 7);
    }

    return filteredArray;
  });

  paginatedReviews = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredReviews().slice(startIndex, startIndex + this.itemsPerPage());
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredReviews().length / this.itemsPerPage());
  });

  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const middle = Math.ceil(total / 2);

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    pages.add(current);
    
    if (current > 1) pages.add(current - 1);
    if (current < total) pages.add(current + 1);
    
    
    if (middle > 2 && middle < total - 1) {
      pages.add(middle);
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const result: (number | string)[] = [];

    for (let i = 0; i < sortedPages.length; i++) {
      result.push(sortedPages[i]);
      if (i < sortedPages.length - 1) {
        const diff = sortedPages[i + 1] - sortedPages[i];
        if (diff === 2) {
          result.push(sortedPages[i] + 1);
        } else if (diff > 2) {
          result.push('...');
        }
      }
    }

    return result;
  });

  paginationText = computed(() => {
    const total = this.filteredReviews().length;
    if (total === 0) return this.langService.t('collection.noReviews');

    const start = ((this.currentPage() - 1) * this.itemsPerPage()) + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), total);

    return this.langService.lang() === 'pt'
      ? `Mostrando ${start}-${end} de ${total} resenhas`
      : `Showing ${start}-${end} out of ${total} reviews`;
  });

  updateSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.selectedPreview.set(null);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.selectedPreview.set(null);
    }
  }

  setListView() {
    this.viewMode.set('list');
    this.showFilters.set(true);
    this.currentPage.set(1);
    this.selectedPreview.set(null);
  }

  setGridView() {
    this.viewMode.set('grid');
    this.showFilters.set(false);
    this.currentPage.set(1);
    this.selectedPreview.set(null);
  }

  updateGridSize(event: any) {
    this.gridSize.set(Number(event));
    this.currentPage.set(1);
  }

  toggleGenre(genre: string) {
    this.selectedGenre.update(v => v === genre ? null : genre);
    this.currentPage.set(1);
    this.selectedPreview.set(null);
  }

  selectDecade(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedDecade.set(val === '' ? null : val);
    this.selectedYear.set(null);
    this.currentPage.set(1);
    this.selectedPreview.set(null);
  }

  selectYear(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedYear.set(val === '' ? null : val);
    this.currentPage.set(1);
    this.selectedPreview.set(null); // Clear preview
  }

  toggleCountry(country: string) {
    this.selectedCountry.update(v => v === country ? null : country);
    this.currentPage.set(1);
    this.selectedPreview.set(null); // Clear preview
  }

  displayContext(review: any): string {
    return this.langService.lang() === 'pt' && review.contextPt
      ? review.contextPt
      : (review.context || this.langService.t('search.descFallback'));
  }

  displayIntro(review: any): string {
    const text = this.langService.lang() === 'pt' && review.introductionPt
      ? review.introductionPt
      : review.introduction;
    return this.getPreviewIntro(text);
  }

  getPreviewIntro(text: string | undefined): string {
    if (!text) return 'No introduction written yet.';
    
    const cleanText = text.replace(/[*#_>]/g, '').trim();
    
    const firstSentence = cleanText.match(/^.*?[.!?](?:\s|$)/);
    
    if (firstSentence) {
      return firstSentence[0].trim();
    }
    
    return cleanText.length > 120 ? cleanText.substring(0, 120) + '...' : cleanText;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return this.langService.lang() === 'pt' ? 'Data desconhecida' : 'Unknown Date';

    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const reviewDate = new Date(year, month - 1, day);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - reviewDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const locale = this.langService.lang() === 'pt' ? 'pt-BR' : 'en-US';

    if (diffDays === 0) {
      return this.langService.t('collection.today');
    } else if (diffDays === 1) {
      return this.langService.t('collection.yesterday');
    } else if (diffDays > 1 && diffDays < 7) {
      return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(reviewDate);
    } else {
      return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(reviewDate);
    }
  }

}