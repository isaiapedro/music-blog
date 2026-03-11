import { Routes } from '@angular/router';
import { AboutPage } from './about-page/about-page';
import { CollectionPage } from './collection-page/collection-page';
import { ArticlePage } from './articles-page/articles-page';
import { HomePage } from './home-page/home-page';
import { ReviewComponent } from './review/review';

export const routes: Routes = [
    { path: "", redirectTo: "home-page", pathMatch: "full" },
    {
        path: 'home-page',
        component: HomePage,
    },
    {
        path: 'articles-page',
        component: ArticlePage,
    },
    {
        path: 'collection-page',
        component: CollectionPage,
    },
    { 
        path: 'collection-page/:id', 
        component: ReviewComponent 
    },
    {
        path: 'about-page',
        component: AboutPage,
    }
];