import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
  imports: [RouterModule, CommonModule],
  templateUrl: './post-page.html',
  styleUrl: './post-page.css'
})

export class PostPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private apiUrl = 'http://56.124.116.216:3000/api';

  article = signal<Article | null>(null);
  hasLiked = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      
      // Fetch live data from your shiny new database
      this.http.get<Article>(`${this.apiUrl}/articles/${id}`).subscribe({
        next: (data) => {
          this.article.set(data);
          this.hasLiked.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
}