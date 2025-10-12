import { Injectable, computed, signal } from '@angular/core';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';

type StoreName = 'clientes' | 'veiculos' | 'pecas' | 'servicos' | 'ordensServico';

const CLIENTES_INICIAIS: Cliente[] = [
  { id: 1, nome: 'Carlos Alberto', email: 'carlos.alberto@email.com', telefone: '(11) 91234-5678' },
  { id: 2, nome: 'Joana Pereira', email: 'joana.pereira@email.com', telefone: '(11) 98765-4321' },
  { id: 3, nome: 'Pedro Henrique', email: 'pedro.henrique@email.com', telefone: '(21) 99876-5432' },
  { id: 4, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '(31) 93456-7890' },
];

const VEICULOS_INICIAIS: Veiculo[] = [
  { id: 1, placa: 'ROZ-1295', marca: 'Toyota', modelo: 'Corolla', ano: '2022', clienteId: 1, clienteNome: 'Carlos Alberto' },
  { id: 2, placa: 'PEA-0M40', marca: 'Honda', modelo: 'Civic', ano: '2021', clienteId: 3, clienteNome: 'Pedro Henrique' },
  { id: 3, placa: 'LBT-3954', marca: 'Ford', modelo: 'Ranger', ano: '2023', clienteId: 4, clienteNome: 'João da Silva' },
  { id: 4, placa: 'XYZ-7890', marca: 'Chevrolet', modelo: 'Onix', ano: '2020', clienteId: 2, clienteNome: 'Joana Pereira' },
];

const PECAS_INICIAIS: Peca[] = [
  { id: 101, nome: 'Filtro de Óleo', codigo: 'FO-001', estoque: 15, preco: 35.00 },
  { id: 102, nome: 'Pastilha de Freio', codigo: 'PF-002', estoque: 8, preco: 120.50 },
  { id: 103, nome: 'Vela de Ignição', codigo: 'VI-003', estoque: 32, preco: 25.00 },
  { id: 104, nome: 'Óleo Motor 5W30', codigo: 'OM-004', estoque: 20, preco: 55.00 },
];

const SERVICOS_INICIAIS: Servico[] = [
  { id: 201, descricao: 'Troca de Óleo e Filtro', preco: 150.00 },
  { id: 202, descricao: 'Alinhamento e Balanceamento', preco: 180.00 },
  { id: 203, descricao: 'Revisão Sistema de Freios', preco: 250.00 },
];

const ORDENS_INICIAIS: OrdemServico[] = [
  {
    id: 974,
    veiculoId: 1,
    clienteId: 1,
    dataEntrada: '2025-09-07',
    status: 'Em Andamento',
    servicos: [{ id: 201, qtde: 1 }],
    pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }],
  },
  {
    id: 973,
    veiculoId: 1,
    clienteId: 1,
    dataEntrada: '2025-09-06',
    status: 'Finalizada',
    servicos: [{ id: 202, qtde: 1 }],
    pecas: [],
  },
  {
    id: 971,
    veiculoId: 2,
    clienteId: 3,
    dataEntrada: '2025-09-05',
    status: 'Aguardando Aprovação',
    servicos: [{ id: 203, qtde: 1 }],
    pecas: [{ id: 102, qtde: 2 }],
  },
  {
    id: 968,
    veiculoId: 3,
    clienteId: 4,
    dataEntrada: '2025-09-02',
    status: 'Finalizada',
    servicos: [{ id: 201, qtde: 1 }],
    pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }],
  },
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly hasIndexedDb = typeof indexedDB !== 'undefined';

  private database: IDBDatabase | null = null;
  private readonly ready: Promise<void>;

  private readonly _clientes = signal<Cliente[]>([]);
  readonly clientes = computed(() => this._clientes());

  private readonly _veiculos = signal<Veiculo[]>([]);
  readonly veiculos = computed(() => this._veiculos());

  private readonly _pecas = signal<Peca[]>([]);
  readonly pecas = computed(() => this._pecas());

  private readonly _servicos = signal<Servico[]>([]);
  readonly servicos = computed(() => this._servicos());

  private readonly _ordensServico = signal<OrdemServico[]>([]);
  readonly ordensServico = computed(() => this._ordensServico());

  constructor() {
    this.ready = this.hasIndexedDb ? this.initializeDatabase() : this.initializeFallback();
  }

  private async initializeDatabase() {
    const db = await this.openDatabase();
    this.database = db;
    await this.seedIfEmpty(db, 'clientes', CLIENTES_INICIAIS);
    await this.seedIfEmpty(db, 'veiculos', VEICULOS_INICIAIS);
    await this.seedIfEmpty(db, 'pecas', PECAS_INICIAIS);
    await this.seedIfEmpty(db, 'servicos', SERVICOS_INICIAIS);
    await this.seedIfEmpty(db, 'ordensServico', ORDENS_INICIAIS);
    await this.loadAllFromDatabase();
  }

  private async initializeFallback() {
    // IndexedDB não está disponível (ex.: testes ou browsers antigos).
    this._clientes.set(this.sortByIdDesc(CLIENTES_INICIAIS.map(item => ({ ...item }))));
    this._veiculos.set(this.sortByIdDesc(VEICULOS_INICIAIS.map(item => ({ ...item }))));
    this._pecas.set(this.sortByIdDesc(PECAS_INICIAIS.map(item => ({ ...item }))));
    this._servicos.set(this.sortByIdDesc(SERVICOS_INICIAIS.map(item => ({ ...item }))));
    this._ordensServico.set(this.sortByIdDesc(ORDENS_INICIAIS.map(item => ({ ...item }))));
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('planu-center-db', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('clientes')) {
          db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('veiculos')) {
          db.createObjectStore('veiculos', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('pecas')) {
          db.createObjectStore('pecas', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('servicos')) {
          db.createObjectStore('servicos', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('ordensServico')) {
          db.createObjectStore('ordensServico', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Erro ao abrir o banco IndexedDB'));
    });
  }

  private async seedIfEmpty<T extends { id: number }>(db: IDBDatabase, store: StoreName, data: T[]) {
    const count = await this.countStore(db, store);
    if (count > 0) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      data.forEach(item => objectStore.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Erro ao semear dados iniciais.'));
    });
  }

  private countStore(db: IDBDatabase, store: StoreName): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Erro ao contar itens do banco.'));
    });
  }

  private async loadAllFromDatabase() {
    const [clientes, veiculos, pecas, servicos, ordens] = await Promise.all([
      this.getAllFromStore<Cliente>('clientes'),
      this.getAllFromStore<Veiculo>('veiculos'),
      this.getAllFromStore<Peca>('pecas'),
      this.getAllFromStore<Servico>('servicos'),
      this.getAllFromStore<OrdemServico>('ordensServico'),
    ]);

    this._clientes.set(this.sortByIdDesc(clientes));
    this._veiculos.set(this.sortByIdDesc(veiculos));
    this._pecas.set(this.sortByIdDesc(pecas));
    this._servicos.set(this.sortByIdDesc(servicos));
    this._ordensServico.set(this.sortByIdDesc(ordens));
  }

  private getAllFromStore<T>(store: StoreName): Promise<T[]> {
    if (!this.database) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.database!.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();
      request.onsuccess = () => resolve((request.result as T[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error('Erro ao carregar dados.'));
    });
  }

  private addToStore<T>(store: StoreName, value: Omit<T, 'id'> & Partial<T>): Promise<number> {
    if (!this.database) {
      throw new Error('Banco não inicializado');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.database!.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.add(value);
      request.onsuccess = () => resolve(Number(request.result));
      request.onerror = () => reject(request.error ?? new Error('Erro ao adicionar registro.'));
    });
  }

  private putInStore<T>(store: StoreName, value: T & { id: number }): Promise<void> {
    if (!this.database) {
      throw new Error('Banco não inicializado');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.database!.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Erro ao atualizar registro.'));
    });
  }

  private sortByIdDesc<T extends { id: number }>(data: T[]) {
    return [...data].sort((a, b) => b.id - a.id);
  }

  private async ensureReady() {
    await this.ready;
  }

  async createCliente(dados: Omit<Cliente, 'id'>) {
    await this.ensureReady();

    if (!this.hasIndexedDb) {
      const novoId = this._clientes().reduce((max, cliente) => Math.max(max, cliente.id), 0) + 1;
      const novoCliente: Cliente = { id: novoId, ...dados };
      this._clientes.update(lista => this.sortByIdDesc([novoCliente, ...lista]));
      return novoCliente;
    }

    const id = await this.addToStore<Cliente>('clientes', dados);
    const novoCliente: Cliente = { id, ...dados };
    this._clientes.update(lista => this.sortByIdDesc([novoCliente, ...lista]));
    return novoCliente;
  }

  async updateCliente(id: number, dados: Partial<Cliente>) {
    await this.ensureReady();
    const atual = this._clientes().find(cliente => cliente.id === id);
    if (!atual) {
      throw new Error('Cliente não encontrado');
    }

    const atualizado: Cliente = { ...atual, ...dados };

    if (this.hasIndexedDb) {
      await this.putInStore('clientes', atualizado);
      await this.updateLinkedVehiclesClientName(atualizado);
    }

    this._clientes.update(lista => lista.map(cliente => cliente.id === id ? atualizado : cliente));
    if (!this.hasIndexedDb) {
      this._veiculos.update(lista => lista.map(veiculo => veiculo.clienteId === id ? { ...veiculo, clienteNome: atualizado.nome } : veiculo));
    }
    return atualizado;
  }

  async createVeiculo(dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    await this.ensureReady();
    const cliente = this._clientes().find(item => item.id === dados.clienteId);
    if (!cliente) {
      throw new Error('Cliente não encontrado para vincular o veículo.');
    }

    const registro: Omit<Veiculo, 'id'> = { ...dados, clienteNome: cliente.nome };

    if (!this.hasIndexedDb) {
      const novoId = this._veiculos().reduce((max, veiculo) => Math.max(max, veiculo.id), 0) + 1;
      const novoVeiculo: Veiculo = { id: novoId, ...registro };
      this._veiculos.update(lista => this.sortByIdDesc([novoVeiculo, ...lista]));
      return novoVeiculo;
    }

    const id = await this.addToStore<Veiculo>('veiculos', registro);
    const novoVeiculo: Veiculo = { id, ...registro };
    this._veiculos.update(lista => this.sortByIdDesc([novoVeiculo, ...lista]));
    return novoVeiculo;
  }

  async updateVeiculo(id: number, dados: Partial<Omit<Veiculo, 'id'>>) {
    await this.ensureReady();
    const atual = this._veiculos().find(veiculo => veiculo.id === id);
    if (!atual) {
      throw new Error('Veículo não encontrado');
    }

    let clienteNome = atual.clienteNome;
    if (dados.clienteId && dados.clienteId !== atual.clienteId) {
      const cliente = this._clientes().find(item => item.id === dados.clienteId);
      if (!cliente) {
        throw new Error('Cliente não encontrado para vincular o veículo.');
      }
      clienteNome = cliente.nome;
    }

    const atualizado: Veiculo = { ...atual, ...dados, clienteNome };

    if (this.hasIndexedDb) {
      await this.putInStore('veiculos', atualizado);
    }

    this._veiculos.update(lista => lista.map(veiculo => veiculo.id === id ? atualizado : veiculo));
    return atualizado;
  }

  async createPeca(dados: Omit<Peca, 'id'>) {
    await this.ensureReady();

    if (!this.hasIndexedDb) {
      const novoId = this._pecas().reduce((max, peca) => Math.max(max, peca.id), 0) + 1;
      const novaPeca: Peca = { id: novoId, ...dados };
      this._pecas.update(lista => this.sortByIdDesc([novaPeca, ...lista]));
      return novaPeca;
    }

    const id = await this.addToStore<Peca>('pecas', dados);
    const novaPeca: Peca = { id, ...dados };
    this._pecas.update(lista => this.sortByIdDesc([novaPeca, ...lista]));
    return novaPeca;
  }

  async updatePeca(id: number, dados: Partial<Peca>) {
    await this.ensureReady();
    const atual = this._pecas().find(peca => peca.id === id);
    if (!atual) {
      throw new Error('Peça não encontrada');
    }

    const atualizada: Peca = { ...atual, ...dados };

    if (this.hasIndexedDb) {
      await this.putInStore('pecas', atualizada);
    }

    this._pecas.update(lista => lista.map(peca => peca.id === id ? atualizada : peca));
    return atualizada;
  }

  async createOrdemServico(dados: Omit<OrdemServico, 'id'>) {
    await this.ensureReady();
    const registro: Omit<OrdemServico, 'id'> = {
      ...dados,
      servicos: dados.servicos ?? [],
      pecas: dados.pecas ?? [],
    };

    if (!this.hasIndexedDb) {
      const novoId = this._ordensServico().reduce((max, ordem) => Math.max(max, ordem.id), 0) + 1;
      const novaOrdem: OrdemServico = { id: novoId, ...registro };
      this._ordensServico.update(lista => this.sortByIdDesc([novaOrdem, ...lista]));
      return novaOrdem;
    }

    const id = await this.addToStore<OrdemServico>('ordensServico', registro);
    const novaOrdem: OrdemServico = { id, ...registro };
    this._ordensServico.update(lista => this.sortByIdDesc([novaOrdem, ...lista]));
    return novaOrdem;
  }

  getOrdemServicoById(id: number): OrdemServico | undefined {
    return this._ordensServico().find(os => os.id === id);
  }

  private async updateLinkedVehiclesClientName(cliente: Cliente) {
    if (!this.hasIndexedDb || !this.database) {
      return;
    }

    const veiculosDoCliente = this._veiculos().filter(veiculo => veiculo.clienteId === cliente.id);
    if (!veiculosDoCliente.length) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = this.database!.transaction('veiculos', 'readwrite');
      const objectStore = transaction.objectStore('veiculos');
      veiculosDoCliente.forEach(veiculo => {
        objectStore.put({ ...veiculo, clienteNome: cliente.nome });
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Erro ao atualizar veículos vinculados.'));
    });

    this._veiculos.update(lista =>
      lista.map(veiculo =>
        veiculo.clienteId === cliente.id
          ? { ...veiculo, clienteNome: cliente.nome }
          : veiculo,
      ),
    );
  }
}
