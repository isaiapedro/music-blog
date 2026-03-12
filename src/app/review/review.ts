import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { ReviewCmsService } from '../cms/review-cms.service';
import { ReviewContent } from '../cms/review-content.model';
import { REVIEWS } from '../review.data';
import type { Review } from '../review.data';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [RouterModule, MarkdownComponent],
  template: `
    <div class="review-article">
      <a routerLink="/collection-page" class="back-link">&larr; Back to reviews</a>

      @if (reviewContent(); as content) {
        <article class="article-body">
          <header class="article-header">
            <h1 class="article-title">{{ content.album }}</h1>
            <p class="article-artist">{{ content.artist }}</p>
            <div class="article-meta">
              <span>{{ content.releaseDate }}</span>
              @if (content.label) {
                <span class="meta-sep">{{ content.label }}</span>
              }
              <span class="meta-sep">{{ content.genre }}</span>
            </div>
            <div class="cover-wrap">
              <img
                [src]="content.image"
                [alt]="content.album"
                class="article-cover"
                width="400"
                height="400"
                loading="eager"
              />
            </div>
            <p class="article-description">{{ content.description }}</p>
            @if (content.context) {
              <div class="article-context markdown-body">
                <markdown [data]="content.context"></markdown>
              </div>
            }
          </header>

          @if (content.introduction) {
            <section class="section introduction">
              <div class="markdown-body">
                <markdown [data]="content.introduction"></markdown>
              </div>
            </section>
          }

          @if (content.breakdown.length) {
            <section class="section breakdown">
              <h2 class="section-title">Album breakdown</h2>
              @for (block of content.breakdown; track $index) {
                <div class="breakdown-block">
                  @switch (block.type) {
                    @case ('paragraph') {
                      @if (block.title) {
                        <h3 class="block-title">{{ block.title }}</h3>
                      }
                      @if (block.content) {
                        <div class="markdown-body">
                          <markdown [data]="block.content"></markdown>
                        </div>
                      }
                    }
                    @case ('image') {
                      @if (block.imageUrl) {
                        <figure>
                          <img
                            [src]="block.imageUrl"
                            [alt]="block.imageAlt || block.title || ''"
                            class="breakdown-image"
                            loading="lazy"
                          />
                          @if (block.title) {
                            <figcaption>{{ block.title }}</figcaption>
                          }
                        </figure>
                      }
                    }
                    @case ('music') {
                      <div class="music-player">
                        @if (block.title) {
                          <h4 class="player-title">{{ block.title }}</h4>
                        }
                        @if (block.spotifyId) {
                          <iframe
                            [src]="spotifyEmbedUrl(block.spotifyId)"
                            class="embed-spotify"
                            width="100%"
                            height="152"
                            frameborder="0"
                            allowfullscreen
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            title="Spotify player"
                          ></iframe>
                        }
                        @if (!block.spotifyId && block.youtubeMusicId) {
                          <iframe
                            [src]="youtubeEmbedUrl(block.youtubeMusicId)"
                            class="embed-youtube"
                            width="100%"
                            height="152"
                            frameborder="0"
                            allowfullscreen
                            allow="autoplay; encrypted-media"
                            loading="lazy"
                            title="YouTube Music player"
                          ></iframe>
                        }
                      </div>
                    }
                  }
                </div>
              }
            </section>
          }

          @if (content.conclusion) {
            <section class="section conclusion">
              <h2 class="section-title">Conclusion</h2>
              <div class="markdown-body">
                <markdown [data]="content.conclusion"></markdown>
              </div>
            </section>
          }

          @if (content.similarAlbums.length) {
            <section class="section similar">
              <h2 class="section-title">Similar albums</h2>
              <ul class="similar-list">
                @for (sim of content.similarAlbums; track sim.id) {
                  <li>
                    <a [routerLink]="['/collection-page', sim.id]" class="similar-link">
                      <img
                        [src]="sim.image"
                        [alt]="sim.album"
                        class="similar-cover"
                        width="80"
                        height="80"
                        loading="lazy"
                      />
                      <span class="similar-info">{{ sim.album }} &ndash; {{ sim.artist }}</span>
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          @if (content.comments.length) {
            <section class="section comments">
              <h2 class="section-title">Comments</h2>
              <ul class="comment-list">
                @for (c of content.comments; track c.date + c.user) {
                  <li class="comment-item">
                    <strong class="comment-user">{{ c.user }}</strong>
                    <span class="comment-date">{{ c.date }}</span>
                    <p class="comment-text">{{ c.text }}</p>
                  </li>
                }
              </ul>
            </section>
          }
        </article>
      } @else if (fallbackReview(); as fallback) {
        <article class="article-body article-fallback">
          <header class="article-header">
            <h1 class="article-title">{{ fallback.album }}</h1>
            <p class="article-artist">{{ fallback.artist }}</p>
            <div class="article-meta">
              <span>{{ fallback.year }}</span>
              <span class="meta-sep">{{ fallback.genres }}</span>
            </div>
            <div class="cover-wrap">
              <img
                [src]="fallback.image"
                [alt]="fallback.album"
                class="article-cover"
                width="400"
                height="400"
                loading="eager"
              />
            </div>
            <p class="article-description">{{ fallback.description }}</p>
          </header>
          <p class="fallback-note">Full review content not yet available from CMS.</p>
        </article>
      } @else {
        <div class="error-state">
          <h2>Review not found</h2>
          <p>This review is not in our database.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .review-article {
      background: linear-gradient(to bottom, #0d0d0d 0%, #1a1a1a 100%);
      min-height: 100vh;
      padding: 6rem 1.5rem 4rem;
      font-family: 'IBM Plex Mono', monospace;
      color: #e0e0e0;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: #A5CEC7;
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover { text-decoration: underline; }

    .article-body {
      max-width: 720px;
      margin: 0 auto;
    }

    .article-header {
      margin-bottom: 2.5rem;
    }

    .article-title {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #fff;
      font-family: 'Playfair Display', serif;
    }

    .article-artist {
      font-size: 1.1rem;
      color: #888;
      margin: 0 0 0.5rem 0;
    }

    .article-meta {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 1.5rem;
    }
    .meta-sep::before { content: " · "; }

    .cover-wrap {
      margin: 1.5rem 0;
      border-radius: 8px;
      overflow: hidden;
      max-width: 320px;
    }

    .article-cover {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    .article-description {
      margin-top: 1.5rem;
      line-height: 1.6;
      color: #bbb;
    }

    .article-context {
      margin-top: 1rem;
      line-height: 1.6;
      color: #bbb;
    }

    .section {
      margin-top: 2.5rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: #fff;
    }

    .markdown-body {
      line-height: 1.7;
      color: #ccc;
    }
    .markdown-body :deep(p) { margin: 0 0 1em 0; }
    .markdown-body :deep(strong) { color: #fff; }
    .markdown-body :deep(a) { color: #A5CEC7; }

    .breakdown-block {
      margin-bottom: 1.5rem;
    }

    .block-title {
      font-size: 1.05rem;
      margin: 0 0 0.5rem 0;
      color: #ddd;
    }

    .breakdown-image {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
    }
    figure { margin: 1rem 0; }
    figcaption { font-size: 0.85rem; color: #666; margin-top: 0.25rem; }

    .music-player {
      margin: 1rem 0;
      border-radius: 12px;
      overflow: hidden;
    }
    .player-title {
      font-size: 0.95rem;
      margin: 0 0 0.5rem 0;
      color: #aaa;
    }
    .embed-spotify, .embed-youtube {
      display: block;
      border: 0;
    }

    .similar-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .similar-list li { margin-bottom: 1rem; }
    .similar-link {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #A5CEC7;
      text-decoration: none;
    }
    .similar-link:hover { text-decoration: underline; }
    .similar-cover {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 6px;
    }
    .similar-info { font-size: 0.95rem; }

    .comment-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .comment-item {
      padding: 1rem 0;
      border-bottom: 1px solid #333;
    }
    .comment-item:last-child { border-bottom: 0; }
    .comment-user { color: #fff; }
    .comment-date {
      font-size: 0.8rem;
      color: #666;
      margin-left: 0.5rem;
    }
    .comment-text {
      margin: 0.5rem 0 0 0;
      color: #bbb;
      line-height: 1.5;
    }

    .fallback-note {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: #666;
    }

    .article-fallback .article-meta .meta-sep::before { content: " · "; }

    .error-state {
      text-align: center;
      padding: 3rem;
    }
    .error-state h2 { color: #fff; margin-bottom: 0.5rem; }
    .error-state p { color: #888; }
  `,
})
export class ReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cms = inject(ReviewCmsService);
  private sanitizer = inject(DomSanitizer);

  reviewContent = signal<ReviewContent | null>(null);
  fallbackReview = signal<Review | null>(null);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (Number.isNaN(id)) return;

    this.cms.getReviewById(id).subscribe((content) => {
      if (content) {
        this.reviewContent.set(content);
        return;
      }
      const fallback = REVIEWS.find((r) => r.id === id) ?? null;
      this.fallbackReview.set(fallback);
    });
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
