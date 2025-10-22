import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <div class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label class="flex w-full items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-4 py-2 text-sm text-slate-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></svg>
                <input
                  class="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  type="search"
                  placeholder="Pesquisar por cliente, veículo, status ou número da OS"
                  [(ngModel)]="termoBuscaValor"
                  name="buscaOrdens"
                />
              </label>
              <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{{ ordensFiltradas().length }} resultado(s)</span>
            </div>
            <div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
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
                  @if (ordensFiltradas().length === 0) {
                    <tr>
                      <td class="px-6 py-6 text-center text-slate-400" colspan="5">Nenhuma ordem de serviço encontrada com os critérios informados.</td>
                    </tr>
                  }
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
              <div class="flex flex-wrap gap-2 text-sm">
                <button class="rounded-full border border-white/15 bg-white/5 px-4 py-2 font-medium text-slate-200 transition hover:bg-white/10" (click)="voltarParaLista()">
                  Voltar
                </button>
                <button class="rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-4 py-2 font-semibold text-slate-950 shadow shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400" (click)="imprimirResumo()">
                  Imprimir resumo
                </button>
                <button class="rounded-full border border-rose-400/60 bg-rose-500/10 px-4 py-2 font-semibold text-rose-200 transition hover:bg-rose-500/20" (click)="excluirOrdemSelecionada()">
                  Excluir ordem
                </button>
              </div>
            </div>

            <div class="space-y-4">
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
    const termo = this.termoBusca().toLowerCase().trim();
    if (!termo) {
      return this.ordensServico();
    }
    return this.ordensServico().filter(ordem => {
      const cliente = this.getCliente(ordem.clienteId)?.nome ?? '';
      const veiculo = this.getVeiculo(ordem.veiculoId);
      const placa = veiculo?.placa ?? '';
      const modelo = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : '';
      return [ordem.id.toString(), cliente, placa, modelo, ordem.status]
        .join(' ')
        .toLowerCase()
        .includes(termo);
    });
  });

  abrirFormulario() {
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
    if (!id) {
      return;
    }

    const confirmacao = confirm('Deseja realmente excluir esta ordem de serviço?');
    if (!confirmacao) {
      return;
    }

    try {
      await this.dataService.removerOrdemServico(id);
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao remover ordem de serviço', error);
    }
  }

  imprimirResumo() {
    const ordem = this.ordemSelecionada();
    if (!ordem) {
      return;
    }

    const cliente = this.getCliente(ordem.clienteId);
    const veiculo = this.getVeiculo(ordem.veiculoId);

    const servicosDetalhados = ordem.servicos.map(item => {
      const servico = this.getServico(item.id);
      const preco = servico?.preco ?? 0;
      return {
        descricao: servico?.descricao ?? 'Serviço',
        qtde: item.qtde,
        preco,
        subtotal: preco * item.qtde
      };
    });

    const pecasDetalhadas = ordem.pecas.map(item => {
      const peca = this.getPeca(item.id);
      const preco = peca?.preco ?? 0;
      return {
        descricao: peca?.nome ?? 'Peça',
        qtde: item.qtde,
        preco,
        subtotal: preco * item.qtde
      };
    });

    const totalServicos = servicosDetalhados.reduce((total, item) => total + item.subtotal, 0);
    const totalPecas = pecasDetalhadas.reduce((total, item) => total + item.subtotal, 0);
    const totalGeral = totalServicos + totalPecas;

    const tabelaServicos = servicosDetalhados.length
      ? servicosDetalhados
          .map(
            item => `
            <tr>
              <td>${item.descricao}</td>
              <td class="center">${item.qtde}</td>
              <td class="right">${this.formatarMoeda(item.preco)}</td>
              <td class="right">${this.formatarMoeda(item.subtotal)}</td>
            </tr>
          `
          )
          .join('')
      : '<tr><td colspan="4" class="center">Nenhum serviço vinculado.</td></tr>';

    const tabelaPecas = pecasDetalhadas.length
      ? pecasDetalhadas
          .map(
            item => `
            <tr>
              <td>${item.descricao}</td>
              <td class="center">${item.qtde}</td>
              <td class="right">${this.formatarMoeda(item.preco)}</td>
              <td class="right">${this.formatarMoeda(item.subtotal)}</td>
            </tr>
          `
          )
          .join('')
      : '<tr><td colspan="4" class="center">Nenhuma peça vinculada.</td></tr>';

    const janela = window.open('', '_blank', 'width=900,height=650');
    if (!janela) {
      return;
    }

    janela.document.write(`
      <html>
        <head>
          <title>Resumo OS #${ordem.id}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; padding: 32px; background: #f8fafc; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 32px; }
            .subtle { color: #475569; margin: 0; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 24px; }
            .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08); }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 14px; }
            th { background: #f1f5f9; text-align: left; font-weight: 600; }
            .right { text-align: right; }
            .center { text-align: center; }
            .totais { max-width: 280px; margin-left: auto; margin-top: 16px; }
            .totais div { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .totais strong { font-size: 18px; }
            .badge { display: inline-flex; padding: 6px 14px; border-radius: 999px; background: #e0f2fe; color: #0c4a6e; font-size: 12px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <header>
            <h1>OficinaPRO</h1>
            <p class="subtle">Rua das Mecânicas, 123 - Bairro Industrial · Uberlândia - MG · (34) 99999-8888</p>
            <span class="badge">Ordem de Serviço #${ordem.id}</span>
          </header>

          <section class="grid">
            <div class="card">
              <h2>Cliente</h2>
              <p>${cliente?.nome ?? 'Cliente não informado'}</p>
            </div>
            <div class="card">
              <h2>Veículo</h2>
              <p>${veiculo ? `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : 'Veículo não informado'}</p>
            </div>
            <div class="card">
              <h2>Detalhes</h2>
              <p>Entrada: ${new Date(ordem.dataEntrada).toLocaleDateString('pt-BR')}</p>
              <p>Status: ${ordem.status}</p>
            </div>
            <div class="card">
              <h2>Observações</h2>
              <p>${ordem.observacoes ?? 'Sem observações registradas.'}</p>
            </div>
          </section>

          <section class="card" style="margin-top: 32px;">
            <h2>Serviços</h2>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="center">Qtde</th>
                  <th class="right">Valor unitário</th>
                  <th class="right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${tabelaServicos}</tbody>
            </table>
          </section>

          <section class="card" style="margin-top: 24px;">
            <h2>Peças</h2>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="center">Qtde</th>
                  <th class="right">Valor unitário</th>
                  <th class="right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${tabelaPecas}</tbody>
            </table>
          </section>

          <div class="totais card">
            <div><span>Total de serviços:</span><span>${this.formatarMoeda(totalServicos)}</span></div>
            <div><span>Total de peças:</span><span>${this.formatarMoeda(totalPecas)}</span></div>
            <div><strong>Valor total:</strong><strong>${this.formatarMoeda(totalGeral)}</strong></div>
          </div>

          <footer style="margin-top: 40px; text-align: center; color: #475569; font-size: 13px;">
            <p>Todos os serviços e produtos possuem garantia de 3 meses.</p>
            <p><strong>Obrigado pela preferência!</strong></p>
          </footer>
        </body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    janela.print();
  }

  private formatarMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
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

  get termoBuscaValor() {
    return this.termoBusca();
  }

  set termoBuscaValor(valor: string) {
    this.termoBusca.set(valor);
  }
}
