import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs';
import {
  ReviewContent,
  ReviewListMeta,
} from './review-content.model';

export interface CmsPayload {
  reviews: ReviewContent[];
  listMeta: ReviewListMeta[];
}

@Injectable({ providedIn: 'root' })
export class ReviewCmsService {
  private http = inject(HttpClient);
  private payload$ = this.http
    .get<CmsPayload>('assets/cms/reviews.json')
    .pipe(shareReplay(1));

  getListMeta() {
    return this.payload$.pipe(map((p) => p.listMeta ?? []));
  }

  getReviewById(id: number) {
    return this.payload$.pipe(
      map((p) => p.reviews?.find((r) => r.id === id) ?? null)
    );
  }

  getReviewBySlug(slug: string) {
    return this.payload$.pipe(
      map((p) => p.reviews?.find((r) => r.slug === slug) ?? null)
    );
  }
}
