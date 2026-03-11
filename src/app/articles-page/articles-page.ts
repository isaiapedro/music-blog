import { Component, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ARTICLES } from '../article.data';

@Component({
  selector: 'app-article-page',
  imports: [RouterModule, FormsModule],
  templateUrl: './articles-page.html',
  styleUrl: './articles-page.css',
})

export class ArticlePage {
  articles = signal(ARTICLES);
  searchTerm = signal('');

  filteredArticles = computed(() => {
    const term = this.searchTerm().toLowerCase();

    return this.articles().filter((article: any) => {
      const matchesSearch = article.title.toLowerCase().includes(term);
      
      return matchesSearch;
    });
  });

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

}