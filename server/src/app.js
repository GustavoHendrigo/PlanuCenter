import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import clientsRouter from './routes/clients.js';
import vehiclesRouter from './routes/vehicles.js';
import servicesRouter from './routes/services.js';
import partsRouter from './routes/parts.js';
import ordersRouter from './routes/orders.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/clients', clientsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/services', servicesRouter);
app.use('/api/parts', partsRouter);
app.use('/api/orders', ordersRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Erro interno no servidor'
  });
});

export default app;
