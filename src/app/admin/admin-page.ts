import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  ReviewContent,
  ReviewListMeta,
  BreakdownBlock,
  BreakdownBlockType,
  ReviewComment,
  SimilarAlbum,
} from '../cms/review-content.model';
import { CMS_API_BASE } from '../cms/cms-api.config';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage implements OnInit {
  private http = inject(HttpClient);
  private apiBase = CMS_API_BASE;

  reviews = signal<ReviewContent[]>([]);
  selected = signal<ReviewContent | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);

  selectedReview = computed(() => this.selected());

  ngOnInit() {
    this.loadReviews();
  }

  private get baseUrl() {
    return '';
  }

  loadReviews() {
    this.error.set(null);
    this.http.get<ReviewContent[]>(`${this.apiBase}/reviews`).subscribe({
      next: (list) => this.reviews.set(list),
      error: (err) => this.error.set(err.message || 'Failed to load reviews'),
    });
  }

  selectReview(review: ReviewContent | null) {
    this.selected.set(review ? { ...review } : null);
    this.error.set(null);
  }

  newReview() {
    this.selectReview({
      id: 0,
      album: '',
      artist: '',
      image: '',
      releaseDate: new Date().getFullYear(),
      label: '',
      genre: '',
      description: '',
      context: '',
      introduction: '',
      breakdown: [],
      conclusion: '',
      similarAlbums: [],
      comments: [],
    });
  }

  saveReview(model: ReviewContent) {
    this.saving.set(true);
    this.error.set(null);
    const isNew = !model.id || model.id === 0;
    const req = isNew
      ? this.http.post<ReviewContent>(`${this.apiBase}/reviews`, model)
      : this.http.put<ReviewContent>(
          `${this.apiBase}/reviews/${model.id}`,
          model
        );
    req.subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (isNew) {
          this.reviews.update((list) => [...list, saved]);
        } else {
          this.reviews.update((list) =>
            list.map((r) => (r.id === saved.id ? saved : r))
          );
        }
        this.selectReview(saved);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.error || err.message || 'Save failed');
      },
    });
  }

  deleteReview(id: number) {
    if (!confirm('Delete this review?')) return;
    this.error.set(null);
    this.http.delete(`${this.apiBase}/reviews/${id}`).subscribe({
      next: () => {
        this.reviews.update((list) => list.filter((r) => r.id !== id));
        this.selectReview(null);
      },
      error: (err) =>
        this.error.set(err.error?.error || err.message || 'Delete failed'),
    });
  }

  addBreakdownBlock(model: ReviewContent, type: BreakdownBlockType) {
    const block: BreakdownBlock = {
      type,
      content: '',
      title: type === 'paragraph' ? 'Section' : undefined,
      imageUrl: type === 'image' ? '' : undefined,
      imageAlt: type === 'image' ? '' : undefined,
      spotifyId: type === 'music' ? '' : undefined,
      youtubeMusicId: type === 'music' ? '' : undefined,
    };
    model.breakdown = [...(model.breakdown || []), block];
  }

  removeBreakdownBlock(model: ReviewContent, index: number) {
    model.breakdown = model.breakdown.filter((_, i) => i !== index);
  }

  addComment(model: ReviewContent) {
    model.comments = [
      ...(model.comments || []),
      { user: '', text: '', date: new Date().toISOString().slice(0, 10) },
    ];
  }

  removeComment(model: ReviewContent, index: number) {
    model.comments = model.comments.filter((_, i) => i !== index);
  }

  addSimilarAlbum(model: ReviewContent) {
    model.similarAlbums = [
      ...(model.similarAlbums || []),
      { id: 0, album: '', artist: '', image: '' },
    ];
  }

  removeSimilarAlbum(model: ReviewContent, index: number) {
    model.similarAlbums = model.similarAlbums.filter((_, i) => i !== index);
  }
}