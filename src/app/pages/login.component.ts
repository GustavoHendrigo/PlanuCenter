import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-slate-100">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -left-20 top-10 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl"></div>
      </div>
      <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div class="mb-10 text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.5em] text-sky-300/80">PlanuCenter</p>
          <h1 class="mt-3 text-3xl font-semibold text-white">Bem-vindo de volta</h1>
          <p class="mt-2 text-sm text-slate-300/80">Acesse sua conta para continuar gerenciando a operação da sua oficina.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          @if (erroLogin()) {
            <div class="flex items-center gap-3 rounded-2xl border border-rose-400/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M4.93 19.07A10 10 0 1 1 19.07 4.93 10 10 0 0 1 4.93 19.07z" /></svg>
              <span>{{ erroLogin() }}</span>
            </div>
          }

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-200" for="email">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              placeholder="seu@email.com"
            />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="mt-2 text-sm text-rose-300">Informe um e-mail válido.</p>
            }
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-200" for="password">Senha</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              placeholder="Digite sua senha"
            />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <p class="mt-2 text-sm text-rose-300">A senha deve ter pelo menos 6 caracteres.</p>
            }
          </div>

          <button
            type="submit"
            class="w-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:via-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="form.invalid || carregando()"
          >
            {{ carregando() ? 'Validando acesso...' : 'Entrar' }}
          </button>
        </form>

        <div class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300/90">
          <p class="font-semibold text-slate-100">Acesso rápido</p>
          <p class="mt-2">Use <span class="font-medium text-white">admin@oficinapro.com</span> com senha <span class="font-medium text-white">admin123</span> para entrar como administrador.</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = new FormBuilder();
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  erroLogin = signal<string | null>(null);
  carregando = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    effect(() => {
      if (this.authService.estaAutenticado()) {
        void this.router.navigate(['/inicio']);
      }
    });
  }

  async onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const email = this.form.value.email ?? '';
    const senha = this.form.value.password ?? '';
    this.carregando.set(true);
    this.erroLogin.set(null);

    try {
      await this.authService.login(email, senha);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/inicio';
      void this.router.navigateByUrl(returnUrl);
    } catch (error: any) {
      if (error?.status === 401) {
        this.erroLogin.set('Credenciais inválidas. Verifique e tente novamente.');
      } else {
        this.erroLogin.set('Não foi possível validar o acesso no momento. Tente novamente em instantes.');
      }
    } finally {
      this.carregando.set(false);
    }
  }
}
