const http = require('http');
const { URL } = require('url');
const {
  getClientes,
  addCliente,
  updateCliente,
  getVeiculos,
  addVeiculo,
  updateVeiculo,
  getPecas,
  addPeca,
  updatePeca,
  getServicos,
  getOrdensServico,
  addOrdemServico,
  updateOrdemServico
} = require('./db');

const PORT = process.env.PORT || 3000;
const STATUS_VALIDOS = new Set(['Em Andamento', 'Aguardando Aprovação', 'Finalizada', 'Cancelada']);

function numeroInteiroPositivo(valor) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    return null;
  }
  return numero;
}

function validarCliente(clienteId) {
  const id = numeroInteiroPositivo(clienteId);
  if (id == null) {
    return { erro: 'Cliente informado é inválido.' };
  }
  const cliente = getClientes().find(item => item.id === id);
  if (!cliente) {
    return { erro: 'Cliente informado não existe.' };
  }
  return { id, cliente };
}

function validarVeiculo(veiculoId) {
  const id = numeroInteiroPositivo(veiculoId);
  if (id == null) {
    return { erro: 'Veículo informado é inválido.' };
  }
  const veiculo = getVeiculos().find(item => item.id === id);
  if (!veiculo) {
    return { erro: 'Veículo informado não existe.' };
  }
  return { id, veiculo };
}

function sanitizarServicos(servicos) {
  if (servicos == null) {
    return { itens: [] };
  }
  if (!Array.isArray(servicos)) {
    return { erro: 'Formato de serviços inválido.' };
  }

  const existentes = new Map(getServicos().map(item => [item.id, item]));
  const acumulado = new Map();

  for (const servico of servicos) {
    const id = numeroInteiroPositivo(servico?.id);
    if (id == null) {
      return { erro: 'Serviço informado é inválido.' };
    }
    if (!existentes.has(id)) {
      return { erro: 'Serviço informado não existe.' };
    }
    const qtde = numeroInteiroPositivo(servico?.qtde);
    if (qtde == null) {
      return { erro: 'Quantidade inválida para o serviço informado.' };
    }
    acumulado.set(id, (acumulado.get(id) || 0) + qtde);
  }

  return {
    itens: [...acumulado.entries()].map(([id, qtde]) => ({ id, qtde }))
  };
}

function sanitizarPecas(pecas) {
  if (pecas == null) {
    return { itens: [] };
  }
  if (!Array.isArray(pecas)) {
    return { erro: 'Formato de peças inválido.' };
  }

  const existentes = new Map(getPecas().map(item => [item.id, item]));
  const acumulado = new Map();

  for (const peca of pecas) {
    const id = numeroInteiroPositivo(peca?.id);
    if (id == null) {
      return { erro: 'Peça informada é inválida.' };
    }
    if (!existentes.has(id)) {
      return { erro: 'Peça informada não existe.' };
    }
    const qtde = numeroInteiroPositivo(peca?.qtde);
    if (qtde == null) {
      return { erro: 'Quantidade inválida para a peça informada.' };
    }
    acumulado.set(id, (acumulado.get(id) || 0) + qtde);
  }

  return {
    itens: [...acumulado.entries()].map(([id, qtde]) => ({ id, qtde }))
  };
}

function dataValida(valor) {
  if (typeof valor !== 'string' || !valor.trim()) {
    return false;
  }
  const data = new Date(valor);
  return !Number.isNaN(data.getTime());
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req, res, callback) {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    if (chunks.length === 0) {
      callback({});
      return;
    }

    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      callback(body);
    } catch (error) {
      sendJson(res, 400, { message: 'JSON inválido no corpo da requisição.' });
    }
  });
}

function mapVeiculo(veiculo) {
  const cliente = getClientes().find(clienteAtual => clienteAtual.id === veiculo.clienteId);
  return {
    ...veiculo,
    clienteNome: cliente ? cliente.nome : 'Cliente não encontrado'
  };
}

function mapOrdem(ordem) {
  return {
    ...ordem,
    observacoes: ordem.observacoes || undefined
  };
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { message: 'Requisição inválida.' });
    return;
  }

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/clientes') {
      const clientes = [...getClientes()].sort((a, b) => b.id - a.id).map(cliente => ({
        ...cliente,
        email: cliente.email || undefined,
        telefone: cliente.telefone || undefined
      }));
      sendJson(res, 200, clientes);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/clientes') {
      parseBody(req, res, body => {
        const { nome, email, telefone } = body || {};
        if (!nome || !nome.trim()) {
          sendJson(res, 400, { message: 'Nome é obrigatório.' });
          return;
        }

        const novo = addCliente({
          nome: nome.trim(),
          email: email?.trim() || undefined,
          telefone: telefone?.trim() || undefined
        });
        sendJson(res, 201, novo);
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/clientes\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { nome, email, telefone } = body || {};
        if (!nome || !nome.trim()) {
          sendJson(res, 400, { message: 'Nome é obrigatório.' });
          return;
        }
        const atualizado = updateCliente(id, {
          nome: nome.trim(),
          email: email?.trim() || undefined,
          telefone: telefone?.trim() || undefined
        });
        if (!atualizado) {
          sendJson(res, 404, { message: 'Cliente não encontrado.' });
          return;
        }
        sendJson(res, 200, atualizado);
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/veiculos') {
      const veiculos = [...getVeiculos()].sort((a, b) => b.id - a.id).map(mapVeiculo);
      sendJson(res, 200, veiculos);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/veiculos') {
      parseBody(req, res, body => {
        const { placa, marca, modelo, ano, clienteId } = body || {};

        const placaNormalizada = typeof placa === 'string' ? placa.trim().toUpperCase() : '';
        const marcaNormalizada = typeof marca === 'string' ? marca.trim() : '';
        const modeloNormalizado = typeof modelo === 'string' ? modelo.trim() : '';
        const anoNormalizado = typeof ano === 'string' ? ano.trim() : '';
        const clienteValidado = validarCliente(clienteId);

        if (!placaNormalizada || !marcaNormalizada || !modeloNormalizado || !anoNormalizado) {
          sendJson(res, 400, { message: 'Dados obrigatórios ausentes ou inválidos.' });
          return;
        }
        if (clienteValidado.erro) {
          sendJson(res, 400, { message: clienteValidado.erro });
          return;
        }

        const jaExiste = getVeiculos().some(
          v => v.placa.toUpperCase() === placaNormalizada
        );
        if (jaExiste) {
          sendJson(res, 409, { message: 'Já existe um veículo com esta placa.' });
          return;
        }

        const novo = addVeiculo({
          placa: placaNormalizada,
          marca: marcaNormalizada,
          modelo: modeloNormalizado,
          ano: anoNormalizado,
          clienteId: clienteValidado.id
        });
        sendJson(res, 201, mapVeiculo(novo));
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { placa, marca, modelo, ano, clienteId } = body || {};

        const placaNormalizada = typeof placa === 'string' ? placa.trim().toUpperCase() : '';
        const marcaNormalizada = typeof marca === 'string' ? marca.trim() : '';
        const modeloNormalizado = typeof modelo === 'string' ? modelo.trim() : '';
        const anoNormalizado = typeof ano === 'string' ? ano.trim() : '';
        const clienteValidado = validarCliente(clienteId);

        if (!placaNormalizada || !marcaNormalizada || !modeloNormalizado || !anoNormalizado) {
          sendJson(res, 400, { message: 'Dados obrigatórios ausentes ou inválidos.' });
          return;
        }
        if (clienteValidado.erro) {
          sendJson(res, 400, { message: clienteValidado.erro });
          return;
        }

        const outroVeiculo = getVeiculos().find(
          v => v.placa.toUpperCase() === placaNormalizada && v.id !== id
        );
        if (outroVeiculo) {
          sendJson(res, 409, { message: 'Já existe um veículo com esta placa.' });
          return;
        }

        const atualizado = updateVeiculo(id, {
          placa: placaNormalizada,
          marca: marcaNormalizada,
          modelo: modeloNormalizado,
          ano: anoNormalizado,
          clienteId: clienteValidado.id
        });
        if (!atualizado) {
          sendJson(res, 404, { message: 'Veículo não encontrado.' });
          return;
        }
        sendJson(res, 200, mapVeiculo(atualizado));
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/pecas') {
      const pecas = [...getPecas()].sort((a, b) => b.id - a.id);
      sendJson(res, 200, pecas);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/pecas') {
      parseBody(req, res, body => {
        const { nome, codigo, estoque, preco } = body || {};
        if (!nome || !codigo) {
          sendJson(res, 400, { message: 'Nome e código são obrigatórios.' });
          return;
        }
        const novo = addPeca({
          nome: nome.trim(),
          codigo: codigo.trim(),
          estoque: Number.isFinite(Number(estoque)) ? Number(estoque) : 0,
          preco: Number.isFinite(Number(preco)) ? Number(preco) : 0
        });
        sendJson(res, 201, novo);
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/pecas\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { nome, codigo, estoque, preco } = body || {};
        if (!nome || !codigo) {
          sendJson(res, 400, { message: 'Nome e código são obrigatórios.' });
          return;
        }
        const atualizada = updatePeca(id, {
          nome: nome.trim(),
          codigo: codigo.trim(),
          estoque: Number.isFinite(Number(estoque)) ? Number(estoque) : 0,
          preco: Number.isFinite(Number(preco)) ? Number(preco) : 0
        });
        if (!atualizada) {
          sendJson(res, 404, { message: 'Peça não encontrada.' });
          return;
        }
        sendJson(res, 200, atualizada);
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/servicos') {
      const servicos = [...getServicos()].sort((a, b) => b.id - a.id);
      sendJson(res, 200, servicos);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/ordens-servico') {
      const ordens = [...getOrdensServico()].sort((a, b) => b.id - a.id).map(mapOrdem);
      sendJson(res, 200, ordens);
      return;
    }

    if (req.method === 'GET' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const ordem = getOrdensServico().find(item => item.id === id);
      if (!ordem) {
        sendJson(res, 404, { message: 'Ordem de serviço não encontrada.' });
        return;
      }
      sendJson(res, 200, mapOrdem(ordem));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/ordens-servico') {
      parseBody(req, res, body => {
        const { clienteId, veiculoId, dataEntrada, status, servicos, pecas, observacoes } = body || {};

        const clienteValidado = validarCliente(clienteId);
        if (clienteValidado.erro) {
          sendJson(res, 400, { message: clienteValidado.erro });
          return;
        }

        const veiculoValidado = validarVeiculo(veiculoId);
        if (veiculoValidado.erro) {
          sendJson(res, 400, { message: veiculoValidado.erro });
          return;
        }

        if (veiculoValidado.veiculo.clienteId !== clienteValidado.id) {
          sendJson(res, 400, { message: 'Veículo informado não pertence ao cliente selecionado.' });
          return;
        }

        if (!dataValida(dataEntrada)) {
          sendJson(res, 400, { message: 'Data de entrada inválida.' });
          return;
        }

        if (typeof status !== 'string' || !STATUS_VALIDOS.has(status)) {
          sendJson(res, 400, { message: 'Status inválido.' });
          return;
        }

        const servicosSanitizados = sanitizarServicos(servicos);
        if (servicosSanitizados.erro) {
          sendJson(res, 400, { message: servicosSanitizados.erro });
          return;
        }

        const pecasSanitizadas = sanitizarPecas(pecas);
        if (pecasSanitizadas.erro) {
          sendJson(res, 400, { message: pecasSanitizadas.erro });
          return;
        }

        const nova = addOrdemServico({
          clienteId: clienteValidado.id,
          veiculoId: veiculoValidado.id,
          dataEntrada: dataEntrada.trim(),
          status,
          servicos: servicosSanitizados.itens,
          pecas: pecasSanitizadas.itens,
          observacoes: observacoes?.trim() || undefined
        });
        sendJson(res, 201, mapOrdem(nova));
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { clienteId, veiculoId, dataEntrada, status, servicos, pecas, observacoes } = body || {};

        const clienteValidado = validarCliente(clienteId);
        if (clienteValidado.erro) {
          sendJson(res, 400, { message: clienteValidado.erro });
          return;
        }

        const veiculoValidado = validarVeiculo(veiculoId);
        if (veiculoValidado.erro) {
          sendJson(res, 400, { message: veiculoValidado.erro });
          return;
        }

        if (veiculoValidado.veiculo.clienteId !== clienteValidado.id) {
          sendJson(res, 400, { message: 'Veículo informado não pertence ao cliente selecionado.' });
          return;
        }

        if (!dataValida(dataEntrada)) {
          sendJson(res, 400, { message: 'Data de entrada inválida.' });
          return;
        }

        if (typeof status !== 'string' || !STATUS_VALIDOS.has(status)) {
          sendJson(res, 400, { message: 'Status inválido.' });
          return;
        }

        const servicosSanitizados = sanitizarServicos(servicos);
        if (servicosSanitizados.erro) {
          sendJson(res, 400, { message: servicosSanitizados.erro });
          return;
        }

        const pecasSanitizadas = sanitizarPecas(pecas);
        if (pecasSanitizadas.erro) {
          sendJson(res, 400, { message: pecasSanitizadas.erro });
          return;
        }

        const atualizada = updateOrdemServico(id, {
          clienteId: clienteValidado.id,
          veiculoId: veiculoValidado.id,
          dataEntrada: dataEntrada.trim(),
          status,
          servicos: servicosSanitizados.itens,
          pecas: pecasSanitizadas.itens,
          observacoes: observacoes?.trim() || undefined
        });
        if (!atualizada) {
          sendJson(res, 404, { message: 'Ordem de serviço não encontrada.' });
          return;
        }
        sendJson(res, 200, mapOrdem(atualizada));
      });
      return;
    }

    sendJson(res, 404, { message: 'Rota não encontrada.' });
  } catch (error) {
    console.error('Erro inesperado:', error);
    sendJson(res, 500, { message: 'Erro interno do servidor.' });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor da API iniciado em http://localhost:${PORT}`);
});
