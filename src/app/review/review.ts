import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { HttpClient } from '@angular/common/http';

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
  releaseDate?: string;
  year?: number | string;
  date?: string;
  label?: string;
  genre?: string;
  genres?: string | string[];
  image: string;
  description: string;
  context?: string;
  introduction?: string;
  breakdown?: ReviewBlock[];
  conclusion?: string;
  similarAlbums?: Array<{ id: string | number; image: string; album: string; artist: string }>;
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
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? String(idParam) : null;
    
    if (!id) {
      this.isLoading.set(false);
      return;
    }

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
  }

  getGenreList(content: ReviewDetail): string[] {
    const genres = content.genre;
    if (!genres) return [];
    
    if (Array.isArray(genres)) {
      return genres;
    }
    return genres.split(',').map(g => g.trim());
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