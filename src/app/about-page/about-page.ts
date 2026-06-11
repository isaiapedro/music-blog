import { Component, computed, signal, inject } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { ImgFadeDirective } from '../shared/img-fade.directive';
import { LanguageService } from '../shared/language.service';

@Component({
  selector: 'app-about-page',
  imports: [
    RouterLink,
    RouterOutlet,
    RouterLinkActive,
    NgOptimizedImage,
    ImgFadeDirective
  ],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css',
})
export class AboutPage {
  langService = inject(LanguageService);

  private baseImages = [
    'https://picsum.photos/id/1018/800/600',
    'https://picsum.photos/id/1015/800/600',
    'https://picsum.photos/id/1019/800/600',
    'https://picsum.photos/id/1016/800/600',
    'https://picsum.photos/id/1011/800/600'
  ];

  displayImages = [...this.baseImages, ...this.baseImages];
}