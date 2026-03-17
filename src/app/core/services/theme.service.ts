import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public isDarkMode = signal<boolean>(false);

  constructor() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }

    effect(() => {
      const theme = this.isDarkMode() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  }

  toggleTheme() {
    this.isDarkMode.update((dark) => !dark);
  }
}
