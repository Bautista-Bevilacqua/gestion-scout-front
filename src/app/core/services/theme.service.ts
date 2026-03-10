import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Señal que indica si el modo oscuro está activo
  public isDarkMode = signal<boolean>(false);

  constructor() {
    // 1. Buscamos si ya había elegido un tema antes
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      // 2. Si es la primera vez, miramos la preferencia de su Windows/Mac/Celular
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }

    // 3. Este 'effect' se ejecuta automáticamente cada vez que cambia isDarkMode
    effect(() => {
      const theme = this.isDarkMode() ? 'dark' : 'light';
      // Le inyectamos el atributo al HTML para que DaisyUI haga su magia
      document.documentElement.setAttribute('data-theme', theme);
      // Guardamos la preferencia
      localStorage.setItem('theme', theme);
    });
  }

  toggleTheme() {
    this.isDarkMode.update((dark) => !dark);
  }
}
