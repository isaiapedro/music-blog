import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ARTICLES, Article } from '../article.data';

@Component({
  selector: 'app-post-page', // Updated selector name
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './post-page.html',
  styleUrl: './post-page.css'
})
export class PostPage implements OnInit {
  private route = inject(ActivatedRoute);

  article = signal<Article | null>(null);
  hasLiked = signal(false); // Local state to toggle the heart icon

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      const foundArticle = ARTICLES.find(a => a.id === id);
      
      this.article.set(foundArticle || null);
      this.hasLiked.set(false); // Reset like state on new page
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  toggleLike() {
    this.hasLiked.update(val => !val);
  }

  sharePost() {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  }
}