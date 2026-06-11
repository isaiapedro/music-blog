import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { LanguageService } from '../shared/language.service';

@Component({
  selector: 'app-article-search-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './article-search.html',
  styleUrl: './article-search.css'
})
export class ArticleSearchPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  langService = inject(LanguageService);

  @ViewChild('searchBox') searchInput!: ElementRef<HTMLInputElement>;

  searchTerm = signal('');
  selectedTheme = signal('All');

  isArticlesExpanded = signal(false); 
  isReviewsExpanded = signal(false);

  themes = ['All', 'Music', 'Technology', 'Literature', 'Travel', 'Fashion'];
  
  articles = signal<any[]>([]);
  reviews = signal<any[]>([]);

  ngOnInit() {
    this.http.get<{articles: any[]}>(`${environment.apiUrl}/articles?published=true`)
      .subscribe({
        next: (data) => this.articles.set(data.articles),
        error: (err) => console.error(err)
      });

    this.http.get<{reviews: any[]}>(`${environment.apiUrl}/reviews?published=true`)
      .subscribe({
        next: (data) => this.reviews.set(data.reviews),
        error: (err) => console.error('Failed to load reviews', err)
      });

    this.route.queryParams.subscribe(params => {
      if (params['theme']) {
        this.selectedTheme.set(params['theme']);
      }
      if (params['text']) {
        this.searchTerm.set(params['text']);
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
  }

  // ==========================================
  // ARTICLES: Weighted Search Algorithm
  // ==========================================
  filteredArticles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const theme = this.selectedTheme().toLowerCase();
    
    // 1. Map to score
    const scoredArticles = this.articles().map(article => {
      let score = 0;
      
      // Safety check: Ensure strings exist before checking them
      const title = article.title?.toLowerCase() || '';
      const keywords = article.keywords?.toLowerCase() || ''; // Ready for your new keywords!
      const description = article.description?.toLowerCase() || '';

      // Check theme first. If it fails the theme, it gets a 0 instantly.
      const matchesTheme = theme === 'all' || keywords.includes(theme);
      if (!matchesTheme) return { article, score: 0 };

      // If the search bar is empty, just pass it through with a default score of 1
      if (term === '') return { article, score: 1 };

      // 2. Apply Priority Weights
      if (title.includes(term)) score += 3;       // Priority 1
      if (keywords.includes(term)) score += 2;    // Priority 2
      if (description.includes(term)) score += 1; // Priority 3

      return { article, score };
    });

    // 3. Filter out zeroes, Sort highest to lowest, and Map back to raw articles
    return scoredArticles
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.article);
  });


  // ==========================================
  // REVIEWS: Weighted Search Algorithm
  // ==========================================
  filteredReviews = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    
    // If search is empty, just return the raw array
    if (term === '') return this.reviews();

    // 1. Map to score
    const scoredReviews = this.reviews().map(review => {
      let score = 0;
      
      const album = review.album?.toLowerCase() || '';
      const artist = review.artist?.toLowerCase() || '';
      const context = review.context?.toLowerCase() || '';
      
      // We'll keep your deep content search alive, but give it a low priority (0.5) 
      // so it never outranks the title or artist!
      const deepContent = `
        ${review.description || ''} 
        ${review.introduction || ''} 
        ${review.conclusion || ''}
      `.toLowerCase();

      // 2. Apply Priority Weights
      if (album.includes(term)) score += 3;         // Priority 1
      if (artist.includes(term)) score += 2;        // Priority 2
      if (context.includes(term)) score += 1;       // Priority 3
      if (deepContent.includes(term)) score += 0.5; // Deep Search Backup

      return { review, score };
    });

    // 3. Filter out zeroes, Sort highest to lowest, and Map back to raw reviews
    return scoredReviews
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.review);
  });

  displayArticleTitle(article: any): string {
    return this.langService.lang() === 'pt' && article.titlePt ? article.titlePt : article.title;
  }

  displayArticleDesc(article: any): string {
    return this.langService.lang() === 'pt' && article.descriptionPt
      ? article.descriptionPt
      : (article.description || this.langService.t('search.descFallback'));
  }

  displayReviewContext(review: any): string {
    return this.langService.lang() === 'pt' && review.contextPt
      ? review.contextPt
      : (review.context || this.langService.t('search.descFallback'));
  }

  onSearch(text: string) {
    if (text === '') {
      this.router.navigate(['/articles-page'], { state: { keepFocus: true } });
    } else {
      this.router.navigate(['/article-search-page'], { queryParams: { text: text } });
    }
    this.isArticlesExpanded.set(false);
    this.isReviewsExpanded.set(false);
  }

  setTheme(theme: string) {
    if (this.selectedTheme() === theme) {
      this.selectedTheme.set('All');
    } else {
      this.selectedTheme.set(theme);
    }
    this.isArticlesExpanded.set(false);
    this.isReviewsExpanded.set(false);
  }
}