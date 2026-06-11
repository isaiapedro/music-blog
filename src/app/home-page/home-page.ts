import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ImgFadeDirective } from '../shared/img-fade.directive';
import { environment } from '../../environments/environment';
import { LanguageService } from '../shared/language.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, ImgFadeDirective],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  langService = inject(LanguageService);

  searchTerm = signal('');
  selectedTheme = signal('All');

  themes = ['All', 'Music', 'Technology', 'Literature', 'Travel', 'Fashion'];

  articles = signal<any[]>([]);

  ngOnInit() {
    // Fetch ONLY published articles from the DB
    this.http.get<{articles: any[]}>(`${environment.apiUrl}/articles?published=true`)
      .subscribe({
        next: (data) => this.articles.set(data.articles),
        error: (err) => console.error('Failed to load articles', err)
      });
  }
  
  filteredArticles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const activeTheme = this.selectedTheme().toLowerCase();
    
    return this.articles().filter(article => {
      // 1. Safe extraction (prevents crashes if an old draft is missing a field)
      const title = article.title?.toLowerCase() || '';
      const keywords = article.keywords?.toLowerCase() || '';
      const theme = article.theme?.toLowerCase() || '';

      // 2. Filter logic
      const matchesSearch = title.includes(term) || keywords.includes(term);
      const matchesTheme = activeTheme === 'all' || theme === activeTheme; // Strict theme match
      
      return matchesSearch && matchesTheme;
    });
  });

  // --- CURATION LOGIC ---

  mainArticle = computed(() => {
    // If actively searching/filtering, just return the top result
    if (this.searchTerm() || this.selectedTheme() !== 'All') {
      return this.filteredArticles()[0];
    }
    // Otherwise, find the curated "main" post, or fallback to the absolute newest post
    return this.articles().find(a => a.placement === 'main') || this.articles()[0];
  });

  sideArticle = computed(() => {
    // If actively searching/filtering, return the second result
    if (this.searchTerm() || this.selectedTheme() !== 'All') {
      return this.filteredArticles()[1];
    }
    // Otherwise, find the curated "side" post, or fallback to the second newest post
    // (We also ensure it doesn't accidentally pick the main article if fallback triggers)
    const mainId = this.mainArticle()?.id;
    return this.articles().find(a => a.placement === 'side' && a.id !== mainId) 
        || this.articles().find(a => a.id !== mainId);
  });

  listArticles = computed(() => {
    const mainId = this.mainArticle()?.id;
    const sideId = this.sideArticle()?.id;
    
    // Take the actively filtered list, remove the main and side posts, and grab the first 5
    return this.filteredArticles()
      .filter(a => a.id !== mainId && a.id !== sideId)
      .slice(0, 5);
  });

  onSearch(text: string) {
    this.router.navigate(['/article-search-page'], { queryParams: { text: text } });
  } 

  setTheme(theme: string) {
    // Navigates to the articles page and passes the theme as a URL query parameter!
    this.router.navigate(['/articles-page'], { queryParams: { theme: theme } });
  }
}