import { Component, signal, computed, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ARTICLES } from '../article.data';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
  private router = inject(Router);

  searchTerm = signal('');
  selectedTheme = signal('All');
  
  themes = ['All', 'Music', 'Technology', 'Literature', 'Travel', 'Fashion'];

  articles = signal(ARTICLES);

  filteredArticles = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const theme = this.selectedTheme().toLowerCase();
    
    return this.articles().filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(term) || 
                            article.keywords.toLowerCase().includes(term);
      const matchesTheme = theme === 'all' || article.keywords.toLowerCase().includes(theme);
      return matchesSearch && matchesTheme;
    });
  });

  mainArticle = computed(() => this.filteredArticles()[0]);
  sideArticle = computed(() => this.filteredArticles()[1]);
  listArticles = computed(() => {
    return this.filteredArticles().slice(2, 7);
  });

  onSearch(text: string) {
    this.router.navigate(['/article-search-page'], { queryParams: { text: text } });
  } 

  setTheme(theme: string) {
    // Navigates to the articles page and passes the theme as a URL query parameter!
    this.router.navigate(['/articles-page'], { queryParams: { theme: theme } });
  }
}