import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
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
      <a mat-button routerLink="/home-page" routerLinkActive="active-link" class="title">isaia</a>
      <span class="spacer"></span>
      <div class="nav-box">
        <a mat-button routerLink="/articles-page" routerLinkActive="active-link">articles</a>
        <a mat-button routerLink="/collection-page" routerLinkActive="active-link">reviews</a>
        <a mat-button routerLink="/about-page" routerLinkActive="active-link">about</a>
      </div>
      <span class="spacer"></span>  
      </mat-toolbar>
      <div class="content">
        <router-outlet></router-outlet>
      </div>  
    </main>
    
  `,
  styles: [
    `
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
    `,
  ],
})

export class App {
}