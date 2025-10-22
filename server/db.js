const fs = require('fs');
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
  ],
  usuarios: [
    {
      id: 1,
      nome: 'Administrador da Oficina',
      email: 'admin@oficinapro.com',
      senha: 'admin123',
      perfil: 'admin'
    },
    {
      id: 2,
      nome: 'Atendimento Principal',
      email: 'atendimento@oficinapro.com',
      senha: 'atendimento123',
      perfil: 'atendimento'
    }
  ]
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return clone(defaultData);
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    if (!raw.trim()) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return clone(defaultData);
    }
    const parsed = JSON.parse(raw);
    return {
      clientes: parsed.clientes ?? clone(defaultData.clientes),
      veiculos: parsed.veiculos ?? clone(defaultData.veiculos),
      pecas: parsed.pecas ?? clone(defaultData.pecas),
      servicos: parsed.servicos ?? clone(defaultData.servicos),
      ordensServico: parsed.ordensServico ?? clone(defaultData.ordensServico),
      usuarios: parsed.usuarios ?? clone(defaultData.usuarios)
    };
  } catch (error) {
    console.error('Erro ao ler banco de dados, recriando arquivo.', error);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return clone(defaultData);
  }
}

let data = loadDatabase();

function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getClientes() {
  return data.clientes;
}

function getVeiculos() {
  return data.veiculos;
}

function getPecas() {
  return data.pecas;
}

function getServicos() {
  return data.servicos;
}

function getOrdensServico() {
  return data.ordensServico;
}

function getUsuarios() {
  return data.usuarios;
}

function nextId(collectionName) {
  const collection = data[collectionName];
  const maxId = collection.reduce((max, item) => (item.id > max ? item.id : max), 0);
  return maxId + 1;
}

function addCliente(cliente) {
  const novo = { id: nextId('clientes'), ...cliente };
  data.clientes = [novo, ...data.clientes];
  saveDatabase();
  return novo;
}

function updateCliente(id, updates) {
  let atualizado;
  data.clientes = data.clientes.map(cliente => {
    if (cliente.id === id) {
      atualizado = { ...cliente, ...updates, id };
      return atualizado;
    }
    return cliente;
  });
  if (atualizado) {
    saveDatabase();
  }
  return atualizado;
}

function addVeiculo(veiculo) {
  const novo = { id: nextId('veiculos'), ...veiculo };
  data.veiculos = [novo, ...data.veiculos];
  saveDatabase();
  return novo;
}

function updateVeiculo(id, updates) {
  let atualizado;
  data.veiculos = data.veiculos.map(veiculo => {
    if (veiculo.id === id) {
      atualizado = { ...veiculo, ...updates, id };
      return atualizado;
    }
    return veiculo;
  });
  if (atualizado) {
    saveDatabase();
  }
  return atualizado;
}

function addPeca(peca) {
  const novo = { id: nextId('pecas'), ...peca };
  data.pecas = [novo, ...data.pecas];
  saveDatabase();
  return novo;
}

function updatePeca(id, updates) {
  let atualizado;
  data.pecas = data.pecas.map(peca => {
    if (peca.id === id) {
      atualizado = { ...peca, ...updates, id };
      return atualizado;
    }
    return peca;
  });
  if (atualizado) {
    saveDatabase();
  }
  return atualizado;
}

function addOrdemServico(ordem) {
  const nova = { id: nextId('ordensServico'), servicos: [], pecas: [], ...ordem };
  data.ordensServico = [nova, ...data.ordensServico];
  saveDatabase();
  return nova;
}

function updateOrdemServico(id, updates) {
  let atualizada;
  data.ordensServico = data.ordensServico.map(ordem => {
    if (ordem.id === id) {
      atualizada = { ...ordem, ...updates, id };
      return atualizada;
    }
    return ordem;
  });
  if (atualizada) {
    saveDatabase();
  }
  return atualizada;
}

function removeCliente(id) {
  const existe = data.clientes.some(cliente => cliente.id === id);
  if (!existe) {
    return false;
  }
  data.clientes = data.clientes.filter(cliente => cliente.id !== id);
  const veiculosRemovidos = new Set(
    data.veiculos.filter(veiculo => veiculo.clienteId === id).map(veiculo => veiculo.id)
  );
  data.veiculos = data.veiculos.filter(veiculo => veiculo.clienteId !== id);
  data.ordensServico = data.ordensServico.filter(
    ordem => ordem.clienteId !== id && !veiculosRemovidos.has(ordem.veiculoId)
  );
  saveDatabase();
  return true;
}

function removeVeiculo(id) {
  const existe = data.veiculos.some(veiculo => veiculo.id === id);
  if (!existe) {
    return false;
  }
  data.veiculos = data.veiculos.filter(veiculo => veiculo.id !== id);
  data.ordensServico = data.ordensServico.filter(ordem => ordem.veiculoId !== id);
  saveDatabase();
  return true;
}

function removePeca(id) {
  const existe = data.pecas.some(peca => peca.id === id);
  if (!existe) {
    return false;
  }
  data.pecas = data.pecas.filter(peca => peca.id !== id);
  data.ordensServico = data.ordensServico.map(ordem => ({
    ...ordem,
    pecas: ordem.pecas.filter(item => item.id !== id)
  }));
  saveDatabase();
  return true;
}

function removeOrdemServico(id) {
  const existe = data.ordensServico.some(ordem => ordem.id === id);
  if (!existe) {
    return false;
  }
  data.ordensServico = data.ordensServico.filter(ordem => ordem.id !== id);
  saveDatabase();
  return true;
}

function findUsuarioPorEmail(email) {
  return data.usuarios.find(usuario => usuario.email.toLowerCase() === email.toLowerCase());
}

module.exports = {
  getClientes,
  getVeiculos,
  getPecas,
  getServicos,
  getOrdensServico,
  getUsuarios,
  addCliente,
  updateCliente,
  addVeiculo,
  updateVeiculo,
  addPeca,
  updatePeca,
  addOrdemServico,
  updateOrdemServico,
  removeCliente,
  removeVeiculo,
  removePeca,
  removeOrdemServico,
  findUsuarioPorEmail,
  nextId,
  saveDatabase,
  data
};
