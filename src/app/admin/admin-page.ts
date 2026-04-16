import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})

export class AdminPage implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

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
  showArticles = signal<boolean>(true); 
  articles = signal<any[]>([]);
  selectedArticle = signal<any | null>(null);

  articleDrafts = computed(() => this.articles().filter((a) => !a.published));
  articlePublished = computed(() => this.articles().filter((a) => a.published));

  isUploadingImage = signal(false);
  showCopySuccess = signal(false);

  ngOnInit() {
    this.http.get<{ reviews: any[] }>(`${this.apiUrl}/reviews`).subscribe(data => {
      this.reviews.set(data.reviews);
    });

    this.http.get<{ articles: any[] }>(`${this.apiUrl}/articles`).subscribe(data => {
      this.articles.set(data.articles);
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
    this.selectedReview.set(null); 
  }

  toggleArticlePublished(article: any, isPublished: boolean) {
    article.published = isPublished;
    this.articles.set([...this.articles()]); 
  }

  // --- ARTICLE MANAGEMENT --- 

  triggerFileInput() {
    document.getElementById('articleImageUpload')?.click();
  }

  uploadArticleImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('image', file);

    this.isUploadingImage.set(true);

    // Send to your Express backend
    this.http.post<{url: string}>('http://localhost:3000/api/upload', formData)
      .subscribe({
        next: (response) => {
          // Build the Markdown string automatically
          const markdownImageString = `\n![Alt Text Here](${response.url})\n`;
          
          // Write the string directly to the clipboard
          navigator.clipboard.writeText(markdownImageString).then(() => {
            
            this.isUploadingImage.set(false);
            this.showCopySuccess.set(true);
            
            // Clear the file input so you can upload the same file again if needed
            input.value = '';

            // Hide the success message after 3.5 seconds
            setTimeout(() => {
              this.showCopySuccess.set(false);
            }, 3500);
            
          }).catch(err => {
            console.error('Failed to copy to clipboard', err);
            this.isUploadingImage.set(false);
            alert('Uploaded, but failed to copy to clipboard. URL: ' + response.url);
          });
        },
        error: (err) => {
          console.error('Failed to upload article image:', err);
          this.isUploadingImage.set(false);
          alert('Image upload failed. Check server logs.');
        }
      });
  }

  uploadAudio(event: Event, block: any) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('audio', file);

    // We are creating a new signal state for audio loading if you want, or just reuse the existing one!
    this.http.post<{url: string}>('http://localhost:3000/api/upload-audio', formData)
      .subscribe({
        next: (response) => {
          // Inject the S3 URL into the block
          block.audioUrl = response.url;
          console.log('Successfully uploaded audio to S3:', response.url);
        },
        error: (err) => {
          console.error('Failed to upload audio:', err);
          alert('Audio upload failed. Check server logs. Is the file under 15MB?');
        }
      });
  }

  // --- REVIEW BLOCK MANAGEMENT (Kept intact for Reviews) ---
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

  addImageBlock() {
    const currentReview = this.selectedReview();
    if (currentReview) {
      if (!currentReview.breakdown) {
        currentReview.breakdown = [];
      }
      
      // We match the exact structure your review.html is expecting!
      currentReview.breakdown.push({
        type: 'image',
        imageUrl: '',
        imageAlt: ''
      });
    }
  }

  // Step 4: Handle the file upload to your existing Express S3 endpoint
  uploadImage(event: Event, block: any) {
    // Extract the file from the HTML input event
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Prepare the data as multipart/form-data
    const formData = new FormData();
    formData.append('image', file);

    // Note: Adjust the URL if your backend is hosted elsewhere
    this.http.post<{url: string}>('http://localhost:3000/api/upload', formData)
      .subscribe({
        next: (response) => {
          // Once AWS S3 returns the URL, we automatically inject it into the block!
          block.imageUrl = response.url;
          console.log('Successfully uploaded to S3:', response.url);
        },
        error: (err) => {
          console.error('Failed to upload image:', err);
          alert('Image upload failed. Check server logs.');
        }
      });
  }

  removeBlock(index: number) {
    this.selectedReview().breakdown.splice(index, 1);
  }

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
    this.isSaving.set(true); 

    this.http.post<any>(`${this.apiUrl}/articles`, {}).subscribe({
      next: (newDraft) => {
        this.articles.update(current => [newDraft, ...current]);
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

  deleteCurrentArticle() {
    const article = this.selectedArticle();
    if (!article) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${article.title}"? This cannot be undone.`);
    if (!confirmed) return;

    this.isSaving.set(true); 

    this.http.delete(`${this.apiUrl}/articles/${article.id}`).subscribe({
      next: () => {
        this.articles.update(currentList => currentList.filter(a => a.id !== article.id));
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