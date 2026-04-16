import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  password = '';
  error = signal('');
  loading = signal(false);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/admin']);
    }
  }

  submit() {
    if (!this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.password).subscribe({
      next: ({ token }) => {
        this.auth.setToken(token);
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.error.set('Invalid password.');
        this.loading.set(false);
      }
    });
  }
}
