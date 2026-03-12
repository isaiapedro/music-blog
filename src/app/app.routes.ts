import { Routes } from '@angular/router';
import { AboutPage } from './about-page/about-page';
import { CollectionPage } from './collection-page/collection-page';
import { ArticlesPage } from './articles-page/articles-page';
import { HomePage } from './home-page/home-page';
import { ReviewComponent } from './review/review';
import { AdminPage } from './admin/admin-page';

export const routes: Routes = [
    { path: "", redirectTo: "home-page", pathMatch: "full" },
    {
        path: 'home-page',
        component: HomePage,
    },
    {
        path: 'articles-page',
        component: ArticlesPage,
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
        path: 'admin',
        component: AdminPage,
    },
    {
        path: 'about-page',
        component: AboutPage,
    }
];