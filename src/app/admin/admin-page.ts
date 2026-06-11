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

  uploadingCover = signal(false);
  uploadingBlockIndex = signal<number | null>(null);

  // --- LANGUAGE ---
  editingLang = signal<'en' | 'pt'>('en');
  isTranslating = signal(false);

  // --- SHARE CARD ---
  isGeneratingCard = signal(false);

  // --- COMMENTS ---
  replyDrafts = signal<Record<number, string>>({});

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

  addReviewImageBlock() {
    const review = this.selectedReview();
    if (!review.breakdown) review.breakdown = [];
    review.breakdown.push({ type: 'image', imageUrl: '', title: '' });
  }

  onReviewBlockImageFileChange(event: Event, review: any, blockIndex: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    
    this.uploadingBlockIndex.set(blockIndex);
    const body = new FormData();
    body.append('image', file);
    
    this.http.post<{ url: string }>(`${this.apiUrl}/upload`, body).subscribe({
      next: (res) => {
        const blocks = review.breakdown;
        if (blocks && blocks[blockIndex]?.type === 'image') {
          blocks[blockIndex].imageUrl = res.url;
        }
        // Force angular reactivity update
        this.reviews.set([...this.reviews()]);
        this.uploadingBlockIndex.set(null);
        input.value = '';
      },
      error: (err) => {
        console.error(err);
        const msg = typeof err.error?.error === 'string' ? err.error.error : 'Upload failed';
        alert(msg);
        this.uploadingBlockIndex.set(null);
        input.value = '';
      }
    });
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

  removeArticleBlockPt(index: number) {
    const article = this.selectedArticle();
    if (article?.contentBlocksPt) article.contentBlocksPt.splice(index, 1);
  }

  onArticleCoverFileChange(event: Event, article: any) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingCover.set(true);
    const body = new FormData();
    body.append('image', file);
    this.http.post<{ url: string }>(`${this.apiUrl}/upload`, body).subscribe({
      next: (res) => {
        article.image = res.url;
        this.articles.set([...this.articles()]);
        this.uploadingCover.set(false);
        input.value = '';
      },
      error: (err) => {
        console.error(err);
        const msg =
          typeof err.error?.error === 'string' ? err.error.error : 'Upload failed';
        alert(msg);
        this.uploadingCover.set(false);
        input.value = '';
      }
    });
  }

  onArticleBlockImageFileChange(event: Event, article: any, blockIndex: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingBlockIndex.set(blockIndex);
    const body = new FormData();
    body.append('image', file);
    this.http.post<{ url: string }>(`${this.apiUrl}/upload`, body).subscribe({
      next: (res) => {
        const blocks = article.contentBlocks;
        if (blocks && blocks[blockIndex]?.type === 'image') {
          blocks[blockIndex].imageUrl = res.url;
        }
        this.articles.set([...this.articles()]);
        this.uploadingBlockIndex.set(null);
        input.value = '';
      },
      error: (err) => {
        console.error(err);
        const msg =
          typeof err.error?.error === 'string' ? err.error.error : 'Upload failed';
        alert(msg);
        this.uploadingBlockIndex.set(null);
        input.value = '';
      }
    });
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

  deleteComment(type: 'articles' | 'reviews', contentId: number, index: number) {
    if (!confirm('Delete this comment?')) return;
    this.http.delete<{ comments: any[] }>(`${this.apiUrl}/admin/${type}/${contentId}/comments/${index}`).subscribe({
      next: (res) => {
        if (type === 'articles') {
          const a = this.selectedArticle();
          if (a) { a.comments = res.comments; this.articles.set([...this.articles()]); }
        } else {
          const r = this.selectedReview();
          if (r) { r.comments = res.comments; this.reviews.set([...this.reviews()]); }
        }
        const drafts = { ...this.replyDrafts() };
        delete drafts[index];
        this.replyDrafts.set(drafts);
      },
      error: () => alert('Failed to delete comment.')
    });
  }

  saveReply(type: 'articles' | 'reviews', contentId: number, index: number) {
    const text = this.replyDrafts()[index] ?? '';
    this.http.put<{ comments: any[] }>(`${this.apiUrl}/admin/${type}/${contentId}/comments/${index}/reply`, { text }).subscribe({
      next: (res) => {
        if (type === 'articles') {
          const a = this.selectedArticle();
          if (a) { a.comments = res.comments; this.articles.set([...this.articles()]); }
        } else {
          const r = this.selectedReview();
          if (r) { r.comments = res.comments; this.reviews.set([...this.reviews()]); }
        }
      },
      error: () => alert('Failed to save reply.')
    });
  }

  setReplyDraft(index: number, text: string) {
    this.replyDrafts.update(d => ({ ...d, [index]: text }));
  }

  initReplyDraft(index: number, existing: string) {
    if (this.replyDrafts()[index] === undefined) {
      this.replyDrafts.update(d => ({ ...d, [index]: existing || '' }));
    }
  }

  autoTranslateArticle() {
    const article = this.selectedArticle();
    if (!article) return;
    this.isTranslating.set(true);
    const payload = {
      textFields: { title: article.title, description: article.description },
      blocks: article.contentBlocks || []
    };
    this.http.post<any>(`${this.apiUrl}/admin/translate`, payload).subscribe({
      next: (res) => {
        article.titlePt = res.translatedFields.title || '';
        article.descriptionPt = res.translatedFields.description || '';
        article.contentBlocksPt = res.translatedBlocks || [];
        this.articles.set([...this.articles()]);
        this.editingLang.set('pt');
        this.isTranslating.set(false);
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.error || err.message || 'Unknown error';
        alert(`Translation failed: ${msg}`);
        this.isTranslating.set(false);
      }
    });
  }

  autoTranslateReview() {
    const review = this.selectedReview();
    if (!review) return;
    this.isTranslating.set(true);
    const payload = {
      textFields: { context: review.context, introduction: review.introduction, conclusion: review.conclusion },
      blocks: review.breakdown || []
    };
    this.http.post<any>(`${this.apiUrl}/admin/translate`, payload).subscribe({
      next: (res) => {
        review.contextPt = res.translatedFields.context || '';
        review.introductionPt = res.translatedFields.introduction || '';
        review.conclusionPt = res.translatedFields.conclusion || '';
        review.breakdownPt = res.translatedBlocks || [];
        this.reviews.set([...this.reviews()]);
        this.editingLang.set('pt');
        this.isTranslating.set(false);
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.error || err.message || 'Unknown error';
        alert(`Translation failed: ${msg}`);
        this.isTranslating.set(false);
      }
    });
  }

  logout() {
    this.auth.logout();
  }

  private async fetchCardBlob(type: 'post' | 'review', payload: object): Promise<Blob> {
    const response = await fetch(`${this.apiUrl}/share-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type, ...payload }),
    });
    if (!response.ok) throw new Error('Card generation failed');
    return response.blob();
  }

  private cardPayload(type: 'post' | 'review'): object {
    if (type === 'post') {
      const a = this.selectedArticle()!;
      return { title: a.title, desc: a.description, image: a.image, category: a.theme };
    } else {
      const r = this.selectedReview()!;
      return { title: r.album, artist: r.artist, image: r.image };
    }
  }

  async downloadCard(type: 'post' | 'review') {
    this.isGeneratingCard.set(true);
    try {
      const blob = await this.fetchCardBlob(type, this.cardPayload(type));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-card.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate card image.');
    } finally {
      this.isGeneratingCard.set(false);
    }
  }

  async shareToInstagram(type: 'post' | 'review') {
    this.isGeneratingCard.set(true);
    try {
      const blob = await this.fetchCardBlob(type, this.cardPayload(type));
      const file = new File([blob], `${type}-card.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Share to Instagram Stories' });
      } else {
        // Desktop fallback: download + show tip
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-card.png`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Image downloaded. Open Instagram on your phone and share it to Stories from your camera roll.');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') alert('Failed to share card.');
    } finally {
      this.isGeneratingCard.set(false);
    }
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