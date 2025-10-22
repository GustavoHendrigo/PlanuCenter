const fs = require('fs/promises');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

const defaultData = {
  clientes: [
    { id: 1, nome: 'Carlos Alberto', email: 'carlos.alberto@email.com', telefone: '(11) 91234-5678' },
    { id: 2, nome: 'Joana Pereira', email: 'joana.pereira@email.com', telefone: '(11) 98765-4321' },
    { id: 3, nome: 'Pedro Henrique', email: 'pedro.henrique@email.com', telefone: '(21) 99876-5432' },
    { id: 4, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '(31) 93456-7890' }
  ],
  veiculos: [
    { id: 1, placa: 'ROZ-1295', marca: 'Toyota', modelo: 'Corolla', ano: '2022', clienteId: 1 },
    { id: 2, placa: 'PEA-0M40', marca: 'Honda', modelo: 'Civic', ano: '2021', clienteId: 3 },
    { id: 3, placa: 'LBT-3954', marca: 'Ford', modelo: 'Ranger', ano: '2023', clienteId: 4 },
    { id: 4, placa: 'XYZ-7890', marca: 'Chevrolet', modelo: 'Onix', ano: '2020', clienteId: 2 }
  ],
  pecas: [
    { id: 101, nome: 'Filtro de Óleo', codigo: 'FO-001', estoque: 15, preco: 35.0 },
    { id: 102, nome: 'Pastilha de Freio', codigo: 'PF-002', estoque: 8, preco: 120.5 },
    { id: 103, nome: 'Vela de Ignição', codigo: 'VI-003', estoque: 32, preco: 25.0 },
    { id: 104, nome: 'Óleo Motor 5W30', codigo: 'OM-004', estoque: 20, preco: 55.0 }
  ],
  servicos: [
    { id: 201, descricao: 'Troca de Óleo e Filtro', preco: 150.0 },
    { id: 202, descricao: 'Alinhamento e Balanceamento', preco: 180.0 },
    { id: 203, descricao: 'Revisão Sistema de Freios', preco: 250.0 }
  ],
  ordensServico: [
    {
      id: 974,
      clienteId: 1,
      veiculoId: 1,
      dataEntrada: '2025-09-07',
      status: 'Em Andamento',
      servicos: [{ id: 201, qtde: 1 }],
      pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }],
      observacoes: undefined
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
      pecas: [{ id: 102, qtde: 2 }],
      observacoes: undefined
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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class JsonDatabase {
  constructor(filePath, seed) {
    this.filePath = filePath;
    this.seed = seed;
    this.ready = this.#init();
    this.mutex = Promise.resolve();
  }

  async #init() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const trimmed = raw.trim();
      if (!trimmed) {
        await this.#write(this.seed);
        return;
      }
      this.data = JSON.parse(trimmed);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Erro ao ler banco de dados, recriando arquivo.', error);
      }
      await this.#write(this.seed);
    }
  }

  async #write(data) {
    this.data = clone(data);
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  async #ensureReady() {
    await this.ready;
    if (!this.data) {
      this.data = clone(this.seed);
    }
  }

  #snapshot() {
    return clone(this.data);
  }

  async list(collection) {
    await this.#ensureReady();
    return clone(this.data[collection]);
  }

  async findById(collection, id) {
    await this.#ensureReady();
    return clone(this.data[collection].find(item => item.id === id));
  }

  async transact(mutator) {
    const run = async () => {
      await this.#ensureReady();
      const draft = this.#snapshot();
      let shouldPersist = false;
      const markDirty = () => {
        shouldPersist = true;
      };
      const result = await mutator(draft, markDirty);
      if (shouldPersist) {
        await this.#write(draft);
      }
      return result;
    };

    const execution = this.mutex.then(run, run);
    this.mutex = execution.catch(() => {});
    return execution;
  }
}

const db = new JsonDatabase(DB_FILE, defaultData);

async function getClientes() {
  return db.list('clientes');
}

async function getVeiculos() {
  return db.list('veiculos');
}

async function getPecas() {
  return db.list('pecas');
}

async function getServicos() {
  return db.list('servicos');
}

async function getOrdensServico() {
  return db.list('ordensServico');
}

async function nextId(collectionName) {
  const collection = await db.list(collectionName);
  const maxId = collection.reduce((max, item) => (item.id > max ? item.id : max), 0);
  return maxId + 1;
}

async function addCliente(cliente) {
  return db.transact(async (draft, markDirty) => {
    const novoId = draft.clientes.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
    const novo = { id: novoId, ...cliente };
    draft.clientes = [novo, ...draft.clientes];
    markDirty();
    return novo;
  });
}

async function updateCliente(id, updates) {
  return db.transact(async (draft, markDirty) => {
    const index = draft.clientes.findIndex(cliente => cliente.id === id);
    if (index === -1) {
      return undefined;
    }
    const atualizado = { ...draft.clientes[index], ...updates, id };
    draft.clientes[index] = atualizado;
    markDirty();
    return atualizado;
  });
}

async function addVeiculo(veiculo) {
  return db.transact(async (draft, markDirty) => {
    const novoId = draft.veiculos.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
    const novo = { id: novoId, ...veiculo };
    draft.veiculos = [novo, ...draft.veiculos];
    markDirty();
    return novo;
  });
}

async function updateVeiculo(id, updates) {
  return db.transact(async (draft, markDirty) => {
    const index = draft.veiculos.findIndex(veiculo => veiculo.id === id);
    if (index === -1) {
      return undefined;
    }
    const atualizado = { ...draft.veiculos[index], ...updates, id };
    draft.veiculos[index] = atualizado;
    markDirty();
    return atualizado;
  });
}

async function addPeca(peca) {
  return db.transact(async (draft, markDirty) => {
    const novoId = draft.pecas.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
    const nova = { id: novoId, ...peca };
    draft.pecas = [nova, ...draft.pecas];
    markDirty();
    return nova;
  });
}

async function updatePeca(id, updates) {
  return db.transact(async (draft, markDirty) => {
    const index = draft.pecas.findIndex(peca => peca.id === id);
    if (index === -1) {
      return undefined;
    }
    const atualizada = { ...draft.pecas[index], ...updates, id };
    draft.pecas[index] = atualizada;
    markDirty();
    return atualizada;
  });
}

async function addOrdemServico(ordem) {
  return db.transact(async (draft, markDirty) => {
    const novoId =
      draft.ordensServico.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
    const nova = {
      id: novoId,
      servicos: [],
      pecas: [],
      ...ordem
    };
    draft.ordensServico = [nova, ...draft.ordensServico];
    markDirty();
    return nova;
  });
}

async function updateOrdemServico(id, updates) {
  return db.transact(async (draft, markDirty) => {
    const index = draft.ordensServico.findIndex(ordem => ordem.id === id);
    if (index === -1) {
      return undefined;
    }
    const atualizada = { ...draft.ordensServico[index], ...updates, id };
    draft.ordensServico[index] = atualizada;
    markDirty();
    return atualizada;
  });
}

module.exports = {
  getClientes,
  getVeiculos,
  getPecas,
  getServicos,
  getOrdensServico,
  addCliente,
  updateCliente,
  addVeiculo,
  updateVeiculo,
  addPeca,
  updatePeca,
  addOrdemServico,
  updateOrdemServico,
  nextId
};
