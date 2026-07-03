import { Component, signal, computed, inject, OnInit, DOCUMENT } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Title, Meta, DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MarkdownComponent } from 'ngx-markdown';
import { ImgFadeDirective } from '../shared/img-fade.directive';

import { environment } from '../../environments/environment';
import { LanguageService } from '../shared/language.service';

export interface ArticleBlock {
  type: 'heading' | 'paragraph' | 'image';
  content?: string;
  imageUrl?: string;
  caption?: string;
}

export interface Article {
  id: number;
  title: string;
  titlePt?: string;
  theme: string;
  keywords: string;
  description: string;
  descriptionPt?: string;
  date: string;
  image: string;
  youtubeVideoId?: string;
  readingTime?: string;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: Array<{ user: string; date: string; text: string; adminReply?: { text: string; date: string } }>;
  contentBlocks?: ArticleBlock[];
  contentBlocksPt?: ArticleBlock[];
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
  langService = inject(LanguageService);

  article = signal<Article | null>(null);
  hasLiked = signal(false);
  commentText = signal('');
  submittingComment = signal(false);
  showShareMenu = signal(false);
  generatingCard = signal(false);
  linkCopied = signal(false);

  displayTitle = computed(() => {
    const post = this.article();
    if (!post) return '';
    return this.langService.lang() === 'pt' && post.titlePt ? post.titlePt : post.title;
  });

  displayDescription = computed(() => {
    const post = this.article();
    if (!post) return '';
    return this.langService.lang() === 'pt' && post.descriptionPt ? post.descriptionPt : (post.description || '');
  });

  displayBlocks = computed(() => {
    const post = this.article();
    if (!post) return [];
    const ptBlocks = post.contentBlocksPt;
    return this.langService.lang() === 'pt' && ptBlocks && ptBlocks.length ? ptBlocks : (post.contentBlocks || []);
  });

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

          const pageTitle = `${data.title} — Equal Rights`;
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

  toggleShareMenu() { this.showShareMenu.update(v => !v); }

  copyLink() {
    navigator.clipboard.writeText(window.location.href);
    const a = this.article();
    if (a) this.http.post(`${this.apiUrl}/articles/${a.id}/share`, {}).subscribe();
    this.showShareMenu.set(false);
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2000);
  }

  async shareCard() {
    const a = this.article();
    if (!a) return;
    this.generatingCard.set(true);
    this.showShareMenu.set(false);
    try {
      const res = await fetch(`${this.apiUrl}/share-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', title: a.title, desc: a.description, image: a.image, category: a.theme })
      });
      if (!res.ok) throw new Error('Card generation failed');
      const blob = await res.blob();
      const file = new File([blob], 'post-card.png', { type: 'image/png' });
      const nav = navigator as any;
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const link = this.document.createElement('a');
        link.href = url;
        link.download = 'post-card.png';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share card failed:', err);
    } finally {
      this.generatingCard.set(false);
    }
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
