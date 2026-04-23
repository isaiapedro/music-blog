import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})

export class AdminPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  // Replace with your actual backend URL if different
  private apiUrl = environment.apiUrl;

  // --- REVIEW STATE ---
  showReviews = signal<boolean>(false);
  showDrafts = signal<boolean>(false);
  showPublished = signal<boolean>(false);

  reviews = signal<any[]>([]);
  selectedReview = signal<any | null>(null);
  isSaving = signal(false);

  drafts = computed(() => this.reviews().filter((r) => !r.published));
  published = computed(() => this.reviews().filter((r) => r.published));

  // --- ARTICLE STATE ---
  showArticles = signal<boolean>(true); // Let's default to true to see it!
  articles = signal<any[]>([]);
  selectedArticle = signal<any | null>(null);

  articleDrafts = computed(() => this.articles().filter((a) => !a.published));
  articlePublished = computed(() => this.articles().filter((a) => a.published));

  // --- DASHBOARD STATE ---
  dashboardStats = signal<any>(null);
  selectedDashRange = signal<'week' | 'month' | 'year'>('month');

  ngOnInit() {
    // Fetch Reviews
    this.http.get<{ reviews: any[] }>(`${this.apiUrl}/reviews`).subscribe(data => {
      this.reviews.set(data.reviews);
    });

    // Fetch Articles
    this.http.get<{ articles: any[] }>(`${this.apiUrl}/articles`).subscribe(data => {
      this.articles.set(data.articles);
    });

    // Fetch Dashboard Stats
    this.http.get<any>(`${this.apiUrl}/admin/dashboard`).subscribe({
      next: (data) => this.dashboardStats.set(data),
      error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }

  // --- TOGGLES & SELECTION ---
  toggleReviewList() {
    this.showReviews.update(current => !current);
  }

  toggleDraftsList() {
    this.showDrafts.update(current => !current);
  }

  togglePublishedList() {
    this.showPublished.update(current => !current);
  }

  selectReview(review: any) {
    this.selectedReview.set(review);
    this.selectedArticle.set(null);
  }

  togglePublished(review: any, isPublished: boolean) {
    review.published = isPublished;
    this.reviews.set([...this.reviews()]); 
  }

  toggleArticlesList() {
    this.showArticles.update(c => !c);
  }

  selectArticle(article: any) {
    this.selectedArticle.set(article);
    this.selectedReview.set(null); // Deselect review to clear the main pane
  }

  toggleArticlePublished(article: any, isPublished: boolean) {
    article.published = isPublished;
    this.articles.set([...this.articles()]); // Trigger reactivity
  }

  // --- BLOCK MANAGEMENT ---
  addParagraphBlock() {
    const review = this.selectedReview();
    if (!review.breakdown) review.breakdown = [];
    review.breakdown.push({ type: 'paragraph', content: '' });
  }

  addMusicBlock() {
    const review = this.selectedReview();
    if (!review.breakdown) review.breakdown = [];
    review.breakdown.push({ type: 'music', title: '', spotifyId: '', youtubeMusicId: '' });
  }

  removeBlock(index: number) {
    this.selectedReview().breakdown.splice(index, 1);
  }

  addArticleHeading() {
    const article = this.selectedArticle();
    if (!article.contentBlocks) article.contentBlocks = [];
    article.contentBlocks.push({ type: 'heading', content: '' });
  }

  addArticleParagraph() {
    const article = this.selectedArticle();
    if (!article.contentBlocks) article.contentBlocks = [];
    article.contentBlocks.push({ type: 'paragraph', content: '' });
  }

  addArticleImage() {
    const article = this.selectedArticle();
    if (!article.contentBlocks) article.contentBlocks = [];
    article.contentBlocks.push({ type: 'image', imageUrl: '', caption: '' });
  }

  removeArticleBlock(index: number) {
    this.selectedArticle().contentBlocks.splice(index, 1);
  }

  // ------------------------------------------

  // --- DATABASE SAVE ---
  saveCurrentItem() {
    if (this.selectedReview()) {
      this.saveCurrentReview();
    } else if (this.selectedArticle()) {
      this.saveCurrentArticle();
    } else {
      console.warn("Nothing is selected to save!");
    }
  }
  
  saveCurrentReview() {
    const review = this.selectedReview();
    if (!review) return;

    this.isSaving.set(true);

    // Send the updated review directly to PostgreSQL via Express
    this.http.put(`${this.apiUrl}/reviews/${review.id}`, review).subscribe({
      next: () => {
        alert('Review saved to database!');
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error saving review:', err);
        alert('Failed to save to database.');
        this.isSaving.set(false);
      }
    });
  }

  createNewArticle() {
    this.isSaving.set(true); // Re-use the saving state to prevent double-clicks

    // Call the POST route. We don't even need a body, the backend does all the work!
    this.http.post<any>(`${this.apiUrl}/articles`, {}).subscribe({
      next: (newDraft) => {
        // 1. Push the new draft into our signal array at the very top (using spread operator)
        this.articles.update(current => [newDraft, ...current]);
        
        // 2. Instantly select it so the right-side editor opens up for the user
        this.selectArticle(newDraft);
        
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error creating draft:', err);
        alert('Oops! Failed to create a new draft. Check console.');
        this.isSaving.set(false);
      }
    });
  }

  saveCurrentArticle() {
    const article = this.selectedArticle();
    if (!article) return;

    this.isSaving.set(true);

    this.http.put(`${this.apiUrl}/articles/${article.id}`, article).subscribe({
      next: () => {
        alert('Article saved to database successfully!');
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error saving article:', err);
        alert('Failed to save article.');
        this.isSaving.set(false);
      }
    });
  }

  logout() {
    this.auth.logout();
  }

  deleteCurrentArticle() {
    const article = this.selectedArticle();
    if (!article) return;

    // 1. Ask for confirmation before doing anything destructive
    const confirmed = window.confirm(`Are you sure you want to delete "${article.title}"? This cannot be undone.`);
    if (!confirmed) return;

    this.isSaving.set(true); // Re-use this to prevent button spamming

    // 2. Call the backend DELETE route
    this.http.delete(`${this.apiUrl}/articles/${article.id}`).subscribe({
      next: () => {
        // 3. Remove the article from our local signal array
        this.articles.update(currentList => currentList.filter(a => a.id !== article.id));
        
        // 4. Clear the editor view since the article is gone
        this.selectedArticle.set(null);
        
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error deleting article:', err);
        alert('Failed to delete the article.');
        this.isSaving.set(false);
      }
    });
  }
}