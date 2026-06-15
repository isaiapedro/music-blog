import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  error = signal('');
  loading = signal(false);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/admin']);
    }
  }

  submit(password: string) {
    if (!password) {
      this.error.set('Please enter a password');
      return;
    }
    
    this.loading.set(true);
    this.error.set('');
    
    this.auth.login(password).subscribe({
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