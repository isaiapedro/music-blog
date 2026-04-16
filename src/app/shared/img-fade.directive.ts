import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: 'img[imgFade]',
  standalone: true,
})
export class ImgFadeDirective implements OnInit {
  constructor(private el: ElementRef<HTMLImageElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    const img = this.el.nativeElement;
    this.renderer.setStyle(img, 'opacity', '0');
    this.renderer.setStyle(img, 'transition', 'opacity 0.4s ease');
    this.renderer.addClass(img, 'img-shimmer');

    if (img.complete && img.naturalWidth > 0) {
      this.reveal();
    }
  }

  @HostListener('load')
  onLoad(): void {
    this.reveal();
  }

  @HostListener('error')
  onError(): void {
    this.reveal();
  }

  private reveal(): void {
    const img = this.el.nativeElement;
    this.renderer.removeClass(img, 'img-shimmer');
    this.renderer.setStyle(img, 'opacity', '1');
  }
}
