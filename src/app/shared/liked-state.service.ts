import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LikedStateService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private likedIds = signal<Set<number>>(new Set());
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.http.get<{ ids: number[] }>(`${this.apiUrl}/visitor-liked-review-ids`, { withCredentials: true }).subscribe({
      next: ({ ids }) => this.likedIds.set(new Set(ids)),
    });
  }

  isLiked(id: number | string): boolean {
    return this.likedIds().has(Number(id));
  }

  setLiked(id: number | string, liked: boolean) {
    const next = new Set(this.likedIds());
    if (liked) next.add(Number(id)); else next.delete(Number(id));
    this.likedIds.set(next);
  }
}
