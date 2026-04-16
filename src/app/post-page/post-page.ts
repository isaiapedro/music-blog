import { Component, signal, inject, OnInit, DOCUMENT } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  readingTime?: string;
  views?: number;
  likes?: number;
  contentBlocks?: ArticleBlock[];
}

@Component({
  selector: 'app-post-page',
  standalone: true,
  imports: [RouterModule, CommonModule, ImgFadeDirective],
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

  article = signal<Article | null>(null);
  hasLiked = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') || params.get('id');

      this.http.get<Article>(`${this.apiUrl}/articles/${slug}`).subscribe({
        next: (data) => {
          this.article.set(data);
          this.hasLiked.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const currentArticle = this.article();
    if (!currentArticle) return;

    // Optimistic UI Update: update UI instantly for a snappy feel
    const isNowLiked = !this.hasLiked();
    this.hasLiked.set(isNowLiked);
    
    // Update the signal with the optimistic count
    this.article.update(a => {
        if(!a) return a;
        return { ...a, likes: (a.likes || 0) + (isNowLiked ? 1 : -1) };
    });

    // Send the dynamic update to the backend
    this.http.put<{likes: number}>(`${this.apiUrl}/articles/${currentArticle.id}/like`, { isLiked: isNowLiked })
      .subscribe({
          error: (err) => {
              // Revert optimistic update on failure
              console.error('Failed to save like', err);
              this.hasLiked.set(!isNowLiked);
              this.article.update(a => {
                  if(!a) return a;
                  return { ...a, likes: (a.likes || 0) + (isNowLiked ? -1 : 1) };
              });
          }
      });
  }

  sharePost() {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
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