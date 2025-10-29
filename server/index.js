const http = require('http');
const { URL } = require('url');
const {
  databaseReady,
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
  getOrdemServicoById,
  addOrdemServico,
  updateOrdemServico
} = require('./db');

const PORT = process.env.PORT || 3000;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        resolve(body);
      } catch (error) {
        reject(new Error('JSON inválido no corpo da requisição.'));
      }
    });
    req.on('error', reject);
  });
}

function normalizeVeiculo(veiculo) {
  return {
    ...veiculo,
    clienteNome: veiculo.clienteNome ?? 'Cliente não encontrado'
  };
}

function normalizeOrdem(ordem) {
  return {
    ...ordem,
    observacoes: ordem.observacoes ?? undefined
  };
}

async function handleRequest(req, res) {
  if (!req.url) {
    sendJson(res, 400, { message: 'Requisição inválida.' });
    return;
  }

  await databaseReady;
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
      const clientes = (await getClientes()).sort((a, b) => b.id - a.id);
      sendJson(res, 200, clientes);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/clientes') {
      const body = await parseBody(req);
      const { nome, email, telefone } = body || {};
      if (!nome || !nome.trim()) {
        sendJson(res, 400, { message: 'Nome é obrigatório.' });
        return;
      }

      const novo = await addCliente({
        nome: nome.trim(),
        email: email?.trim() || undefined,
        telefone: telefone?.trim() || undefined
      });
      sendJson(res, 201, novo);
      return;
    }

    if (req.method === 'PUT' && /^\/api\/clientes\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const body = await parseBody(req);
      const { nome, email, telefone } = body || {};
      if (!nome || !nome.trim()) {
        sendJson(res, 400, { message: 'Nome é obrigatório.' });
        return;
      }
      const atualizado = await updateCliente(id, {
        nome: nome.trim(),
        email: email?.trim() || undefined,
        telefone: telefone?.trim() || undefined
      });
      if (!atualizado) {
        sendJson(res, 404, { message: 'Cliente não encontrado.' });
        return;
      }
      sendJson(res, 200, atualizado);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/veiculos') {
      const veiculos = (await getVeiculos()).sort((a, b) => b.id - a.id).map(normalizeVeiculo);
      sendJson(res, 200, veiculos);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/veiculos') {
      const body = await parseBody(req);
      const { placa, marca, modelo, ano, clienteId } = body || {};
      if (!placa || !marca || !modelo || !ano || !clienteId) {
        sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
        return;
      }

      const placaNormalizada = placa.trim();
      const existentes = await getVeiculos();
      const jaExiste = existentes.some(v => v.placa.toLowerCase() === placaNormalizada.toLowerCase());
      if (jaExiste) {
        sendJson(res, 409, { message: 'Já existe um veículo com esta placa.' });
        return;
      }

      const novo = await addVeiculo({
        placa: placaNormalizada,
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: ano.trim(),
        clienteId: Number(clienteId)
      });
      sendJson(res, 201, normalizeVeiculo(novo));
      return;
    }

    if (req.method === 'PUT' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const body = await parseBody(req);
      const { placa, marca, modelo, ano, clienteId } = body || {};
      if (!placa || !marca || !modelo || !ano || !clienteId) {
        sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
        return;
      }

      const placaNormalizada = placa.trim();
      const existentes = await getVeiculos();
      const jaExiste = existentes.some(v => v.id !== id && v.placa.toLowerCase() === placaNormalizada.toLowerCase());
      if (jaExiste) {
        sendJson(res, 409, { message: 'Já existe um veículo com esta placa.' });
        return;
      }

      const atualizado = await updateVeiculo(id, {
        placa: placaNormalizada,
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: ano.trim(),
        clienteId: Number(clienteId)
      });
      if (!atualizado) {
        sendJson(res, 404, { message: 'Veículo não encontrado.' });
        return;
      }
      sendJson(res, 200, normalizeVeiculo(atualizado));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/pecas') {
      const pecas = (await getPecas()).sort((a, b) => b.id - a.id);
      sendJson(res, 200, pecas);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/pecas') {
      const body = await parseBody(req);
      const { nome, codigo, estoque, preco } = body || {};
      if (!nome || !codigo || estoque === undefined || preco === undefined) {
        sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
        return;
      }
      const novo = await addPeca({
        nome: nome.trim(),
        codigo: codigo.trim(),
        estoque: Number(estoque),
        preco: Number(preco)
      });
      sendJson(res, 201, novo);
      return;
    }

    if (req.method === 'PUT' && /^\/api\/pecas\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const body = await parseBody(req);
      const { nome, codigo, estoque, preco } = body || {};
      if (!nome || !codigo || estoque === undefined || preco === undefined) {
        sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
        return;
      }
      const atualizado = await updatePeca(id, {
        nome: nome.trim(),
        codigo: codigo.trim(),
        estoque: Number(estoque),
        preco: Number(preco)
      });
      if (!atualizado) {
        sendJson(res, 404, { message: 'Peça não encontrada.' });
        return;
      }
      sendJson(res, 200, atualizado);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/servicos') {
      const servicos = await getServicos();
      sendJson(res, 200, servicos);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/ordens-servico') {
      const ordens = (await getOrdensServico()).map(normalizeOrdem);
      sendJson(res, 200, ordens);
      return;
    }

    if (req.method === 'GET' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const ordem = await getOrdemServicoById(id);
      if (!ordem) {
        sendJson(res, 404, { message: 'Ordem de serviço não encontrada.' });
        return;
      }
      sendJson(res, 200, normalizeOrdem(ordem));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/ordens-servico') {
      const body = await parseBody(req);
      const { clienteId, veiculoId, dataEntrada, status, servicos, pecas, observacoes } = body || {};
      if (!clienteId || !veiculoId || !dataEntrada || !status) {
        sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
        return;
      }
      const nova = await addOrdemServico({
        clienteId: Number(clienteId),
        veiculoId: Number(veiculoId),
        dataEntrada: dataEntrada,
        status: status.trim(),
        servicos: Array.isArray(servicos) ? servicos : [],
        pecas: Array.isArray(pecas) ? pecas : [],
        observacoes: observacoes?.trim() || undefined
      });
      sendJson(res, 201, normalizeOrdem(nova));
      return;
    }

    if (req.method === 'PUT' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const body = await parseBody(req);
      const { clienteId, veiculoId, dataEntrada, status, servicos, pecas, observacoes } = body || {};
      if (!clienteId || !veiculoId || !dataEntrada || !status) {
        sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
        return;
      }
      const atualizada = await updateOrdemServico(id, {
        clienteId: Number(clienteId),
        veiculoId: Number(veiculoId),
        dataEntrada: dataEntrada,
        status: status.trim(),
        servicos: Array.isArray(servicos) ? servicos : [],
        pecas: Array.isArray(pecas) ? pecas : [],
        observacoes: observacoes?.trim() || undefined
      });
      if (!atualizada) {
        sendJson(res, 404, { message: 'Ordem de serviço não encontrada.' });
        return;
      }
      sendJson(res, 200, normalizeOrdem(atualizada));
      return;
    }

    sendJson(res, 404, { message: 'Rota não encontrada.' });
  } catch (error) {
    console.error('Erro ao processar requisição', error);
    if (error.code === '23505') {
      sendJson(res, 409, { message: 'Registro duplicado detectado.' });
      return;
    }
    const status = error.message === 'JSON inválido no corpo da requisição.' ? 400 : 500;
    const message = status === 400 ? error.message : 'Erro interno no servidor.';
    sendJson(res, status, { message });
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    console.error('Erro inesperado', error);
    if (!res.headersSent) {
      sendJson(res, 500, { message: 'Erro interno no servidor.' });
    } else {
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
