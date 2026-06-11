import { Component, signal, computed, inject, OnInit, DOCUMENT } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Title, Meta, DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MarkdownComponent } from 'ngx-markdown';
import { ImgFadeDirective } from '../shared/img-fade.directive';

import { environment } from '../../environments/environment';

export interface ArticleBlock {
  type: 'heading' | 'paragraph' | 'image';
  content?: string;
  imageUrl?: string;
  caption?: string;
}

export interface Article {
  id: number;
  title: string;
  theme: string;
  keywords: string;
  description: string;
  date: string;
  image: string;
  youtubeVideoId?: string;
  readingTime?: string;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: Array<{ user: string; date: string; text: string }>;
  contentBlocks?: ArticleBlock[];
}

@Component({
  selector: 'app-post-page',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ImgFadeDirective, MarkdownComponent],
  templateUrl: './post-page.html',
  styleUrl: './post-page.css'
})
export class PostPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);
  private apiUrl = environment.apiUrl;
  private sanitizer = inject(DomSanitizer);

  article = signal<Article | null>(null);
  hasLiked = signal(false);
  commentText = signal('');
  submittingComment = signal(false);

  youtubeEmbedUrl = computed(() => {
    const id = this.article()?.youtubeVideoId;
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}`
    );
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') || params.get('id');

      this.http.get<Article>(`${this.apiUrl}/articles/${slug}`).subscribe({
        next: (data) => {
          this.article.set(data);
          this.hasLiked.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Record unique view
          this.http.post(`${this.apiUrl}/articles/${data.id}/view`, {}).subscribe();

          // Get visitor state (liked?)
          this.http.get<{ liked: boolean }>(`${this.apiUrl}/articles/${data.id}/visitor-state`).subscribe({
            next: (state) => this.hasLiked.set(state.liked)
          });

          const pageTitle = `${data.title} — Isaia`;
          this.titleService.setTitle(pageTitle);
          this.metaService.updateTag({ name: 'description', content: data.description || '' });
          this.metaService.updateTag({ property: 'og:title', content: pageTitle });
          this.metaService.updateTag({ property: 'og:description', content: data.description || '' });
          this.metaService.updateTag({ property: 'og:image', content: data.image || '' });
          this.metaService.updateTag({ property: 'og:url', content: window.location.href });
          this.metaService.updateTag({ property: 'og:type', content: 'article' });
          this.setCanonical(window.location.href);
          this.setJsonLd({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: data.title,
            description: data.description || '',
            image: data.image || '',
            datePublished: data.date || '',
            keywords: data.keywords || '',
            url: window.location.href
          });
        },
        error: (err) => {
          console.error("Couldn't find the article!", err);
          this.article.set(null);
        }
      });
    });
  }

  toggleLike() {
    const a = this.article();
    if (!a) return;
    this.http.post<{ liked: boolean; likes: number }>(`${this.apiUrl}/articles/${a.id}/like`, {}).subscribe({
      next: (res) => {
        this.hasLiked.set(res.liked);
        this.article.update(art => art ? { ...art, likes: res.likes } : art);
      }
    });
  }

  sharePost() {
    const a = this.article();
    navigator.clipboard.writeText(window.location.href);
    if (a) this.http.post(`${this.apiUrl}/articles/${a.id}/share`, {}).subscribe();
  }

  submitComment() {
    const a = this.article();
    const text = this.commentText().trim();
    if (!a || !text) return;
    this.submittingComment.set(true);
    this.http.post<{ user: string; date: string; text: string }>(
      `${this.apiUrl}/articles/${a.id}/comment`, { text }
    ).subscribe({
      next: (comment) => {
        this.article.update(art => art ? { ...art, comments: [...(art.comments || []), comment] } : art);
        this.commentText.set('');
        this.submittingComment.set(false);
      },
      error: () => this.submittingComment.set(false)
    });
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
