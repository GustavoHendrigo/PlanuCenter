import { Router } from 'express';
import { query, transaction } from '../db.js';

const router = Router();

function buildInClauseParams(ids) {
  return ids.reduce(
    (acc, id, index) => {
      acc.placeholders.push(`:id${index}`);
      acc.values[`id${index}`] = id;
      return acc;
    },
    { placeholders: [], values: {} }
  );
}

async function mapOrders(rawOrders) {
  if (!rawOrders.length) {
    return [];
  }
  const orderIds = rawOrders.map(order => order.id);
  const { placeholders, values } = buildInClauseParams(orderIds);

  const servicos = await query(
    `SELECT os.order_id AS orderId, os.service_id AS serviceId, os.qtde, os.preco_unitario AS precoUnitario,
            s.descricao
       FROM order_services os
       JOIN services s ON s.id = os.service_id
      WHERE os.order_id IN (${placeholders.join(',')})`,
    values
  );
  const pecas = await query(
    `SELECT op.order_id AS orderId, op.part_id AS partId, op.qtde, op.preco_unitario AS precoUnitario,
            p.nome, p.codigo
       FROM order_parts op
       JOIN parts p ON p.id = op.part_id
      WHERE op.order_id IN (${placeholders.join(',')})`,
    values
  );

  return rawOrders.map(order => ({
    id: order.id,
    clienteId: order.clienteId,
    clienteNome: order.clienteNome,
    veiculoId: order.veiculoId,
    veiculoDescricao: order.veiculoDescricao,
    dataEntrada: order.dataEntrada,
    status: order.status,
    observacoes: order.observacoes ?? undefined,
    servicos: servicos
      .filter(item => item.orderId === order.id)
      .map(item => ({ id: item.serviceId, qtde: item.qtde, preco: Number(item.precoUnitario), descricao: item.descricao })),
    pecas: pecas
      .filter(item => item.orderId === order.id)
      .map(item => ({ id: item.partId, qtde: item.qtde, preco: Number(item.precoUnitario), nome: item.nome, codigo: item.codigo }))
  }));
}

async function loadOrderById(orderId) {
  const orders = await query(
    `SELECT o.id,
            o.client_id AS clienteId,
            c.nome AS clienteNome,
            o.vehicle_id AS veiculoId,
            CONCAT(v.marca, ' ', v.modelo, ' (', v.placa, ')') AS veiculoDescricao,
            DATE_FORMAT(o.data_entrada, '%Y-%m-%d') AS dataEntrada,
            o.status,
            o.observacoes
       FROM orders o
       JOIN clients c ON c.id = o.client_id
       JOIN vehicles v ON v.id = o.vehicle_id
      WHERE o.id = :orderId`,
    { orderId }
  );
  const mapped = await mapOrders(orders);
  return mapped[0];
}

router.get('/', async (_req, res, next) => {
  try {
    const orders = await query(
      `SELECT o.id,
              o.client_id AS clienteId,
              c.nome AS clienteNome,
              o.vehicle_id AS veiculoId,
              CONCAT(v.marca, ' ', v.modelo, ' (', v.placa, ')') AS veiculoDescricao,
              DATE_FORMAT(o.data_entrada, '%Y-%m-%d') AS dataEntrada,
              o.status,
              o.observacoes
         FROM orders o
         JOIN clients c ON c.id = o.client_id
         JOIN vehicles v ON v.id = o.vehicle_id
        ORDER BY o.data_entrada DESC, o.id DESC`
    );
    const mapped = await mapOrders(orders);
    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await loadOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { clienteId, veiculoId, dataEntrada, status, observacoes, servicos = [], pecas = [] } = req.body;
    const orderId = await transaction(async connection => {
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (client_id, vehicle_id, data_entrada, status, observacoes)
         VALUES (:clienteId, :veiculoId, :dataEntrada, :status, :observacoes)`,
        { clienteId, veiculoId, dataEntrada, status, observacoes }
      );
      const novoOrderId = orderResult.insertId;

      for (const item of servicos) {
        const [[service]] = await connection.execute(
          `SELECT preco FROM services WHERE id = :id`,
          { id: item.id }
        );
        await connection.execute(
          `INSERT INTO order_services (order_id, service_id, qtde, preco_unitario)
           VALUES (:orderId, :serviceId, :qtde, :preco)`,
          { orderId: novoOrderId, serviceId: item.id, qtde: item.qtde, preco: service.preco }
        );
      }

      for (const item of pecas) {
        const [[part]] = await connection.execute(
          `SELECT preco FROM parts WHERE id = :id`,
          { id: item.id }
        );
        await connection.execute(
          `INSERT INTO order_parts (order_id, part_id, qtde, preco_unitario)
           VALUES (:orderId, :partId, :qtde, :preco)`,
          { orderId: novoOrderId, partId: item.id, qtde: item.qtde, preco: part.preco }
        );
      }

      return novoOrderId;
    });

    const created = await loadOrderById(orderId);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    await query(
      `UPDATE orders SET status = :status WHERE id = :id`,
      { status, id: req.params.id }
    );
    const order = await loadOrderById(req.params.id);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await transaction(async connection => {
      await connection.execute(`DELETE FROM order_services WHERE order_id = :id`, { id: req.params.id });
      await connection.execute(`DELETE FROM order_parts WHERE order_id = :id`, { id: req.params.id });
      await connection.execute(`DELETE FROM orders WHERE id = :id`, { id: req.params.id });
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
