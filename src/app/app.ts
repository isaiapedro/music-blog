import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs/operators';
import { LanguageService } from './shared/language.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    RouterLinkActive
  ],
  template: `
    <main style="display: block; width: 100%; min-height: 100%;" [class.light-theme]="!isDark()">
      <mat-toolbar color="primary" class="navbar">
        <span class="spacer"></span>
        <a routerLink="/home-page" class="logo-link" aria-label="Home">
          <picture>
            <source srcset="assets/logo-site.svg" type="image/svg+xml">
            <img src="assets/logo-site.png" alt="Equal Rights Logo" class="site-logo">
          </picture>
        </a>
        <span class="spacer"></span>
        <div class="nav-box">
          <a mat-button routerLink="/articles-page" routerLinkActive="active-link">{{ langService.t('nav.articles') }}</a>
          <a mat-button routerLink="/collection-page" routerLinkActive="active-link">{{ langService.t('nav.reviews') }}</a>
          <a mat-button routerLink="/about-page" routerLinkActive="active-link">{{ langService.t('nav.about') }}</a>
        </div>
        <span class="spacer"></span>
        <button class="theme-btn" (click)="toggleTheme()" [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ isDark() ? '☀' : '☾' }}
        </button>
        <li class="language-menu">
          <button class="lang-btn" (click)="toggleLangMenu()" aria-label="Switch language">
            <img src="assets/languages.svg" alt="Languages">
          </button>
          @if (langMenuOpen()) {
            <div class="dropdown-content">
              <a (click)="langService.lang.set('en'); langMenuOpen.set(false)" [class.active]="langService.lang() === 'en'">English</a>
              <a (click)="langService.lang.set('pt'); langMenuOpen.set(false)" [class.active]="langService.lang() === 'pt'">Português</a>
            </div>
          }
        </li>
        <button class="hamburger-btn" (click)="toggleSidebar()" [attr.aria-label]="sidebarOpen() ? 'Close menu' : 'Open menu'">
          <span class="hamburger-line" [class.open]="sidebarOpen()"></span>
          <span class="hamburger-line" [class.open]="sidebarOpen()"></span>
          <span class="hamburger-line" [class.open]="sidebarOpen()"></span>
        </button>
      </mat-toolbar>

      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="closeSidebar()"></div>
      }

      <div class="sidebar-drawer" [class.open]="sidebarOpen()">
        <nav class="sidebar-nav">
          <a routerLink="/home-page" (click)="closeSidebar()" class="sidebar-link">{{ langService.t('nav.home') }}</a>
          <a routerLink="/articles-page" (click)="closeSidebar()" class="sidebar-link">{{ langService.t('nav.articles') }}</a>
          <a routerLink="/collection-page" (click)="closeSidebar()" class="sidebar-link">{{ langService.t('nav.reviews') }}</a>
          <a routerLink="/about-page" (click)="closeSidebar()" class="sidebar-link">{{ langService.t('nav.about') }}</a>
        </nav>
        <div class="sidebar-separator"></div>
        <div class="sidebar-controls">
          <button class="sidebar-control-btn" (click)="toggleTheme()">
            {{ isDark() ? '☀ ' + langService.t('nav.lightMode') : '☾ ' + langService.t('nav.darkMode') }}
          </button>
          <div class="sidebar-lang">
            <button class="sidebar-control-btn" [class.active]="langService.lang() === 'en'" (click)="langService.lang.set('en')">EN</button>
            <span class="sidebar-lang-sep">|</span>
            <button class="sidebar-control-btn" [class.active]="langService.lang() === 'pt'" (click)="langService.lang.set('pt')">PT</button>
          </div>
        </div>
        <div class="sidebar-socials">
          <a href="https://www.youtube.com/@equalrightsblog" target="_blank" aria-label="YouTube" class="sidebar-social-link">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="#" target="_blank" aria-label="TikTok" class="sidebar-social-link">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v8.12c0 4.11-3.08 7.56-7.37 8.01-4.07.42-8.08-1.92-9.28-5.83-1.19-3.92.51-8.22 4.1-9.98 1.83-.89 3.99-.95 5.92-.37v4.11c-1.15-.35-2.43-.37-3.48.24-.97.55-1.55 1.58-1.57 2.7-.01 1.25.7 2.45 1.81 2.94 1.25.54 2.82.31 3.84-.57.85-.72 1.34-1.8 1.34-2.93V.02h-.01z"/></svg>
          </a>
          <a href="#" target="_blank" aria-label="Instagram" class="sidebar-social-link">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
          </a>
          <a href="https://soundcloud.com/isaiapedro" target="_blank" aria-label="SoundCloud" class="sidebar-social-link">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.06.126-.145.244-.249.349-.247.247-.573.383-.926.383v1.86h5.812v-6.936c-.475 0-.916.182-1.25.516-.299.3-.475.698-.485 1.116l-.004.053-2.316.326-.064-.064c-.183-.183-.427-.285-.686-.285-.262 0-.508.102-.693.287-.19.191-.295.443-.295.713 0 .265.101.515.285.702l1.636 1.636-.29.435-.675-.989zM23.146 11.02c-.89-2.074-2.906-3.414-5.116-3.414-1.077 0-2.112.308-3.006.877L15 8.506v10.51h7.03c1.087 0 1.97-.884 1.97-1.97 0-1.066-.848-1.936-1.905-1.968l-.403-.012.164-.367c.18-.403.272-.835.272-1.272 0-1.107-.63-2.108-1.616-2.613l-.532-.27-.087-.584c-.035-.236-.084-.467-.148-.69h-.001zM8.59 19.016v-8.77l-1.002.39v8.38h1.002zm-1.874 0v-7.85l-1.003.542v7.308h1.003zm3.747 0V9.457l-1.002-.194v9.753h1.002zm1.874 0V8.752l-1.003-.058v10.322h1.003zM14.21 7.64v11.376h1.003V7.64h-1.003zM15 19.016v-8.498l-1.002.585v7.913H15zm-9.368 0v-6.32l-1.003.682v5.638h1.003z"/></svg>
          </a>
        </div>
      </div>

      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </main>
  `,
  styles: [
    `

      
      .content {
        margin-top: 64px;
      }

      .mat-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1100;
        background-image: linear-gradient(#000000 25%, #1a1a1a 85%);
        border-bottom: 1px solid white;
        font-family: 'Helvetica', sans-serif;
        font-weight: 400;
        font-size: 20px;
        color: white;
      }

      .mat-toolbar a,
      .mat-toolbar .mat-mdc-button,
      .navbar a {
        color: white;
      }

      .logo-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        cursor: pointer;
      }

      .site-logo {
        height: 35px;
        width: auto;
        display: block;
      }

      .nav-box a {
        margin-right: 20px;
        font-size: 22px;
      }

      .nav-box {
        padding: 5px 20px;
      }

      .nav-box .active-link {
        background-color: black;
        border: 1px solid black;
        box-shadow: 0px 0px 0px 2px white, 0px 5px 0px 2px white;
        border-radius: 15px;
      }

      .active-link {
        font-weight: bold;
      }

      .spacer {
        flex-grow: 1;
      }

      .language-menu {
        position: relative;
        list-style: none;
        cursor: pointer;
        margin-right: 8px;
        display: flex;
        align-items: center;
      }

      .lang-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
      }

      .lang-btn img {
        height: 22.5px;
        width: auto;
        display: block;
        opacity: 0.85;
        transition: opacity 0.2s;
      }

      .lang-btn:hover img {
        opacity: 1;
      }

      .language-menu .dropdown-content {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 6px;
        min-width: 130px;
        z-index: 1200;
        overflow: hidden;
      }

      .language-menu .dropdown-content a {
        display: block;
        padding: 10px 16px;
        color: white;
        text-decoration: none;
        font-family: 'Helvetica', sans-serif;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.15s;
      }

      .language-menu .dropdown-content a:hover {
        background: rgba(255,255,255,0.08);
      }

      .language-menu .dropdown-content a.active {
        color: #ggg;
        font-weight: 600;
      }

      /* Hamburger — hidden on desktop */
      .hamburger-btn {
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        margin-right: 4px;
      }

      .hamburger-line {
        display: block;
        width: 24px;
        height: 2px;
        background-color: white;
        border-radius: 2px;
        transition: all 0.3s ease;
      }

      .hamburger-line.open:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      
      .hamburger-line.open:nth-child(2) {
        opacity: 0;
      }
      
      .hamburger-line.open:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }

      /* Sidebar overlay */
      .sidebar-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 1;
      }

      /* Sidebar drawer */
      .sidebar-drawer {
        position: fixed;
        top: 0;
        right: -100%;
        width: 100%;
        height: 100%;
        background: #111;
        border-left: 1px solid #333;
        z-index: 1000;
        transition: right 0.3s ease;
        padding-top: 72px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }

      .sidebar-drawer.open {
        right: 0;
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        margin-top: 10px;
        margin-left: 4px;
      }

      .sidebar-link {
        color: white;
        text-decoration: none;
        font-family: 'Helvetica', sans-serif;
        font-size: 1.4rem;
        padding: 20px 24px;
        transition: background 0.2s ease;
        letter-spacing: 1px;
      }

      .sidebar-link:hover {
        background-color: rgba(255, 255, 255, 0.07);
      }

      .sidebar-separator {a
        display: block;
        margin: 24px 24px 0 24px; /* Top: 24px, Right: 24px, Bottom: 0, Left: 24px */
        border-top: 1px solid #222;
      }

      .sidebar-controls {
        margin-top: 20px;
        padding: 16px 25px 28px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .sidebar-control-btn {
        background: none;
        border: none;
        color: white;
        font-family: 'Helvetica', sans-serif;
        font-size: 1.1rem;
        letter-spacing: 1px;
        cursor: pointer;
        padding: 0;
        text-align: left;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .sidebar-control-btn:hover,
      .sidebar-control-btn.active {
        opacity: 1;
      }

      .sidebar-lang {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sidebar-lang-sep {
        color: white;
        opacity: 0.3;
      }

      .sidebar-socials {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 30px 35px;
        gap: 45px;
        margin: 24px 24px 0 24px; /* Top: 24px, Right: 24px, Bottom: 0, Left: 24px */
        border-top: 1px solid #ddd;
      }

      .sidebar-social-link {
        color: #808080;
        display: inline-flex;
        transition: color 0.2s ease, transform 0.2s ease;
      }

      .sidebar-social-link:hover {
        color: white;
        transform: translateY(-2px);
      }

      .sidebar-social-link svg {
        width: 30px;
        height: 30px;
        fill: currentColor;
      }

      /* Theme toggle button */
      .theme-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 25px;
        color: white;
        margin-right: 15px;
        margin-bottom: 1px;
        line-height: 1;
      }

      @media (max-width: 768px) {
        .nav-box {
          display: none;
        }

        .hamburger-btn {
          display: flex;
        }

        .spacer:last-of-type {
          display: none;
        }

        .theme-btn {
          display: none;
        }

        .language-menu {
          display: none;
        }
      }

      /* Light mode — navbar */
      .light-theme .mat-toolbar {
        background-image: none;
        background-color: #f5f5f0;
        border-bottom: 1px solid #777;
        color: black;
      }

      .light-theme .mat-toolbar a,
      .light-theme .mat-toolbar .mat-mdc-button,
      .light-theme .navbar a {
        color: black;
      }

      .light-theme .site-logo {
        filter: invert(1) brightness(0);
      }

      .light-theme .theme-btn {
        color: black;
      }

      .light-theme .nav-box .active-link {
        background-color: #fbfbfb;
        box-shadow: 0px 0px 0px 2px black, 0px 5px 0px 2px black;
      }

      .light-theme .lang-btn img {
        filter: invert(1) brightness(0);
      }

      .light-theme .language-menu .dropdown-content {
        background: #f5f5f0;
        border: 1px solid #ccc;
      }

      .light-theme .language-menu .dropdown-content a {
        color: black;
      }

      .light-theme .language-menu .dropdown-content a:hover {
        background: rgba(0,0,0,0.06);
      }

      .light-theme .hamburger-line {
        background-color: black;
      }

      .light-theme .sidebar-drawer {
        background: #f5f5f0;
        border-left: 1px solid #ccc;
      }

      .light-theme .sidebar-link {
        color: black;
      }

      .light-theme .sidebar-link:hover {
        background-color: rgba(0,0,0,0.05);
      }

      .light-theme .sidebar-controls {
        border-top-color: #ddd;
      }

      .light-theme .sidebar-control-btn {
        color: black;
      }

      .light-theme .sidebar-lang-sep {
        color: black;
      }

      .light-theme .sidebar-social-link {
        color: #555;
      }

      .light-theme .sidebar-social-link:hover {
        color: black;
      }
    `,
  ],
})

export class App {
  sidebarOpen = signal(false);
  langMenuOpen = signal(false);
  isDark = signal<boolean>(this.detectSystemTheme());
  private router = inject(Router);
  langService = inject(LanguageService);

  constructor() {
    this.applyThemeClasses(!this.isDark());
    
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.isDark.set(e.matches);
        this.applyThemeClasses(!e.matches);
      });
    }
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarOpen.set(false);
      this.langMenuOpen.set(false);
    });
  }

  private detectSystemTheme(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default standard fallback
  }

  private applyThemeClasses(isLight: boolean) {
    document.body.classList.toggle('light-theme', isLight);
    document.documentElement.classList.toggle('light-theme', isLight);
  }

  toggleLangMenu() {
    this.langMenuOpen.update(v => !v);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  toggleTheme() {
    this.isDark.update(v => !v);
    this.applyThemeClasses(!this.isDark());
  }
}
