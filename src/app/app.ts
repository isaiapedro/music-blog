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
    <main style="display: block; width: 100%; min-height: 100%;">
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
        z-index: 1000;
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
        height: 22px;
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

      /* Sidebar overlay */
      .sidebar-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 1050;
      }

      /* Sidebar drawer */
      .sidebar-drawer {
        position: fixed;
        top: 0;
        right: -280px;
        width: 260px;
        height: 100%;
        background: #111;
        border-left: 1px solid #333;
        z-index: 1100;
        transition: right 0.3s ease;
        padding-top: 72px;
      }

      .sidebar-drawer.open {
        right: 0;
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
      }

      .sidebar-link {
        color: white;
        text-decoration: none;
        font-family: 'Helvetica', sans-serif;
        font-size: 1.25rem;
        padding: 18px 24px;
        border-bottom: 1px solid #222;
        transition: background 0.2s ease;
        letter-spacing: 1px;
      }

      .sidebar-link:hover {
        background-color: rgba(255, 255, 255, 0.07);
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
      }
    `,
  ],
})

export class App {
  sidebarOpen = signal(false);
  langMenuOpen = signal(false);
  private router = inject(Router);
  langService = inject(LanguageService);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarOpen.set(false);
      this.langMenuOpen.set(false);
    });
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
}