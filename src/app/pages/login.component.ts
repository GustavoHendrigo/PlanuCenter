import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-semibold text-gray-800">Bem-vindo de volta</h1>
          <p class="text-sm text-gray-500 mt-2">Acesse sua conta para continuar gerenciando sua oficina.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2" for="email">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
            />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="mt-2 text-sm text-red-600">Informe um e-mail válido.</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2" for="password">Senha</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua senha"
            />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <p class="mt-2 text-sm text-red-600">A senha deve ter pelo menos 6 caracteres.</p>
            }
          </div>

          <button
            type="submit"
            class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
            [disabled]="form.invalid"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = new FormBuilder();

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    // Futuramente, integrar com serviço de autenticação.
    console.log('Login realizado', this.form.value);
  }
}
