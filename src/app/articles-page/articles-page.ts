import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-articles-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './articles-page.html',
  styleUrl: './articles-page.css'
})
export class ArticlesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  @ViewChild('searchBox') searchInput!: ElementRef<HTMLInputElement>;

  private shouldFocus = false;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['keepFocus']) {
      this.shouldFocus = true;
    }
  }

  // --- STATE SIGNALS ---
  searchTerm = signal('');
  selectedTheme = signal('All');
  
  // --- LOCAL UI STATE ---
  isExpanded = signal(false); // Controls the Show More toggle
  themes = ['All', 'Music', 'Technology', 'Literature', 'Travel', 'Fashion'];
  articles = signal<any[]>([]);

  ngOnInit() {
    this.http.get<{articles: any[]}>('http://localhost:3000/api/articles?published=true')
      .subscribe({
        next: (data) => this.articles.set(data.articles),
        error: (err) => console.error(err)
      });
      
    this.route.queryParams.subscribe(params => {
      this.selectedTheme.set(params['theme'] || 'All');
    });
  }

  ngAfterViewInit() {
    if (this.shouldFocus) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 100); 
    }
  }

  private updateUrl(newParams: any, replaceHistory: boolean = false) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: 'merge', 
      replaceUrl: replaceHistory 
    });
  }

  filteredArticles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const activeTheme = this.selectedTheme().toLowerCase();
    
    return this.articles().filter(article => {
      const title = article.title?.toLowerCase() || '';
      const keywords = article.keywords?.toLowerCase() || '';
      const theme = article.theme?.toLowerCase() || '';

      const matchesSearch = title.includes(term) || keywords.includes(term);
      
      const matchesTheme = activeTheme === 'all' || theme === activeTheme;
      
      return matchesSearch && matchesTheme;
    });
  });

  // --- ACTIONS ---

  onSearch(text: string) {
    if (text === '') {
      // This is the trigger the constructor above is looking for!
      this.router.navigate(['/articles-page'], { state: { keepFocus: true } });
    } else {
      this.router.navigate(['/article-search-page'], { queryParams: { text: text } });
    }
    this.isExpanded.set(false);
  }

  setTheme(theme: string) {
    const newTheme = this.selectedTheme() === theme ? 'All' : theme;
    
    // Pass null if 'All' is selected to completely remove the ?theme= parameter from the URL
    this.updateUrl({ theme: newTheme === 'All' ? null : newTheme });
    
    this.isExpanded.set(false);
  }
}