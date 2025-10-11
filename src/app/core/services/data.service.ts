import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly clientes = signal<Cliente[]>([]);
  readonly veiculos = signal<Veiculo[]>([]);
  readonly pecas = signal<Peca[]>([]);
  readonly servicos = signal<Servico[]>([]);
  readonly ordensServico = signal<OrdemServico[]>([]);

  constructor() {
    this.refreshClientes().subscribe({ error: this.handleError('carregar clientes') });
    this.refreshVeiculos().subscribe({ error: this.handleError('carregar veículos') });
    this.refreshPecas().subscribe({ error: this.handleError('carregar peças') });
    this.refreshServicos().subscribe({ error: this.handleError('carregar serviços') });
    this.refreshOrdensServico().subscribe({ error: this.handleError('carregar ordens de serviço') });
  }

  private handleError(contexto: string) {
    return (erro: unknown) => {
      console.error(`Falha ao ${contexto}:`, erro);
    };
  }

  refreshClientes() {
    return this.http
      .get<Cliente[]>(`${this.apiUrl}/clients`)
      .pipe(tap(clientes => this.clientes.set(clientes)));
  }

  refreshVeiculos() {
    return this.http
      .get<Veiculo[]>(`${this.apiUrl}/vehicles`)
      .pipe(tap(veiculos => this.veiculos.set(veiculos)));
  }

  refreshPecas() {
    return this.http
      .get<Peca[]>(`${this.apiUrl}/parts`)
      .pipe(tap(pecas => this.pecas.set(pecas)));
  }

  refreshServicos() {
    return this.http
      .get<Servico[]>(`${this.apiUrl}/services`)
      .pipe(tap(servicos => this.servicos.set(servicos)));
  }

  refreshOrdensServico() {
    return this.http
      .get<OrdemServico[]>(`${this.apiUrl}/orders`)
      .pipe(tap(ordens => this.ordensServico.set(ordens)));
  }

  createCliente(cliente: Omit<Cliente, 'id'>) {
    return this.http
      .post<Cliente>(`${this.apiUrl}/clients`, cliente)
      .pipe(tap(novo => this.clientes.update(lista => [novo, ...lista])));
  }

  updateCliente(id: number, cliente: Omit<Cliente, 'id'>) {
    return this.http
      .put<Cliente>(`${this.apiUrl}/clients/${id}`, cliente)
      .pipe(tap(atualizado => this.clientes.update(lista => lista.map(item => (item.id === id ? atualizado : item)))));
  }

  deleteCliente(id: number) {
    return this.http
      .delete<void>(`${this.apiUrl}/clients/${id}`)
      .pipe(tap(() => this.clientes.update(lista => lista.filter(item => item.id !== id))));
  }

  createVeiculo(veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    return this.http
      .post<Veiculo>(`${this.apiUrl}/vehicles`, veiculo)
      .pipe(tap(novo => this.veiculos.update(lista => [novo, ...lista])));
  }

  updateVeiculo(id: number, veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    return this.http
      .put<Veiculo>(`${this.apiUrl}/vehicles/${id}`, veiculo)
      .pipe(tap(atualizado => this.veiculos.update(lista => lista.map(item => (item.id === id ? atualizado : item)))));
  }

  deleteVeiculo(id: number) {
    return this.http
      .delete<void>(`${this.apiUrl}/vehicles/${id}`)
      .pipe(tap(() => this.veiculos.update(lista => lista.filter(item => item.id !== id))));
  }

  createPeca(peca: Omit<Peca, 'id'>) {
    return this.http
      .post<Peca>(`${this.apiUrl}/parts`, peca)
      .pipe(tap(nova => this.pecas.update(lista => [nova, ...lista])));
  }

  updatePeca(id: number, peca: Omit<Peca, 'id'>) {
    return this.http
      .put<Peca>(`${this.apiUrl}/parts/${id}`, peca)
      .pipe(tap(atualizada => this.pecas.update(lista => lista.map(item => (item.id === id ? atualizada : item)))));
  }

  deletePeca(id: number) {
    return this.http
      .delete<void>(`${this.apiUrl}/parts/${id}`)
      .pipe(tap(() => this.pecas.update(lista => lista.filter(item => item.id !== id))));
  }

  createServico(servico: Omit<Servico, 'id'>) {
    return this.http
      .post<Servico>(`${this.apiUrl}/services`, servico)
      .pipe(tap(novo => this.servicos.update(lista => [novo, ...lista])));
  }

  updateServico(id: number, servico: Omit<Servico, 'id'>) {
    return this.http
      .put<Servico>(`${this.apiUrl}/services/${id}`, servico)
      .pipe(tap(atualizado => this.servicos.update(lista => lista.map(item => (item.id === id ? atualizado : item)))));
  }

  deleteServico(id: number) {
    return this.http
      .delete<void>(`${this.apiUrl}/services/${id}`)
      .pipe(tap(() => this.servicos.update(lista => lista.filter(item => item.id !== id))));
  }

  createOrdemServico(ordem: Omit<OrdemServico, 'id'>) {
    return this.http
      .post<OrdemServico>(`${this.apiUrl}/orders`, ordem)
      .pipe(tap(nova => this.ordensServico.update(lista => [nova, ...lista])));
  }

  updateStatusOrdemServico(id: number, status: OrdemServico['status']) {
    return this.http
      .put<OrdemServico>(`${this.apiUrl}/orders/${id}`, { status })
      .pipe(tap(atualizada => this.ordensServico.update(lista => lista.map(item => (item.id === id ? atualizada : item)))));
  }

  deleteOrdemServico(id: number) {
    return this.http
      .delete<void>(`${this.apiUrl}/orders/${id}`)
      .pipe(tap(() => this.ordensServico.update(lista => lista.filter(item => item.id !== id))));
  }

  getOrdemServicoById(id: number) {
    return this.ordensServico().find(ordem => ordem.id === id);
  }

  fetchOrdemServicoById(id: number) {
    return this.http.get<OrdemServico>(`${this.apiUrl}/orders/${id}`);
  }
}
