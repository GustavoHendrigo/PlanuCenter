import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { UsuarioAutenticado } from '../models/models';

interface LoginResponse {
  token: string;
  usuario: UsuarioAutenticado;
}

interface AuthState {
  usuario: UsuarioAutenticado | null;
  token: string | null;
}

const STORAGE_KEY = 'planu-center-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = 'http://localhost:3000/api';

  private state = signal<AuthState>({ usuario: null, token: null });

  readonly usuarioAtual = computed(() => this.state().usuario);
  readonly token = computed(() => this.state().token);
  readonly autenticado = computed(() => !!this.state().usuario && !!this.state().token);

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthState;
        if (parsed.usuario && parsed.token) {
          this.state.set(parsed);
        }
      } catch (error) {
        console.warn('Não foi possível restaurar a sessão salva.', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
        email: email.trim(),
        password
      })
    );

    const novoEstado: AuthState = {
      usuario: response.usuario,
      token: response.token
    };

    this.state.set(novoEstado);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novoEstado));
  }

  logout(): void {
    this.state.set({ usuario: null, token: null });
    localStorage.removeItem(STORAGE_KEY);
    void this.router.navigate(['/login']);
  }
}
