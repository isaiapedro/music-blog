import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ARTICLES } from '../article.data';

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

  searchTerm = signal('');
  selectedTheme = signal('All');
  isExpanded = signal(false); // Controls the Show More toggle
  
  themes = ['All', 'Music', 'Technology', 'Literature', 'Travel', 'Fashion'];
  articles = signal(ARTICLES);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['theme']) {
        this.selectedTheme.set(params['theme']);
      }
      if (params['text']) {
        this.searchTerm.set(params['text']);
      }
    });
  }

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

  onSearch(text: string, inputElement?: HTMLInputElement) {
    if (text=='') {
      this.router.navigate(['/articles-page']);
    } else {
    this.router.navigate(['/article-search-page'], { queryParams: { text: text } });
    }
    this.isExpanded.set(false);
    
    if (text === '' && inputElement) {
      setTimeout(() => {
        inputElement.focus();
      }, 50); 
    }
  }

  setTheme(theme: string) {
    if (this.selectedTheme() === theme) {
      this.selectedTheme.set('All');
    } else {
      this.selectedTheme.set(theme);
    }
    this.isExpanded.set(false);
  }
}