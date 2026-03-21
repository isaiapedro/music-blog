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
  templateUrl: './review.html',
  styleUrl: './review.css',
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