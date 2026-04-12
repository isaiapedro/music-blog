import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-about-page',
  imports: [
    RouterLink,
    RouterOutlet,
    RouterLinkActive,
    NgOptimizedImage
  ],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css',
})
export class AboutPage {

  private baseImages = [
    'https://picsum.photos/id/1018/800/600',
    'https://picsum.photos/id/1015/800/600',
    'https://picsum.photos/id/1019/800/600',
    'https://picsum.photos/id/1016/800/600',
    'https://picsum.photos/id/1011/800/600'
  ];

  displayImages = [...this.baseImages, ...this.baseImages];
}