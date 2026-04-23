import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private readonly STORAGE_KEY = 'visitor_id';

  getVisitorId(): string {
    let id = localStorage.getItem(this.STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(this.STORAGE_KEY, id);
    }
    return id;
  }
}
