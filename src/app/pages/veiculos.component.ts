import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { Veiculo } from '../core/models/models';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/70">Veículos</p>
            <h2 class="text-2xl font-semibold text-white">Cadastro de veículos</h2>
            <p class="text-sm text-slate-300/80">Monitore todos os veículos vinculados à sua carteira de clientes.</p>
          </div>

          @if (modoVisualizacao() === 'lista') {
            <button
              class="w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 md:w-auto"
              (click)="abrirFormularioNovo()"
            >
              + Cadastrar veículo
            </button>
          } @else {
            <button
              class="w-full rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 md:w-auto"
              (click)="voltarParaLista()"
            >
              Voltar para a lista
            </button>
          }
        </div>

        @if (modoVisualizacao() === 'lista') {
          <div class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label class="flex w-full items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-4 py-2 text-sm text-slate-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></svg>
                <input
                  class="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  type="search"
                  placeholder="Pesquisar por placa, modelo, cliente ou ano"
                  [(ngModel)]="termoBuscaValor"
                  name="buscaVeiculos"
                />
              </label>
              <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{{ veiculosFiltrados().length }} resultado(s)</span>
            </div>
            <div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-white/10 text-left text-sm text-slate-100">
                <thead class="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th class="px-6 py-3 font-semibold">Placa</th>
                    <th class="px-6 py-3 font-semibold">Marca</th>
                    <th class="px-6 py-3 font-semibold">Modelo</th>
                    <th class="px-6 py-3 font-semibold">Ano</th>
                    <th class="px-6 py-3 font-semibold">Cliente</th>
                    <th class="px-6 py-3 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-sm">
                  @if (veiculosFiltrados().length === 0) {
                    <tr>
                      <td class="px-6 py-6 text-center text-slate-400" colspan="6">Nenhum veículo encontrado com os critérios informados.</td>
                    </tr>
                  }
                  @for (veiculo of veiculosFiltrados(); track veiculo.id) {
                    <tr class="transition hover:bg-white/5">
                      <td class="px-6 py-4 font-medium text-white">{{ veiculo.placa }}</td>
                      <td class="px-6 py-4 text-slate-200">{{ veiculo.marca }}</td>
                      <td class="px-6 py-4 text-slate-200">{{ veiculo.modelo }}</td>
                      <td class="px-6 py-4 text-slate-200">{{ veiculo.ano }}</td>
                      <td class="px-6 py-4 text-slate-200">{{ veiculo.clienteNome }}</td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex justify-center gap-2">
                          <button
                            class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
                            (click)="editarVeiculo(veiculo)"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            </div>
          </div>
        }

        @if (modoVisualizacao() === 'formulario') {
          <form class="grid gap-5 md:grid-cols-2" (ngSubmit)="salvarVeiculo()">
            <label class="flex flex-col text-sm text-slate-200">
              Placa
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="placa"
                [(ngModel)]="formulario.placa"
                required
                placeholder="AAA-0A00"
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Marca
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="marca"
                [(ngModel)]="formulario.marca"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Modelo
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="modelo"
                [(ngModel)]="formulario.modelo"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Ano
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="ano"
                [(ngModel)]="formulario.ano"
                required
              />
            </label>

            <label class="md:col-span-2 flex flex-col text-sm text-slate-200">
              Cliente
              <select
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="clienteId"
                [(ngModel)]="formulario.clienteId"
                required
              >
                <option [ngValue]="undefined" disabled>Selecione um cliente</option>
                @for (cliente of clientes(); track cliente.id) {
                  <option class="bg-slate-900" [ngValue]="cliente.id">{{ cliente.nome }}</option>
                }
              </select>
            </label>

            <div class="md:col-span-2 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                class="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                (click)="voltarParaLista()"
              >
                Cancelar
              </button>
              @if (editandoId()) {
                <button
                  type="button"
                  class="rounded-full border border-rose-400/60 bg-rose-500/10 px-5 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  (click)="excluirVeiculo()"
                >
                  Excluir veículo
                </button>
              }
              <button
                type="submit"
                class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
              >
                {{ editandoId() ? 'Atualizar veículo' : 'Salvar veículo' }}
              </button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
})
export class VeiculosComponent {
  private dataService = inject(DataService);

  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;

  modoVisualizacao = signal<'lista' | 'formulario'>('lista');
  editandoId = signal<number | null>(null);
  termoBusca = signal('');

  formulario = {
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    clienteId: undefined as number | undefined,
  };

  abrirFormularioNovo() {
    this.editandoId.set(null);
    this.formulario = {
      placa: '',
      marca: '',
      modelo: '',
      ano: '',
      clienteId: undefined,
    };
    this.modoVisualizacao.set('formulario');
  }

  editarVeiculo(veiculo: Veiculo) {
    this.editandoId.set(veiculo.id);
    this.formulario = {
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      clienteId: veiculo.clienteId,
    };
    this.modoVisualizacao.set('formulario');
  }

  veiculosFiltrados = computed(() => {
    const termo = this.termoBusca().toLowerCase().trim();
    if (!termo) {
      return this.veiculos();
    }
    return this.veiculos().filter(veiculo =>
      [veiculo.placa, veiculo.marca, veiculo.modelo, veiculo.ano, veiculo.clienteNome]
        .join(' ')
        .toLowerCase()
        .includes(termo)
    );
  });

  async salvarVeiculo() {
    if (!this.formulario.placa || !this.formulario.marca || !this.formulario.modelo || !this.formulario.ano || !this.formulario.clienteId) {
      return;
    }

    const cliente = this.obterClienteSelecionado();
    if (!cliente) {
      return;
    }

    const dados = {
      placa: this.formulario.placa.trim(),
      marca: this.formulario.marca.trim(),
      modelo: this.formulario.modelo.trim(),
      ano: this.formulario.ano.trim(),
      clienteId: cliente.id,
    };

    try {
      if (this.editandoId()) {
        await this.dataService.atualizarVeiculo(this.editandoId()!, dados);
      } else {
        await this.dataService.criarVeiculo(dados);
      }
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao salvar veículo', error);
    }
  }

  async excluirVeiculo() {
    if (!this.editandoId()) {
      return;
    }

    const confirmacao = confirm('Deseja realmente excluir este veículo? Ordens vinculadas a ele serão removidas.');
    if (!confirmacao) {
      return;
    }

    try {
      await this.dataService.removerVeiculo(this.editandoId()!);
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao remover veículo', error);
    }
  }

  private obterClienteSelecionado() {
    if (!this.formulario.clienteId) {
      return undefined;
    }
    return this.clientes().find(cliente => cliente.id === this.formulario.clienteId);
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.editandoId.set(null);
    this.termoBusca.set('');
  }

  get termoBuscaValor() {
    return this.termoBusca();
  }

  set termoBuscaValor(valor: string) {
    this.termoBusca.set(valor);
  }
}
