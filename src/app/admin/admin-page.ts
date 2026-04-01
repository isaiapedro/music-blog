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

  fullData: any = null;
  reviews = signal<any[]>([]);
  selectedReview = signal<any | null>(null);

  // Automatically separate reviews for the sidebar
  drafts = computed(() => this.reviews().filter(r => !r.published));
  published = computed(() => this.reviews().filter(r => r.published));

  ngOnInit() {
    // Make sure this points to wherever your JSON is served locally!
    this.http.get('/data/reviews.json').subscribe((data: any) => {
      this.fullData = data;
      this.reviews.set(data.reviews);
    });
  }

  selectReview(review: any) {
    this.selectedReview.set(review);
  }

  // --- "List Widget" Functions for Rich Text ---
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

  // --- SAVE & EXPORT FUNCTION ---
  downloadUpdatedJson() {
    if (!this.fullData) return;

    // Sync the 'published' and 'score' variables back to the listMeta array 
    // so the homepage and collection page know what to show
    const updatedMeta = this.fullData.listMeta.map((m: any) => {
      const updatedRev = this.reviews().find(r => r.id === m.id);
      if (updatedRev) {
        m.published = updatedRev.published;
        m.score = updatedRev.score;
      }
      return m;
    });

    // Package it back into the exact format the app expects
    const finalJson = { reviews: this.reviews(), listMeta: updatedMeta };

    // Generate a downloadable file right from the browser
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalJson, null, 2));
    const anchor = document.createElement('a');
    anchor.href = dataStr;
    anchor.download = "reviews.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}