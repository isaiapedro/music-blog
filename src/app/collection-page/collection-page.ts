import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { REVIEWS } from '../review.data';

@Component({
  selector: 'app-collection-page',
  imports: [RouterModule, CurrencyPipe, FormsModule],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css'
})
export class CollectionPage {
  reviews = signal(REVIEWS);
  searchTerm = signal('');
  selectedGenre = signal<string | null>(null);
  selectedDecade = signal<string | null>(null);
  selectedYear = signal<string | null>(null);
  selectedCountry = signal<string | null>(null);

  currentPage = signal(1);
  itemsPerPage = 5;

  genres = ['Rock', 'Pop', 'Jazz', 'Electronic', 'Hip Hop', 'Indie', 'Folk'];
  decades = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
  countries = ['USA', 'UK', 'Brazil', 'Japan', 'Germany', 'France', 'Canada'];

  availableYears = computed(() => {
    const decade = this.selectedDecade();
    if (!decade) return [];
    const start = parseInt(decade.replace('s', ''), 10);
    return Array.from({ length: 10 }, (_, i) => (start + i).toString());
  });

  filteredReviews = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const genre = this.selectedGenre();
    const decade = this.selectedDecade();
    const year = this.selectedYear();
    const country = this.selectedCountry();

    return this.reviews().filter((review: any) => {
      const matchesSearch = review.name.toLowerCase().includes(term);
      const matchesGenre = !genre || review.genres.includes(genre);
      const matchesDecade = !decade || review.date.startsWith(decade.slice(0, 3));
      const matchesYear = !year || review.date.startsWith(year);
      const matchesCountry = !country || review.country === country;

      return matchesSearch && matchesGenre && matchesDecade && matchesYear && matchesCountry;
    });
  });

  paginatedReviews = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredReviews().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredReviews().length / this.itemsPerPage);
  });

  updateSearch(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleGenre(genre: string) {
    this.selectedGenre.update(v => v === genre ? null : genre);
    this.currentPage.set(1);
  }

  selectDecade(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedDecade.set(val === '' ? null : val);
    this.selectedYear.set(null);
    this.currentPage.set(1);
  }

  selectYear(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedYear.set(val === '' ? null : val);
    this.currentPage.set(1);
  }

  toggleCountry(country: string) {
    this.selectedCountry.update(v => v === country ? null : country);
    this.currentPage.set(1);
  }

}