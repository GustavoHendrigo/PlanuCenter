import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';

  readonly clientes = signal<Cliente[]>([]);
  readonly veiculos = signal<Veiculo[]>([]);
  readonly pecas = signal<Peca[]>([]);
  readonly servicos = signal<Servico[]>([]);
  readonly ordensServico = signal<OrdemServico[]>([]);

  constructor() {
    void this.carregarDadosIniciais();
  }

  async carregarDadosIniciais() {
    await Promise.all([
      this.carregarClientes(),
      this.carregarVeiculos(),
      this.carregarPecas(),
      this.carregarServicos(),
      this.carregarOrdensServico(),
    ]);
  }

  async carregarClientes() {
    try {
      const clientes = await firstValueFrom(this.http.get<Cliente[]>(`${this.apiUrl}/clientes`));
      this.clientes.set(clientes);
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
    }
  }

  async excluirCliente(id: number) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/clientes/${id}`));
      await Promise.all([this.carregarClientes(), this.carregarVeiculos(), this.carregarOrdensServico()]);
    } catch (error) {
      console.error('Erro ao excluir cliente', error);
      throw error;
    }
  }

  async criarCliente(dados: Omit<Cliente, 'id'>) {
    const novo = await firstValueFrom(this.http.post<Cliente>(`${this.apiUrl}/clientes`, dados));
    this.clientes.update(lista => [novo, ...lista.filter(cliente => cliente.id !== novo.id)]);
    return novo;
  }

  async atualizarCliente(id: number, dados: Omit<Cliente, 'id'>) {
    const atualizado = await firstValueFrom(this.http.put<Cliente>(`${this.apiUrl}/clientes/${id}`, dados));
    this.clientes.update(lista => lista.map(cliente => (cliente.id === id ? atualizado : cliente)));
    await this.carregarVeiculos();
    return atualizado;
  }

  async carregarVeiculos() {
    try {
      const veiculos = await firstValueFrom(this.http.get<Veiculo[]>(`${this.apiUrl}/veiculos`));
      this.veiculos.set(veiculos);
    } catch (error) {
      console.error('Erro ao carregar veículos', error);
    }
  }

  async excluirVeiculo(id: number) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/veiculos/${id}`));
      await Promise.all([this.carregarVeiculos(), this.carregarOrdensServico()]);
    } catch (error) {
      console.error('Erro ao excluir veículo', error);
      throw error;
    }
  }

  async criarVeiculo(dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const novo = await firstValueFrom(this.http.post<Veiculo>(`${this.apiUrl}/veiculos`, dados));
    this.veiculos.update(lista => [novo, ...lista.filter(veiculo => veiculo.id !== novo.id)]);
    return novo;
  }

  async atualizarVeiculo(id: number, dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const atualizado = await firstValueFrom(this.http.put<Veiculo>(`${this.apiUrl}/veiculos/${id}`, dados));
    this.veiculos.update(lista => lista.map(veiculo => (veiculo.id === id ? atualizado : veiculo)));
    return atualizado;
  }

  async carregarPecas() {
    try {
      const pecas = await firstValueFrom(this.http.get<Peca[]>(`${this.apiUrl}/pecas`));
      this.pecas.set(pecas);
    } catch (error) {
      console.error('Erro ao carregar peças', error);
    }
  }

  async excluirPeca(id: number) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/pecas/${id}`));
      await Promise.all([this.carregarPecas(), this.carregarOrdensServico()]);
    } catch (error) {
      console.error('Erro ao excluir peça', error);
      throw error;
    }
  }

  async criarPeca(dados: Omit<Peca, 'id'>) {
    const nova = await firstValueFrom(this.http.post<Peca>(`${this.apiUrl}/pecas`, dados));
    this.pecas.update(lista => [nova, ...lista.filter(peca => peca.id !== nova.id)]);
    return nova;
  }

  async atualizarPeca(id: number, dados: Omit<Peca, 'id'>) {
    const atualizada = await firstValueFrom(this.http.put<Peca>(`${this.apiUrl}/pecas/${id}`, dados));
    this.pecas.update(lista => lista.map(peca => (peca.id === id ? atualizada : peca)));
    return atualizada;
  }

  async carregarServicos() {
    try {
      const servicos = await firstValueFrom(this.http.get<Servico[]>(`${this.apiUrl}/servicos`));
      this.servicos.set(servicos);
    } catch (error) {
      console.error('Erro ao carregar serviços', error);
    }
  }

  async carregarOrdensServico() {
    try {
      const ordens = await firstValueFrom(this.http.get<OrdemServico[]>(`${this.apiUrl}/ordens-servico`));
      this.ordensServico.set(ordens);
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço', error);
    }
  }

  async excluirOrdemServico(id: number) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/ordens-servico/${id}`));
      await this.carregarOrdensServico();
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço', error);
      throw error;
    }
  }

  async criarOrdemServico(dados: Omit<OrdemServico, 'id'>) {
    const nova = await firstValueFrom(this.http.post<OrdemServico>(`${this.apiUrl}/ordens-servico`, dados));
    this.ordensServico.update(lista => [nova, ...lista.filter(ordem => ordem.id !== nova.id)]);
    return nova;
  }

  async atualizarOrdemServico(id: number, dados: Omit<OrdemServico, 'id'>) {
    const atualizada = await firstValueFrom(this.http.put<OrdemServico>(`${this.apiUrl}/ordens-servico/${id}`, dados));
    this.ordensServico.update(lista => lista.map(ordem => (ordem.id === id ? atualizada : ordem)));
    return atualizada;
  }

  getOrdemServicoById(id: number): OrdemServico | undefined {
    return this.ordensServico().find(os => os.id === id);
  }
}
