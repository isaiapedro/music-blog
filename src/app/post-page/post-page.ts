import { Component, signal, computed, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ARTICLES } from '../article.data';

@Component({
  selector: 'app-articles-page',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './post-page.html',
  styleUrl: './post-page.css'
})
export class PostPage {

}