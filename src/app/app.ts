import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs/operators';

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
        <a mat-button routerLink="/home-page" routerLinkActive="active-link" class="title">equal rights</a>
        <span class="spacer"></span>
        <div class="nav-box">
          <a mat-button routerLink="/articles-page" routerLinkActive="active-link">articles</a>
          <a mat-button routerLink="/collection-page" routerLinkActive="active-link">reviews</a>
          <a mat-button routerLink="/about-page" routerLinkActive="active-link">about</a>
        </div>
        <span class="spacer"></span>
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
          <a routerLink="/home-page" (click)="closeSidebar()" class="sidebar-link">home</a>
          <a routerLink="/articles-page" (click)="closeSidebar()" class="sidebar-link">articles</a>
          <a routerLink="/collection-page" (click)="closeSidebar()" class="sidebar-link">reviews</a>
          <a routerLink="/about-page" (click)="closeSidebar()" class="sidebar-link">about</a>
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

      .title {
        font-size: 30px;
        font-weight: bold;
        font-family: "Typescript Mono", monospace;
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
  private router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarOpen.set(false);
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}