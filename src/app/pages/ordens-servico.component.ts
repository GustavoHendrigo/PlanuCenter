import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/70">Operações</p>
            <h2 class="text-2xl font-semibold text-white">Gerenciar Ordens de Serviço</h2>
            <p class="text-sm text-slate-300/80">Acompanhe solicitações, status e detalhes importantes de cada atendimento.</p>
          </div>

          @if (modoVisualizacao() === 'lista') {
            <button
              class="w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 md:w-auto"
              (click)="abrirFormulario()"
            >
              + Nova ordem de serviço
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
          <div class="space-y-4">
            <div class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex-1">
                <label class="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-300/80">Pesquisar</label>
                <input
                  type="search"
                  class="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="Buscar por número da O.S., placa, cliente ou status"
                  [ngModel]="termoBusca()"
                  (ngModelChange)="termoBusca.set($event)"
                />
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-white/10 text-left text-sm text-slate-100">
                <thead class="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th class="px-6 py-3 font-semibold">OS</th>
                    <th class="px-6 py-3 font-semibold">Placa</th>
                    <th class="px-6 py-3 font-semibold">Cliente</th>
                    <th class="px-6 py-3 font-semibold">Veículo</th>
                    <th class="px-6 py-3 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-sm">
                  @if (ordensFiltradas().length) {
                    @for (os of ordensFiltradas(); track os.id) {
                    <tr class="transition hover:bg-white/5">
                      <td class="whitespace-nowrap px-6 py-4 font-semibold text-sky-300">#{{ os.id }}</td>
                      <td class="px-6 py-4">{{ getVeiculo(os.veiculoId)?.placa }}</td>
                      <td class="px-6 py-4">{{ getCliente(os.clienteId)?.nome }}</td>
                      <td class="px-6 py-4">{{ getVeiculo(os.veiculoId)?.marca }} {{ getVeiculo(os.veiculoId)?.modelo }}</td>
                      <td class="px-6 py-4 text-center">
                        <button
                          class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
                          (click)="verResumo(os.id)"
                        >
                          Ver resumo
                        </button>
                      </td>
                    </tr>
                    }
                  } @else {
                    <tr>
                      <td colspan="5" class="px-6 py-6 text-center text-sm text-slate-300">Nenhuma ordem encontrada para o filtro aplicado.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          </div>
        }

        @if (modoVisualizacao() === 'formulario') {
          <div class="space-y-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">Nova ordem de serviço</h3>
                <p class="text-sm text-slate-300/80">Cadastre uma nova solicitação vinculando cliente, veículo e observações.</p>
              </div>
            </div>
            <form class="grid gap-5 md:grid-cols-2" (ngSubmit)="salvarOrdem()">
              <label class="flex flex-col text-sm text-slate-200">
                Cliente
                <select
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.clienteId"
                  name="clienteId"
                  required
                >
                  <option [ngValue]="undefined" disabled>Selecione um cliente</option>
                  @for (cliente of clientes(); track cliente.id) {
                    <option class="bg-slate-900" [ngValue]="cliente.id">{{ cliente.nome }}</option>
                  }
                </select>
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Veículo
                <select
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.veiculoId"
                  name="veiculoId"
                  required
                >
                  <option [ngValue]="undefined" disabled>Selecione um veículo</option>
                  @for (veiculo of veiculosDisponiveis(); track veiculo?.id) {
                    <option class="bg-slate-900" [ngValue]="veiculo?.id">{{ veiculo?.placa }} - {{ veiculo?.marca }} {{ veiculo?.modelo }}</option>
                  }
                </select>
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Data de entrada
                <input
                  type="date"
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.dataEntrada"
                  name="dataEntrada"
                  required
                />
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Status
                <select
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.status"
                  name="status"
                  required
                >
                  <option [ngValue]="undefined" disabled>Selecione</option>
                  <option class="bg-slate-900" value="Em Andamento">Em andamento</option>
                  <option class="bg-slate-900" value="Aguardando Aprovação">Aguardando aprovação</option>
                  <option class="bg-slate-900" value="Finalizada">Finalizada</option>
                  <option class="bg-slate-900" value="Cancelada">Cancelada</option>
                </select>
              </label>

              <label class="md:col-span-2 flex flex-col text-sm text-slate-200">
                Observações
                <textarea
                  rows="4"
                  class="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.observacoes"
                  name="observacoes"
                  placeholder="Inclua detalhes adicionais, serviços previstos ou peças necessárias"
                ></textarea>
              </label>

              <div class="md:col-span-2 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  class="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  (click)="voltarParaLista()"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
                >
                  Salvar ordem
                </button>
              </div>
            </form>
          </div>
        }

        @if (modoVisualizacao() === 'resumo' && ordemSelecionada()) {
          <div class="space-y-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">Resumo da ordem #{{ ordemSelecionada()?.id }}</h3>
                <p class="text-sm text-slate-300/80">Veja o panorama completo de serviços, peças e anotações.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <a
                  class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                  [routerLink]="['/ordens-servico', ordemSelecionada()?.id]"
                >
                  Versão para impressão
                </a>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  [disabled]="excluindo()"
                  (click)="excluirOrdemSelecionada()"
                >
                  {{ excluindo() ? 'Excluindo...' : 'Excluir ordem' }}
                </button>
              </div>
            </div>

            <div class="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 md:grid-cols-2">
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Cliente</span>
                <span class="text-base text-white">{{ getCliente(ordemSelecionada()!.clienteId)?.nome }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Veículo</span>
                <span class="text-base text-white">
                  {{ getVeiculo(ordemSelecionada()!.veiculoId)?.marca }} {{ getVeiculo(ordemSelecionada()!.veiculoId)?.modelo }}
                  ({{ getVeiculo(ordemSelecionada()!.veiculoId)?.placa }})
                </span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Data de entrada</span>
                <span class="text-base">{{ ordemSelecionada()!.dataEntrada | date:'dd/MM/yyyy' }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
                <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  {{ ordemSelecionada()!.status }}
                </span>
              </div>
              <div class="md:col-span-2">
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Observações</span>
                <p class="mt-1 text-base text-slate-200/90">{{ ordemSelecionada()!.observacoes || 'Sem observações registradas.' }}</p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Serviços</h4>
                <ul class="mt-3 space-y-2 text-sm text-slate-200">
                  @if (ordemSelecionada()!.servicos.length) {
                    @for (servico of ordemSelecionada()!.servicos; track servico.id) {
                      <li class="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-2">
                        <span>{{ getServico(servico.id)?.descricao }}</span>
                        <span class="text-slate-300">x{{ servico.qtde }}</span>
                      </li>
                    }
                  } @else {
                    <li class="text-slate-400">Nenhum serviço vinculado.</li>
                  }
                </ul>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Peças</h4>
                <ul class="mt-3 space-y-2 text-sm text-slate-200">
                  @if (ordemSelecionada()!.pecas.length) {
                    @for (peca of ordemSelecionada()!.pecas; track peca.id) {
                      <li class="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-2">
                        <span>{{ getPeca(peca.id)?.nome }}</span>
                        <span class="text-slate-300">x{{ peca.qtde }}</span>
                      </li>
                    }
                  } @else {
                    <li class="text-slate-400">Nenhuma peça vinculada.</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class OrdensServicoComponent {
  private dataService = inject(DataService);

  ordensServico = this.dataService.ordensServico;
  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;
  servicos = this.dataService.servicos;
  pecas = this.dataService.pecas;

  modoVisualizacao = signal<'lista' | 'formulario' | 'resumo'>('lista');
  ordemSelecionadaId = signal<number | null>(null);
  termoBusca = signal('');
  excluindo = signal(false);

  formularioOrdem = {
    clienteId: undefined as number | undefined,
    veiculoId: undefined as number | undefined,
    dataEntrada: '',
    status: undefined as 'Em Andamento' | 'Aguardando Aprovação' | 'Finalizada' | 'Cancelada' | undefined,
    observacoes: '',
  };

  ordemSelecionada = computed(() => {
    const id = this.ordemSelecionadaId();
    if (id == null) {
      return undefined;
    }
    return this.dataService.getOrdemServicoById(id);
  });

  ordensFiltradas = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    const ordens = this.ordensServico();
    if (!termo) {
      return ordens;
    }

    const veiculos = this.veiculos();
    const clientes = this.clientes();

    return ordens.filter(ordem => {
      const veiculo = veiculos.find(v => v.id === ordem.veiculoId);
      const cliente = clientes.find(c => c.id === ordem.clienteId);
      const campos = [
        String(ordem.id),
        ordem.status,
        veiculo?.placa,
        veiculo?.marca,
        veiculo?.modelo,
        cliente?.nome
      ]
        .filter(Boolean)
        .map(valor => valor!.toLowerCase());
      return campos.some(valor => valor.includes(termo));
    });
  });

  abrirFormulario() {
    this.termoBusca.set('');
    this.limparFormulario();
    this.modoVisualizacao.set('formulario');
  }

  verResumo(id: number) {
    this.ordemSelecionadaId.set(id);
    this.modoVisualizacao.set('resumo');
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.ordemSelecionadaId.set(null);
    this.excluindo.set(false);
  }

  async salvarOrdem() {
    if (!this.formularioOrdem.clienteId || !this.formularioOrdem.veiculoId || !this.formularioOrdem.dataEntrada || !this.formularioOrdem.status) {
      return;
    }

    const dados = {
      clienteId: this.formularioOrdem.clienteId!,
      veiculoId: this.formularioOrdem.veiculoId!,
      dataEntrada: this.formularioOrdem.dataEntrada,
      status: this.formularioOrdem.status!,
      servicos: [],
      pecas: [],
      observacoes: this.formularioOrdem.observacoes?.trim() || undefined,
    };

    try {
      await this.dataService.criarOrdemServico(dados);
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço', error);
    }
  }

  getVeiculo(id: number) {
    return this.veiculos().find(v => v.id === id);
  }

  getCliente(id: number) {
    return this.clientes().find(c => c.id === id);
  }

  veiculosDisponiveis() {
    if (!this.formularioOrdem.clienteId) {
      return this.veiculos();
    }
    return this.veiculos().filter(v => v.clienteId === this.formularioOrdem.clienteId);
  }

  getServico(id: number) {
    return this.servicos().find(s => s.id === id);
  }

  getPeca(id: number) {
    return this.pecas().find(p => p.id === id);
  }

  async excluirOrdemSelecionada() {
    const id = this.ordemSelecionadaId();
    if (id == null) {
      return;
    }

    const confirmar = window.confirm('Tem certeza de que deseja excluir esta ordem de serviço?');
    if (!confirmar) {
      return;
    }

    this.excluindo.set(true);
    try {
      await this.dataService.excluirOrdemServico(id);
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço', error);
    } finally {
      this.excluindo.set(false);
    }
  }

  private limparFormulario() {
    this.formularioOrdem = {
      clienteId: undefined,
      veiculoId: undefined,
      dataEntrada: new Date().toISOString().split('T')[0],
      status: undefined,
      observacoes: '',
    };
  }
}
