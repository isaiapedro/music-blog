import { Component, inject, OnInit, signal, DOCUMENT } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { HttpClient } from '@angular/common/http';
import { ImgFadeDirective } from '../shared/img-fade.directive';
import { environment } from '../../environments/environment';

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
  subgenres?: string;
  genres?: string | string[];
  image: string;
  tracklist?: Track[];
  totalDuration?: string;
  producer?: string;
  recordedAt?: string;
  description?: string;
  context?: string;
  introduction?: string;
  breakdown?: ReviewBlock[];
  conclusion?: string;
  similarAlbums?: Array<{ id: string | number; slug?: string; image: string; album: string; artist: string, releaseDate: string }>;
  comments?: Array<{ user: string; date: string; text: string }>;
}
 
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [RouterModule, MarkdownComponent, ImgFadeDirective],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class ReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  private apiUrl = environment.apiUrl;

  review = signal<ReviewDetail | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      window.scrollTo({ top: 0, behavior: 'instant' });

      const slug = params.get('slug') || params.get('id');

      if (!slug) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);

      this.http.get<any>(`${this.apiUrl}/reviews/${slug}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).subscribe({
        next: (data) => {
          this.review.set({
            ...data,
            breakdown: typeof data.breakdown === 'string' ? JSON.parse(data.breakdown) : data.breakdown,
            tracklist: typeof data.tracklist === 'string' ? JSON.parse(data.tracklist) : data.tracklist,
            similarAlbums: typeof data.similarAlbums === 'string' ? JSON.parse(data.similarAlbums) : data.similarAlbums,
          });
          this.isLoading.set(false);
          const pageTitle = `${data.album} — ${data.artist} Review | Isaia`;
          this.titleService.setTitle(pageTitle);
          const desc = data.description || data.context || '';
          this.metaService.updateTag({ name: 'description', content: desc });
          this.metaService.updateTag({ property: 'og:title', content: pageTitle });
          this.metaService.updateTag({ property: 'og:description', content: desc });
          this.metaService.updateTag({ property: 'og:image', content: data.image || '' });
          this.metaService.updateTag({ property: 'og:url', content: window.location.href });
          this.metaService.updateTag({ property: 'og:type', content: 'music.album' });
          this.setCanonical(window.location.href);
          this.setJsonLd({
            '@context': 'https://schema.org',
            '@type': 'MusicAlbum',
            name: data.album,
            byArtist: { '@type': 'MusicGroup', name: data.artist },
            description: desc,
            image: data.image || '',
            datePublished: data.releaseDate || '',
            genre: data.genre || '',
            url: window.location.href
          });
        },
        error: (err) => {
          console.error("Failed to load review:", err);
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

  getSubgenreList(content: ReviewDetail): string[] {
    const subgenres = content.subgenres;
    if (!subgenres) return [];
    if (Array.isArray(subgenres)) return subgenres;
    return subgenres.split(',').map(g => g.trim());
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

  private setCanonical(url: string) {
    let link: HTMLLinkElement = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: object) {
    let script: HTMLScriptElement = this.document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}