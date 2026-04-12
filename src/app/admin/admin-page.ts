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
  // Replace with your actual backend URL if different
  private apiUrl = 'http://localhost:3000/api'; 

  reviews = signal<any[]>([]);
  selectedReview = signal<any | null>(null);
  isSaving = signal(false);

  drafts = computed(() => this.reviews().filter((r) => !r.published));
  published = computed(() => this.reviews().filter((r) => r.published));

  ngOnInit() {
    // Fetch directly from the database!
    this.http.get<{ reviews: any[] }>(`${this.apiUrl}/reviews`).subscribe(data => {
      this.reviews.set(data.reviews);
    });
  }

  selectReview(review: any) {
    this.selectedReview.set(review);
  }

  togglePublished(review: any, isPublished: boolean) {
    review.published = isPublished;
    this.reviews.set([...this.reviews()]); 
  }

  // --- MISSING FUNCTIONS ADDED BACK HERE ---

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

  // ------------------------------------------

  // NEW DATABASE SAVE FUNCTION
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
}