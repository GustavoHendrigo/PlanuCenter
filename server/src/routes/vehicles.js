import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const veiculos = await query(
      `SELECT v.id, v.placa, v.marca, v.modelo, v.ano, v.client_id AS clienteId,
              c.nome AS clienteNome
       FROM vehicles v
       JOIN clients c ON c.id = v.client_id
       ORDER BY v.id DESC`
    );
    res.json(veiculos);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { placa, marca, modelo, ano, clienteId } = req.body;
    const result = await query(
      `INSERT INTO vehicles (placa, marca, modelo, ano, client_id)
       VALUES (:placa, :marca, :modelo, :ano, :clienteId)`,
      { placa, marca, modelo, ano, clienteId }
    );
    const [veiculo] = await query(
      `SELECT v.id, v.placa, v.marca, v.modelo, v.ano, v.client_id AS clienteId,
              c.nome AS clienteNome
       FROM vehicles v
       JOIN clients c ON c.id = v.client_id
       WHERE v.id = :id`,
      { id: result.insertId }
    );
    res.status(201).json(veiculo);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { placa, marca, modelo, ano, clienteId } = req.body;
    await query(
      `UPDATE vehicles
         SET placa = :placa,
             marca = :marca,
             modelo = :modelo,
             ano = :ano,
             client_id = :clienteId
       WHERE id = :id`,
      { placa, marca, modelo, ano, clienteId, id: req.params.id }
    );
    const [veiculo] = await query(
      `SELECT v.id, v.placa, v.marca, v.modelo, v.ano, v.client_id AS clienteId,
              c.nome AS clienteNome
       FROM vehicles v
       JOIN clients c ON c.id = v.client_id
       WHERE v.id = :id`,
      { id: req.params.id }
    );
    res.json(veiculo);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM vehicles WHERE id = :id`, { id: req.params.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
