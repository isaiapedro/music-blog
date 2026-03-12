import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay, catchError, of } from 'rxjs';
import {
  ReviewContent,
  ReviewListMeta,
} from './review-content.model';
import { CMS_API_BASE } from './cms-api.config';

export interface CmsPayload {
  reviews: ReviewContent[];
  listMeta: ReviewListMeta[];
}

@Injectable({ providedIn: 'root' })
export class ReviewCmsService {
  private http = inject(HttpClient);
  private payload$ = this.http
    .get<CmsPayload>(`${CMS_API_BASE}/cms`)
    .pipe(
      catchError(() => this.http.get<CmsPayload>('assets/cms/reviews.json')),
      shareReplay(1)
    );

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
