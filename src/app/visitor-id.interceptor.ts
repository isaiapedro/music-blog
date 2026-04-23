import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { VisitorService } from './visitor.service';

export const visitorIdInterceptor: HttpInterceptorFn = (req, next) => {
  const visitorService = inject(VisitorService);
  const visitorId = visitorService.getVisitorId();
  const cloned = req.clone({ setHeaders: { 'X-Visitor-ID': visitorId } });
  return next(cloned);
};
