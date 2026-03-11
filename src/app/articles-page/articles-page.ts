import { Component, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ARTICLES } from '../article.data';

@Component({
  selector: 'app-articles-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './articles-page.html',
  styleUrl: './articles-page.css'
})
export class ArticlesPage {
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
  sideArticles = computed(() => this.filteredArticles().slice(1, 3));
  listArticles = computed(() => {
    return this.filteredArticles().slice(0, 5);
  });

  setTheme(theme: string) {
    
  if (this.selectedTheme() === theme) {
    this.selectedTheme.set('All');
  } else {
    this.selectedTheme.set(theme);
  }
}
}