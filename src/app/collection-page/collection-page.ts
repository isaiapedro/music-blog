import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Review } from '../review.data';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-collection-page',
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css'
})

export class CollectionPage implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  reviews = signal<Review[]>([]);

  showLatestOnly = signal(false);

  // Add your API url
  private apiUrl = 'http://localhost:3000/api';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.showLatestOnly.set(params['filter'] === 'latest');
    });

    // Query the database, asking specifically for published=true
    this.http.get<{ reviews: Review[] }>(`${this.apiUrl}/reviews?published=true`).subscribe({
      next: (data) => {
        // Data is now live from the database!
        this.reviews.set(data.reviews); 
      },
      error: (error) => {
        console.error('Error fetching live reviews:', error);
      }
    });
  }
  
  searchTerm = signal('');
  selectedGenre = signal<string | null>(null);
  selectedDecade = signal<string | null>(null);
  selectedYear = signal<string | null>(null);
  selectedCountry = signal<string | null>(null);

  selectedPreview = signal<any | null>(null);
  
  togglePreview(review: any) {
    if (this.selectedPreview()?.id === review.id) {
      this.selectedPreview.set(null);
    } else {
      this.selectedPreview.set(review);
    }
  }

  currentPage = signal(1);
  itemsPerPage = 7;

  genres = ['Rock', 'Pop', 'Jazz', 'Soul', 'Electronic', 'Hip Hop', 'Indie', 'Folk', 'Metal', 'Classical', 'Reggae', 'Blues', 'Country'];
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

      const reviewCountry = review.country ? review.country.toLowerCase() : '';
      const matchesCountry = !country || reviewCountry === country;
      

      return matchesSearch && matchesGenre && matchesDecade && matchesYear && matchesCountry;
    });

    filteredArray.sort((a: any, b: any) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA); 
    });

    if (this.showLatestOnly()) {
      return filteredArray.slice(0, 7);
    }

    return filteredArray;
  });

  paginatedReviews = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredReviews().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredReviews().length / this.itemsPerPage);
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
    if (total === 0) return 'No reviews found';

    const start = ((this.currentPage() - 1) * this.itemsPerPage) + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage, total);

    return `Showing ${start}-${end} out of ${total} reviews`;
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
    if (!dateString) return 'Unknown Date';

    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString; // Fallback if format is weird

    const reviewDate = new Date(year, month - 1, day);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - reviewDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays < 7) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(reviewDate);
    } else {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(reviewDate);
    }
  }

}