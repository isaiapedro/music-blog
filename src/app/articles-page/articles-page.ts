import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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

  searchTerm = signal('');
  selectedTheme = signal('All');
  isExpanded = signal(false); // Controls the Show More toggle
  
  themes = ['All', 'Music', 'Technology', 'Literature', 'Travel', 'Fashion'];
  
  articles = signal<any[]>([]);

  ngOnInit() {
    this.http.get<{articles: any[]}>(`${environment.apiUrl}/articles?published=true`)
      .subscribe({
        next: (data) => this.articles.set(data.articles),
        error: (err) => console.error(err)
      });
      
    this.route.queryParams.subscribe(params => {
      if (params['theme']) {
        this.selectedTheme.set(params['theme']);
      }
    });
  }

  ngAfterViewInit() {
    if (this.shouldFocus) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 100); 
    }
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
    if (this.selectedTheme() === theme) {
      this.selectedTheme.set('All');
    } else {
      this.selectedTheme.set(theme);
    }
    this.isExpanded.set(false);
  }
}