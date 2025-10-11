import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.APP_PORT || 3000);
const host = process.env.APP_HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`API rodando em http://${host}:${port}`);
});
