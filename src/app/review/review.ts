import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { HttpClient } from '@angular/common/http';

export interface Track {
  number: number;
  title: string;
  duration: string;
}

export interface ReviewBlock {
  type: 'paragraph' | 'image' | 'music';
  title?: string;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
  spotifyId?: string;
  youtubeMusicId?: string;
}

export interface ReviewDetail {
  id: number | string;
  album: string;
  artist?: string;
  score?: number;
  releaseDate?: string;
  year?: number | string;
  date?: string;
  label?: string;
  genre?: string;
  genres?: string | string[];
  image: string;
  tracklist?: Track[];
  totalDuration?: string;
  producer?: string;
  recordedAt?: string;
  context?: string;
  introduction?: string;
  breakdown?: ReviewBlock[];
  conclusion?: string;
  similarAlbums?: Array<{ id: string | number; image: string; album: string; artist: string, releaseDate: string }>;
  comments?: Array<{ user: string; date: string; text: string }>;
}
 
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [RouterModule, MarkdownComponent],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class ReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  review = signal<ReviewDetail | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      const id = idParam ? String(idParam) : null;
      
      if (!id) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      

      this.http.get<{ reviews: ReviewDetail[] }>('/data/reviews.json').subscribe({
        next: (data) => {
          const foundReview = data.reviews.find((r) => String(r.id) === id);
          this.review.set(foundReview || null);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching review data:', error);
          this.isLoading.set(false);
        }
      });
    });
  }

  getGenreList(content: ReviewDetail): string[] {
    const genres = content.genre;
    if (!genres) return [];
    
    if (Array.isArray(genres)) {
      return genres;
    }
    return genres.split(',').map(g => g.trim());
  }

  getStars(score: number): string[] {
    const stars = [];
    const rating = score / 2;
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  getScoreMessage(score: number): string {
    if (score >= 9.5) return 'An Absolute Masterpiece';
    if (score >= 8.5) return 'Essential Listening';
    if (score >= 7.5) return 'Highly Recommended';
    if (score >= 6.0) return 'A Solid Record';
    if (score >= 5.0) return 'Average & Flawed';
    if (score >= 3.0) return 'Disappointing';
    return 'Not Recommended';
  }

  spotifyEmbedUrl(albumId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://open.spotify.com/embed/album/${albumId}`
    );
  }

  youtubeEmbedUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`
    );
  }
}