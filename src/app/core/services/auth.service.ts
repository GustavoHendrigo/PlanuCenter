import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PerfilUsuario, Usuario } from '../models/models';

type LoginPayload = { email: string; senha: string };

type LoginResponse = {
  token: string;
  usuario: Usuario;
};

type UsuarioAutenticavel = Usuario & { senha: string };

const OFFLINE_USUARIOS: UsuarioAutenticavel[] = [
  {
    id: 1,
    nome: 'Administrador da Oficina',
    email: 'admin@oficinapro.com',
    perfil: 'admin',
    senha: 'admin123'
  },
  {
    id: 2,
    nome: 'Atendimento Principal',
    email: 'atendimento@oficinapro.com',
    perfil: 'atendimento',
    senha: 'atendimento123'
  }
];

interface SessaoPersistida {
  token: string;
  usuario: Usuario;
  expiraEm: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly storageKey = 'planu-center/auth';
  private apiDisponivel = true;
  private verificandoApi?: Promise<boolean>;

  private readonly usuarioInterno = signal<Usuario | null>(this.restaurarSessao());
  readonly usuarioAtual = computed(() => this.usuarioInterno());
  readonly estaAutenticado = computed(() => !!this.usuarioInterno());

  async login(email: string, senha: string) {
    const payload: LoginPayload = { email: email.trim().toLowerCase(), senha };

    if (!(await this.verificarApiDisponivel())) {
      return this.autenticarModoOffline(payload);
    }

    try {
      const resposta = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload)
      );
      this.persistirSessao(resposta);
      return resposta.usuario;
    } catch (error: any) {
      const deveTentarOffline = !error?.status || error.status >= 500;
      if (!deveTentarOffline) {
        throw error;
      }
      this.apiDisponivel = false;
      return this.autenticarModoOffline(payload);
    }
  }

  logout() {
    this.usuarioInterno.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  atualizarPerfilUsuario(nome: string, perfil: PerfilUsuario) {
    const usuario = this.usuarioInterno();
    if (!usuario) {
      return;
    }
    const atualizado: Usuario = { ...usuario, nome, perfil };
    this.usuarioInterno.set(atualizado);
    if (typeof localStorage !== 'undefined') {
      const armazenado = this.obterSessaoPersistida();
      if (armazenado) {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({ ...armazenado, usuario: atualizado })
        );
      }
    }
  }

  private async verificarApiDisponivel(): Promise<boolean> {
    if (!this.apiDisponivel) {
      return false;
    }

    if (!this.verificandoApi) {
      this.verificandoApi = fetch(`${this.apiUrl}/status`, {
        method: 'GET',
        cache: 'no-store'
      })
        .then(resposta => resposta.ok)
        .catch(() => false)
        .finally(() => {
          this.verificandoApi = undefined;
        });
    }

    const disponivel = await this.verificandoApi;
    if (!disponivel) {
      this.apiDisponivel = false;
    }
    return disponivel;
  }

  private autenticarModoOffline(payload: LoginPayload) {
    const usuarioOffline = this.autenticarOffline(payload.email, payload.senha);
    if (!usuarioOffline) {
      const erro = new Error('Credenciais inválidas.');
      (erro as any).status = 401;
      throw erro;
    }

    console.warn('API de autenticação indisponível. Validando credenciais localmente.');

    const respostaOffline: LoginResponse = {
      token: this.gerarTokenOffline(usuarioOffline),
      usuario: this.mapearUsuario(usuarioOffline)
    };
    this.persistirSessao(respostaOffline, true);
    return respostaOffline.usuario;
  }

  private mapearUsuario(usuario: UsuarioAutenticavel): Usuario {
    const { senha: _senha, ...resto } = usuario;
    return resto;
  }

  private autenticarOffline(email: string, senha: string) {
    return OFFLINE_USUARIOS.find(
      usuario => usuario.email.toLowerCase() === email && usuario.senha === senha
    );
  }

  private gerarTokenOffline(usuario: UsuarioAutenticavel) {
    return btoa(`${usuario.id}:${Date.now()}`);
  }

  private persistirSessao(resposta: LoginResponse, offline = false) {
    this.usuarioInterno.set(resposta.usuario);
    if (typeof localStorage === 'undefined') {
      return;
    }

    const expiraEm = Date.now() + (offline ? 8 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
    const dados: SessaoPersistida = {
      token: resposta.token,
      usuario: resposta.usuario,
      expiraEm
    };
    localStorage.setItem(this.storageKey, JSON.stringify(dados));
  }

  private restaurarSessao(): Usuario | null {
    const dados = this.obterSessaoPersistida();
    if (!dados) {
      return null;
    }
    if (Date.now() > dados.expiraEm) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
      return null;
    }
    return dados.usuario;
  }

  private obterSessaoPersistida(): SessaoPersistida | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const bruto = localStorage.getItem(this.storageKey);
    if (!bruto) {
      return null;
    }
    try {
      return JSON.parse(bruto) as SessaoPersistida;
    } catch (error) {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
