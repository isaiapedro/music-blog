import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { REVIEWS, Review } from '../review.data';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [RouterModule, CurrencyPipe],
  template: `
    <div class="detail-container">

      <a routerLink="/collection-page" class="back-link">&larr; Back to Shop</a>

      @if (review(); as p) {
        <div class="review-layout">
          <div class="gallery-container">
            <div class="thumbnail-list">
              @for (img of galleryImages(); track img) {
                <div 
                  class="thumbnail" 
                  [class.active]="img === selectedImage()" 
                  (click)="changeImage(img)"
                >
                  <img [src]="img" alt="Thumbnail view">
                </div>
              }
            </div>
            <div class="main-image-container">
              <img [src]="selectedImage()" [alt]="p.name">
            </div>
          </div>

          <div class="review-info-container">
            <div class="review-title">
              <h1>{{ p.name }}</h1>
            </div>

            <div class="rating-container">
              <a href="#" class="rating-count" (click)="toggleReviews($event)">
                {{ showReviews() ? 'Hide Reviews' : 'Show Reviews' }}
              </a>
              <div class="stars">
                ★★★★<span class="half-star">★</span>
              </div>
            </div>

            @if (showReviews()) {
              <div class="reviews-section">
                <p><strong>Alice:</strong> Beautiful plant, fits perfectly! 🌿</p>
                <p><strong>Bob:</strong> Arrived safely and looking healthy. 5/5!</p>
              </div>
            }

            <div class="price-block">
              <div class="current-price">{{ p.price | currency:'BRL' }}</div>
            </div>

            <div class="divider"></div>

            <div class="support-selector">
              <h4>Select Support / Base</h4>
              
              <div class="support-options">
                <div 
                  class="support-box" 
                  [class.selected]="selectedSupport() === 'basic'" 
                  (click)="selectedSupport.set('basic')"
                >
                  <img src="https://picsum.photos/id/111/80/80" alt="Basic Pot">
                  <div class="support-text">
                    <span>Basic Pot</span>
                    <small>Included</small>
                  </div>
                </div>

                <div 
                  class="support-box" 
                  [class.selected]="selectedSupport() === 'wood'" 
                  (click)="selectedSupport.set('wood')"
                >
                  <img src="https://picsum.photos/id/112/80/80" alt="Wood Stand">
                  <div class="support-text">
                    <span>Wood Stand</span>
                    <small>+ R$ 25,00</small>
                  </div>
                </div>
              </div>
            </div>

            <button class="btn btn-add-to-cart">Add to Cart</button>
            <button class="btn btn-buy-now">Buy Now</button>
          </div>
        </div>

      } @else {
        <div class="error-state">
          <h2>Review Not Found</h2>
          <p>Sorry, we couldn't find the review you're looking for in our database.</p>
        </div>
      }
    </div>
  `,
  styles: `
    :root {
      --add-cart: #A5CEC7;
      --buy-color: #7AB5B7;
      --text-dark: #000000;
      --text-light: #ACAC9A;
      --discount-color: #FF0000;
      --star-color: #FFFF00;
    }

    .detail-container {
      background: linear-gradient(to bottom,  #fafaeb 0%, #B8BAAD 80%);
      display: flex;
      flex-direction: column;
      position: absolute;
      width: 100%;
      height: 140vh;
      top: 70px;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0 auto;
      padding: 2rem;
      font-family: IBM Plex Mono, monospace;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 1.5rem;
      color: var(--link-blue);
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover { text-decoration: underline; }

    .review-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }

    @media (min-width: 1000px) {
      .review-layout {
        grid-template-columns: 40% 35% 25%;
      }
    }

    /* --- COLUMN 1: GALLERY --- */
    .gallery-container {
      display: flex;
      gap: 15px;
    }

    .thumbnail-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .thumbnail {
      width: 50px;
      height: 50px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      border-radius: 4px;
      overflow: hidden;
      opacity: 0.6;
      transition: all 0.2s;
    }
    
    .thumbnail.active, .thumbnail:hover {
      border: 2px solid var(--accent-color);
      opacity: 1;
    }

    .thumbnail img { width: 100%; height: 100%; object-fit: cover; }

    .main-image-container {
      flex-grow: 1;
      border-radius: 8px;
      overflow: hidden;
      max-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f8f8;
    }

    .main-image-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* --- RIGHT COLUMN STICKY MAGIC --- */
    .review-info-container {
      position: sticky;           /* Prevents dragging to the bottom */
      top: 90px;                  /* Offsets enough to stay below your fixed mat-toolbar */
      height: fit-content;        /* Makes sure the container is only as tall as its content */
      align-self: start;          /* Stops it from stretching the full height of the grid */
    }

    .review-title h1 {
      font-size: 1.5rem;
      font-weight: 400;
      line-height: 1.3;
      color: var(--text-dark);
      margin-bottom: 5px;
    }

    .brand-link { color: var(--link-blue); text-decoration: none; font-size: 0.9rem; }
    .brand-link:hover { text-decoration: underline; }

    .rating-container {
      display: flex;
      align-items: center;
      margin-top: 10px;
      font-size: 0.9rem;
    }

    .stars { color: var(--accent-color); margin-right: 5px; font-size: 1.1rem; }
    .half-star { color: #ccc; }
    .rating-count { color: var(--link-blue); margin-left: 8px; text-decoration: none; }
    
    /* New Styles for the Toggled Reviews */
    .reviews-section {
      background-color: #fff9f0;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
      border: 1px solid #ddd;
    }
    
    .reviews-section p {
      font-size: 0.85rem;
      margin-bottom: 8px;
      color: var(--text-dark);
    }

    .current-price { font-size: 1.8rem; font-weight: 500; color: var(--text-dark); margin-top: 15px;}

    .divider { height: 1px; background-color: #ddd; margin: 25px 0; }

     .support-selector h4 {
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 15px;
      color: var(--text-dark);
    }

    .support-options {
      display: flex;
      gap: 15px;
    }

    .support-box {
      flex: 1; 
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .support-box:hover { border-color: #bbb; }

    .support-box.selected {
      border-color: var(--accent-color);
      background-color: #fff9f0; 
    }

    .support-box img {
      width: 45px;
      height: 45px;
      border-radius: 6px;
      object-fit: cover;
    }

    .support-text { display: flex; flex-direction: column; }
    .support-text span { font-size: 0.95rem; font-weight: 600; color: var(--text-dark); }
    .support-text small { font-size: 0.85rem; color: var(--text-light); margin-top: 2px;}

    .btn {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 20px;
      font-size: 1rem;
      font-weight: 400;
      cursor: pointer;
      margin-bottom: 10px;
      transition: background-color 0.2s;
    }

    .btn-add-to-cart { background-color: var(--buy-color); }
    .btn-add-to-cart:hover { background-color: var(--buy-hover); }

    .btn-buy-now { background-color: #ffa41c; margin-top: 10px;}
    .btn-buy-now:hover { background-color: #fa8900; }

    /* Mobile Adjustments */
    @media (max-width: 768px) {
      .gallery-container { flex-direction: column-reverse; }
      .thumbnail-list { flex-direction: row; justify-content: center; flex-wrap: wrap; }
      
      /* Disable sticky on mobile so it flows naturally */
      .review-info-container { position: static; height: auto; margin-top: 20px; } 
    }
  `
})
export class ReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  review = signal<Review | undefined>(undefined);
  selectedImage = signal<string>('');
  galleryImages = signal<string[]>([]);
  selectedSupport = signal<'basic' | 'wood'>('basic');

  // Step 1: Create our state variable for the toggler
  showReviews = signal<boolean>(false); 

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const reviewId = Number(idParam);

    const foundReview = REVIEWS.find(p => p.id === reviewId);
    this.review.set(foundReview);

    if (foundReview) {
      this.selectedImage.set(foundReview.image);
      this.galleryImages.set([
        foundReview.image,
        `https://picsum.photos/id/${reviewId + 50}/500/500`,
        `https://picsum.photos/id/${reviewId + 100}/500/500`,
        `https://picsum.photos/id/${reviewId + 150}/500/500`
      ]);
    }
  }

  changeImage(imgSrc: string) {
    this.selectedImage.set(imgSrc);
  }

  // Step 2: The logic to toggle our state boolean on and off!
  toggleReviews(event: Event) {
    event.preventDefault(); // Prevents the browser from jumping to the top of the page
    this.showReviews.update(val => !val); // Reverses the boolean
  }
}