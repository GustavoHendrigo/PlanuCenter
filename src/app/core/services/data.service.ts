import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';

type OfflineDatabase = {
  clientes: Cliente[];
  veiculos: Veiculo[];
  pecas: Peca[];
  servicos: Servico[];
  ordensServico: OrdemServico[];
};

const OFFLINE_DATA: OfflineDatabase = {
  clientes: [
    { id: 1, nome: 'Carlos Alberto', email: 'carlos.alberto@email.com', telefone: '(11) 91234-5678' },
    { id: 2, nome: 'Joana Pereira', email: 'joana.pereira@email.com', telefone: '(11) 98765-4321' },
    { id: 3, nome: 'Pedro Henrique', email: 'pedro.henrique@email.com', telefone: '(21) 99876-5432' },
    { id: 4, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '(31) 93456-7890' }
  ],
  veiculos: [
    { id: 1, placa: 'ROZ-1295', marca: 'Toyota', modelo: 'Corolla', ano: '2022', clienteId: 1, clienteNome: 'Carlos Alberto' },
    { id: 2, placa: 'PEA-0M40', marca: 'Honda', modelo: 'Civic', ano: '2021', clienteId: 3, clienteNome: 'Pedro Henrique' },
    { id: 3, placa: 'LBT-3954', marca: 'Ford', modelo: 'Ranger', ano: '2023', clienteId: 4, clienteNome: 'João da Silva' },
    { id: 4, placa: 'XYZ-7890', marca: 'Chevrolet', modelo: 'Onix', ano: '2020', clienteId: 2, clienteNome: 'Joana Pereira' }
  ],
  pecas: [
    { id: 101, nome: 'Filtro de Óleo', codigo: 'FO-001', estoque: 15, preco: 35 },
    { id: 102, nome: 'Pastilha de Freio', codigo: 'PF-002', estoque: 8, preco: 120.5 },
    { id: 103, nome: 'Vela de Ignição', codigo: 'VI-003', estoque: 32, preco: 25 },
    { id: 104, nome: 'Óleo Motor 5W30', codigo: 'OM-004', estoque: 20, preco: 55 }
  ],
  servicos: [
    { id: 201, descricao: 'Troca de Óleo e Filtro', preco: 150 },
    { id: 202, descricao: 'Alinhamento e Balanceamento', preco: 180 },
    { id: 203, descricao: 'Revisão Sistema de Freios', preco: 250 }
  ],
  ordensServico: [
    {
      id: 974,
      clienteId: 1,
      veiculoId: 1,
      dataEntrada: '2025-09-07',
      status: 'Em Andamento',
      servicos: [{ id: 201, qtde: 1 }],
      pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }]
    },
    {
      id: 973,
      clienteId: 1,
      veiculoId: 1,
      dataEntrada: '2025-09-06',
      status: 'Finalizada',
      servicos: [{ id: 202, qtde: 1 }],
      pecas: [],
      observacoes: 'Cliente autorizou serviços adicionais.'
    },
    {
      id: 971,
      clienteId: 3,
      veiculoId: 2,
      dataEntrada: '2025-09-05',
      status: 'Aguardando Aprovação',
      servicos: [{ id: 203, qtde: 1 }],
      pecas: [{ id: 102, qtde: 2 }]
    },
    {
      id: 968,
      clienteId: 4,
      veiculoId: 3,
      dataEntrada: '2025-09-02',
      status: 'Finalizada',
      servicos: [{ id: 201, qtde: 1 }],
      pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }],
      observacoes: 'Veículo entregue ao cliente.'
    }
  ]
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const sortByIdDesc = <T extends { id: number }>(lista: T[]): T[] => [...lista].sort((a, b) => b.id - a.id);

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly offlineState: OfflineDatabase = deepClone(OFFLINE_DATA);
  private notificouFalhaApi = false;
  private apiDisponivel = true;
  private verificandoApi?: Promise<boolean>;

  readonly clientes = signal<Cliente[]>([]);
  readonly veiculos = signal<Veiculo[]>([]);
  readonly pecas = signal<Peca[]>([]);
  readonly servicos = signal<Servico[]>([]);
  readonly ordensServico = signal<OrdemServico[]>([]);
  readonly modoOffline = signal(false);

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
    if (this.modoOffline()) {
      this.reaplicarClientesOffline();
      return;
    }
    if (!(await this.garantirApiDisponivel('clientes'))) {
      return;
    }
    try {
      const clientes = await firstValueFrom(this.http.get<Cliente[]>(`${this.apiUrl}/clientes`));
      this.atualizarClientes(clientes);
    } catch (error) {
      this.registrarFalhaApi('clientes');
      this.ativarModoOffline();
    }
  }

  async criarCliente(dados: Omit<Cliente, 'id'>) {
    if (this.modoOffline()) {
      return this.criarClienteOffline(dados);
    }

    if (!(await this.garantirApiDisponivel('clientes'))) {
      return this.criarClienteOffline(dados);
    }

    try {
      const novo = await firstValueFrom(this.http.post<Cliente>(`${this.apiUrl}/clientes`, dados));
      this.clientes.update(lista => [novo, ...lista.filter(cliente => cliente.id !== novo.id)]);
      this.offlineState.clientes = deepClone(this.clientes());
      return novo;
    } catch (error) {
      this.registrarFalhaApi('clientes');
      this.ativarModoOffline();
      return this.criarClienteOffline(dados);
    }
  }

  async atualizarCliente(id: number, dados: Omit<Cliente, 'id'>) {
    if (this.modoOffline()) {
      return this.atualizarClienteOffline(id, dados);
    }

    if (!(await this.garantirApiDisponivel('clientes'))) {
      return this.atualizarClienteOffline(id, dados);
    }

    try {
      const atualizado = await firstValueFrom(this.http.put<Cliente>(`${this.apiUrl}/clientes/${id}`, dados));
      this.clientes.update(lista => lista.map(cliente => (cliente.id === id ? atualizado : cliente)));
      this.offlineState.clientes = deepClone(this.clientes());
      await this.carregarVeiculos();
      return atualizado;
    } catch (error) {
      this.registrarFalhaApi('clientes');
      this.ativarModoOffline();
      return this.atualizarClienteOffline(id, dados);
    }
  }

  async removerCliente(id: number) {
    if (this.modoOffline()) {
      this.removerClienteOffline(id);
      return;
    }

    if (!(await this.garantirApiDisponivel('clientes'))) {
      this.removerClienteOffline(id);
      return;
    }

    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/clientes/${id}`));
      this.clientes.update(lista => lista.filter(cliente => cliente.id !== id));
      this.veiculos.update(lista => lista.filter(veiculo => veiculo.clienteId !== id));
      this.ordensServico.update(lista => lista.filter(ordem => ordem.clienteId !== id));
      this.offlineState.clientes = deepClone(this.clientes());
      this.offlineState.veiculos = deepClone(this.veiculos());
      this.offlineState.ordensServico = deepClone(this.ordensServico());
    } catch (error) {
      this.registrarFalhaApi('clientes');
      this.ativarModoOffline();
      this.removerClienteOffline(id);
    }
  }

  async carregarVeiculos() {
    if (this.modoOffline()) {
      this.reaplicarVeiculosOffline();
      return;
    }
    if (!(await this.garantirApiDisponivel('veículos'))) {
      return;
    }
    try {
      const veiculos = await firstValueFrom(this.http.get<Veiculo[]>(`${this.apiUrl}/veiculos`));
      this.atualizarVeiculos(veiculos);
    } catch (error) {
      this.registrarFalhaApi('veículos');
      this.ativarModoOffline();
    }
  }

  async criarVeiculo(dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (this.modoOffline()) {
      return this.criarVeiculoOffline(dados);
    }

    if (!(await this.garantirApiDisponivel('veículos'))) {
      return this.criarVeiculoOffline(dados);
    }

    try {
      const novo = await firstValueFrom(this.http.post<Veiculo>(`${this.apiUrl}/veiculos`, dados));
      this.veiculos.update(lista => [novo, ...lista.filter(veiculo => veiculo.id !== novo.id)]);
      this.offlineState.veiculos = deepClone(this.veiculos());
      return novo;
    } catch (error) {
      this.registrarFalhaApi('veículos');
      this.ativarModoOffline();
      return this.criarVeiculoOffline(dados);
    }
  }

  async atualizarVeiculo(id: number, dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (this.modoOffline()) {
      return this.atualizarVeiculoOffline(id, dados);
    }

    if (!(await this.garantirApiDisponivel('veículos'))) {
      return this.atualizarVeiculoOffline(id, dados);
    }

    try {
      const atualizado = await firstValueFrom(this.http.put<Veiculo>(`${this.apiUrl}/veiculos/${id}`, dados));
      this.veiculos.update(lista => lista.map(veiculo => (veiculo.id === id ? atualizado : veiculo)));
      this.offlineState.veiculos = deepClone(this.veiculos());
      return atualizado;
    } catch (error) {
      this.registrarFalhaApi('veículos');
      this.ativarModoOffline();
      return this.atualizarVeiculoOffline(id, dados);
    }
  }

  async removerVeiculo(id: number) {
    if (this.modoOffline()) {
      this.removerVeiculoOffline(id);
      return;
    }

    if (!(await this.garantirApiDisponivel('veículos'))) {
      this.removerVeiculoOffline(id);
      return;
    }

    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/veiculos/${id}`));
      this.veiculos.update(lista => lista.filter(veiculo => veiculo.id !== id));
      this.ordensServico.update(lista => lista.filter(ordem => ordem.veiculoId !== id));
      this.offlineState.veiculos = deepClone(this.veiculos());
      this.offlineState.ordensServico = deepClone(this.ordensServico());
    } catch (error) {
      this.registrarFalhaApi('veículos');
      this.ativarModoOffline();
      this.removerVeiculoOffline(id);
    }
  }

  async carregarPecas() {
    if (this.modoOffline()) {
      this.reaplicarPecasOffline();
      return;
    }
    if (!(await this.garantirApiDisponivel('peças'))) {
      return;
    }
    try {
      const pecas = await firstValueFrom(this.http.get<Peca[]>(`${this.apiUrl}/pecas`));
      this.atualizarPecas(pecas);
    } catch (error) {
      this.registrarFalhaApi('peças');
      this.ativarModoOffline();
    }
  }

  async criarPeca(dados: Omit<Peca, 'id'>) {
    if (this.modoOffline()) {
      return this.criarPecaOffline(dados);
    }

    if (!(await this.garantirApiDisponivel('peças'))) {
      return this.criarPecaOffline(dados);
    }

    try {
      const nova = await firstValueFrom(this.http.post<Peca>(`${this.apiUrl}/pecas`, dados));
      this.pecas.update(lista => [nova, ...lista.filter(peca => peca.id !== nova.id)]);
      this.offlineState.pecas = deepClone(this.pecas());
      return nova;
    } catch (error) {
      this.registrarFalhaApi('peças');
      this.ativarModoOffline();
      return this.criarPecaOffline(dados);
    }
  }

  async atualizarPeca(id: number, dados: Omit<Peca, 'id'>) {
    if (this.modoOffline()) {
      return this.atualizarPecaOffline(id, dados);
    }

    if (!(await this.garantirApiDisponivel('peças'))) {
      return this.atualizarPecaOffline(id, dados);
    }

    try {
      const atualizada = await firstValueFrom(this.http.put<Peca>(`${this.apiUrl}/pecas/${id}`, dados));
      this.pecas.update(lista => lista.map(peca => (peca.id === id ? atualizada : peca)));
      this.offlineState.pecas = deepClone(this.pecas());
      return atualizada;
    } catch (error) {
      this.registrarFalhaApi('peças');
      this.ativarModoOffline();
      return this.atualizarPecaOffline(id, dados);
    }
  }

  async removerPeca(id: number) {
    if (this.modoOffline()) {
      this.removerPecaOffline(id);
      return;
    }

    if (!(await this.garantirApiDisponivel('peças'))) {
      this.removerPecaOffline(id);
      return;
    }

    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/pecas/${id}`));
      this.pecas.update(lista => lista.filter(peca => peca.id !== id));
      this.ordensServico.update(lista =>
        lista.map(ordem => ({
          ...ordem,
          pecas: ordem.pecas.filter(item => item.id !== id)
        }))
      );
      this.offlineState.pecas = deepClone(this.pecas());
      this.offlineState.ordensServico = deepClone(this.ordensServico());
    } catch (error) {
      this.registrarFalhaApi('peças');
      this.ativarModoOffline();
      this.removerPecaOffline(id);
    }
  }

  async carregarServicos() {
    if (this.modoOffline()) {
      this.reaplicarServicosOffline();
      return;
    }
    if (!(await this.garantirApiDisponivel('serviços'))) {
      return;
    }
    try {
      const servicos = await firstValueFrom(this.http.get<Servico[]>(`${this.apiUrl}/servicos`));
      this.atualizarServicos(servicos);
    } catch (error) {
      this.registrarFalhaApi('serviços');
      this.ativarModoOffline();
    }
  }

  async carregarOrdensServico() {
    if (this.modoOffline()) {
      this.reaplicarOrdensOffline();
      return;
    }
    if (!(await this.garantirApiDisponivel('ordens de serviço'))) {
      return;
    }
    try {
      const ordens = await firstValueFrom(this.http.get<OrdemServico[]>(`${this.apiUrl}/ordens-servico`));
      this.atualizarOrdens(ordens);
    } catch (error) {
      this.registrarFalhaApi('ordens de serviço');
      this.ativarModoOffline();
    }
  }

  async criarOrdemServico(dados: Omit<OrdemServico, 'id'>) {
    if (this.modoOffline()) {
      return this.criarOrdemOffline(dados);
    }

    if (!(await this.garantirApiDisponivel('ordens de serviço'))) {
      return this.criarOrdemOffline(dados);
    }

    try {
      const nova = await firstValueFrom(this.http.post<OrdemServico>(`${this.apiUrl}/ordens-servico`, dados));
      this.ordensServico.update(lista => [nova, ...lista.filter(ordem => ordem.id !== nova.id)]);
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      return nova;
    } catch (error) {
      this.registrarFalhaApi('ordens de serviço');
      this.ativarModoOffline();
      return this.criarOrdemOffline(dados);
    }
  }

  async atualizarOrdemServico(id: number, dados: Omit<OrdemServico, 'id'>) {
    if (this.modoOffline()) {
      return this.atualizarOrdemOffline(id, dados);
    }

    if (!(await this.garantirApiDisponivel('ordens de serviço'))) {
      return this.atualizarOrdemOffline(id, dados);
    }

    try {
      const atualizada = await firstValueFrom(this.http.put<OrdemServico>(`${this.apiUrl}/ordens-servico/${id}`, dados));
      this.ordensServico.update(lista => lista.map(ordem => (ordem.id === id ? atualizada : ordem)));
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      return atualizada;
    } catch (error) {
      this.registrarFalhaApi('ordens de serviço');
      this.ativarModoOffline();
      return this.atualizarOrdemOffline(id, dados);
    }
  }

  async removerOrdemServico(id: number) {
    if (this.modoOffline()) {
      this.removerOrdemOffline(id);
      return;
    }

    if (!(await this.garantirApiDisponivel('ordens de serviço'))) {
      this.removerOrdemOffline(id);
      return;
    }

    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/ordens-servico/${id}`));
      this.ordensServico.update(lista => lista.filter(ordem => ordem.id !== id));
      this.offlineState.ordensServico = deepClone(this.ordensServico());
    } catch (error) {
      this.registrarFalhaApi('ordens de serviço');
      this.ativarModoOffline();
      this.removerOrdemOffline(id);
    }
  }

  getOrdemServicoById(id: number): OrdemServico | undefined {
    return this.ordensServico().find(os => os.id === id);
  }

  private async garantirApiDisponivel(contexto: string) {
    if (this.modoOffline() || !this.apiDisponivel) {
      return false;
    }

    if (!this.verificandoApi) {
      this.verificandoApi = this.pingApi().then(disponivel => {
        this.apiDisponivel = disponivel;
        if (!disponivel) {
          this.registrarFalhaApi(contexto);
          this.ativarModoOffline();
        }
        return disponivel;
      }).finally(() => {
        this.verificandoApi = undefined;
      });
    }

    return this.verificandoApi;
  }

  private async pingApi(): Promise<boolean> {
    try {
      const resposta = await fetch(`${this.apiUrl}/status`, { method: 'GET', cache: 'no-store' });
      return resposta.ok;
    } catch {
      return false;
    }
  }

  private registrarFalhaApi(contexto: string) {
    if (this.notificouFalhaApi) {
      return;
    }
    this.notificouFalhaApi = true;
    console.warn(`Não foi possível conectar à API (${contexto}). Os dados locais serão utilizados.`);
  }

  private ativarModoOffline() {
    if (this.modoOffline()) {
      return;
    }
    this.modoOffline.set(true);
    if (!this.notificouFalhaApi) {
      console.warn('API indisponível. Entrando em modo offline com dados locais.');
    }
    this.reaplicarClientesOffline();
    this.reaplicarVeiculosOffline();
    this.reaplicarPecasOffline();
    this.reaplicarServicosOffline();
    this.reaplicarOrdensOffline();
  }

  private gerarProximoId(lista: { id: number }[]) {
    return lista.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  }

  private reaplicarClientesOffline() {
    this.clientes.set(sortByIdDesc(deepClone(this.offlineState.clientes)));
  }

  private reaplicarVeiculosOffline() {
    this.veiculos.set(sortByIdDesc(deepClone(this.offlineState.veiculos)));
  }

  private reaplicarPecasOffline() {
    this.pecas.set(sortByIdDesc(deepClone(this.offlineState.pecas)));
  }

  private reaplicarServicosOffline() {
    this.servicos.set(sortByIdDesc(deepClone(this.offlineState.servicos)));
  }

  private reaplicarOrdensOffline() {
    this.ordensServico.set(sortByIdDesc(deepClone(this.offlineState.ordensServico)));
  }

  private atualizarClientes(clientes: Cliente[]) {
    const ordenados = sortByIdDesc(clientes);
    const copiados = deepClone(ordenados);
    this.clientes.set(copiados);
    this.offlineState.clientes = deepClone(copiados);
  }

  private atualizarVeiculos(veiculos: Veiculo[]) {
    const ordenados = sortByIdDesc(veiculos);
    const copiados = deepClone(ordenados);
    this.veiculos.set(copiados);
    this.offlineState.veiculos = deepClone(copiados);
  }

  private atualizarPecas(pecas: Peca[]) {
    const ordenadas = sortByIdDesc(pecas);
    const copiadas = deepClone(ordenadas);
    this.pecas.set(copiadas);
    this.offlineState.pecas = deepClone(copiadas);
  }

  private atualizarServicos(servicos: Servico[]) {
    const ordenados = sortByIdDesc(servicos);
    const copiados = deepClone(ordenados);
    this.servicos.set(copiados);
    this.offlineState.servicos = deepClone(copiados);
  }

  private atualizarOrdens(ordens: OrdemServico[]) {
    const ordenadas = sortByIdDesc(ordens);
    const copiadas = deepClone(ordenadas);
    this.ordensServico.set(copiadas);
    this.offlineState.ordensServico = deepClone(copiadas);
  }

  private removerClienteOffline(id: number) {
    const clientes = this.offlineState.clientes.filter(cliente => cliente.id !== id);
    if (clientes.length === this.offlineState.clientes.length) {
      return;
    }
    this.offlineState.clientes = clientes;
    this.offlineState.veiculos = this.offlineState.veiculos.filter(veiculo => veiculo.clienteId !== id);
    this.offlineState.ordensServico = this.offlineState.ordensServico.filter(ordem => ordem.clienteId !== id);
    this.reaplicarClientesOffline();
    this.reaplicarVeiculosOffline();
    this.reaplicarOrdensOffline();
  }

  private removerVeiculoOffline(id: number) {
    const veiculos = this.offlineState.veiculos.filter(veiculo => veiculo.id !== id);
    if (veiculos.length === this.offlineState.veiculos.length) {
      return;
    }
    this.offlineState.veiculos = veiculos;
    this.offlineState.ordensServico = this.offlineState.ordensServico.filter(ordem => ordem.veiculoId !== id);
    this.reaplicarVeiculosOffline();
    this.reaplicarOrdensOffline();
  }

  private removerPecaOffline(id: number) {
    const pecas = this.offlineState.pecas.filter(peca => peca.id !== id);
    if (pecas.length === this.offlineState.pecas.length) {
      return;
    }
    this.offlineState.pecas = pecas;
    this.offlineState.ordensServico = this.offlineState.ordensServico.map(ordem => ({
      ...ordem,
      pecas: ordem.pecas.filter(item => item.id !== id)
    }));
    this.reaplicarPecasOffline();
    this.reaplicarOrdensOffline();
  }

  private removerOrdemOffline(id: number) {
    const ordens = this.offlineState.ordensServico.filter(ordem => ordem.id !== id);
    if (ordens.length === this.offlineState.ordensServico.length) {
      return;
    }
    this.offlineState.ordensServico = ordens;
    this.reaplicarOrdensOffline();
  }

  private criarClienteOffline(dados: Omit<Cliente, 'id'>) {
    const novo: Cliente = { id: this.gerarProximoId(this.offlineState.clientes), ...dados };
    const atualizados = [novo, ...this.offlineState.clientes];
    this.atualizarClientes(atualizados);
    this.atualizarVeiculos(
      this.offlineState.veiculos.map(veiculo =>
        veiculo.clienteId === novo.id ? { ...veiculo, clienteNome: novo.nome } : veiculo
      )
    );
    return novo;
  }

  private atualizarClienteOffline(id: number, dados: Omit<Cliente, 'id'>) {
    let atualizado: Cliente | undefined;
    const atualizados = this.offlineState.clientes.map(cliente => {
      if (cliente.id === id) {
        atualizado = { ...cliente, ...dados };
        return atualizado;
      }
      return cliente;
    });
    if (!atualizado) {
      return undefined;
    }
    this.atualizarClientes(atualizados);
    this.atualizarVeiculos(
      this.offlineState.veiculos.map(veiculo =>
        veiculo.clienteId === id ? { ...veiculo, clienteNome: atualizado!.nome } : veiculo
      )
    );
    return atualizado;
  }

  private criarVeiculoOffline(dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const cliente = this.clientes().find(item => item.id === dados.clienteId);
    const novo: Veiculo = {
      id: this.gerarProximoId(this.offlineState.veiculos),
      ...dados,
      clienteNome: cliente ? cliente.nome : 'Cliente não encontrado'
    };
    const atualizados = [novo, ...this.offlineState.veiculos];
    this.atualizarVeiculos(atualizados);
    return novo;
  }

  private atualizarVeiculoOffline(id: number, dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const cliente = this.clientes().find(item => item.id === dados.clienteId);
    let atualizado: Veiculo | undefined;
    const atualizados = this.offlineState.veiculos.map(veiculo => {
      if (veiculo.id === id) {
        atualizado = {
          ...veiculo,
          ...dados,
          clienteNome: cliente ? cliente.nome : 'Cliente não encontrado'
        };
        return atualizado;
      }
      return veiculo;
    });
    if (!atualizado) {
      return undefined;
    }
    this.atualizarVeiculos(atualizados);
    return atualizado;
  }

  private criarPecaOffline(dados: Omit<Peca, 'id'>) {
    const nova: Peca = { id: this.gerarProximoId(this.offlineState.pecas), ...dados };
    const atualizadas = [nova, ...this.offlineState.pecas];
    this.atualizarPecas(atualizadas);
    return nova;
  }

  private atualizarPecaOffline(id: number, dados: Omit<Peca, 'id'>) {
    let atualizada: Peca | undefined;
    const atualizadas = this.offlineState.pecas.map(peca => {
      if (peca.id === id) {
        atualizada = { ...peca, ...dados };
        return atualizada;
      }
      return peca;
    });
    if (!atualizada) {
      return undefined;
    }
    this.atualizarPecas(atualizadas);
    return atualizada;
  }

  private criarOrdemOffline(dados: Omit<OrdemServico, 'id'>) {
    const nova: OrdemServico = {
      id: this.gerarProximoId(this.offlineState.ordensServico),
      ...deepClone(dados)
    };
    const atualizadas = [nova, ...this.offlineState.ordensServico];
    this.atualizarOrdens(atualizadas);
    return nova;
  }

  private atualizarOrdemOffline(id: number, dados: Omit<OrdemServico, 'id'>) {
    let atualizada: OrdemServico | undefined;
    const atualizadas = this.offlineState.ordensServico.map(ordem => {
      if (ordem.id === id) {
        atualizada = { ...ordem, ...deepClone(dados) };
        return atualizada;
      }
      return ordem;
    });
    if (!atualizada) {
      return undefined;
    }
    this.atualizarOrdens(atualizadas);
    return atualizada;
  }
}
