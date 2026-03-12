import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
export class ArticlesPage implements OnInit {
  private route = inject(ActivatedRoute);

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

  setTheme(theme: string) {
    if (this.selectedTheme() === theme) {
      this.selectedTheme.set('All');
    } else {
      this.selectedTheme.set(theme);
    }
    this.isExpanded.set(false);
  }

  readonly fallbackImage = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop';

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && this.fallbackImage) {
      img.src = this.fallbackImage;
    }
  }
}