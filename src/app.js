import express from 'express';
import pool from './config/db.js';
import productRoutes from './routes/products.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    // Run SELECT 1 to verify database connectivity
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      db: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      error: error.message || 'Database connection error',
    });
  }
});

app.use('/api', productRoutes);

app.use(errorHandler);

export default app;
