import { Router } from 'express';
import { validateQuery } from '../middleware/validateQuery.js';
import {
  listProducts,
  getCategories,
  getProductById,
} from '../controllers/productController.js';

const router = Router();

router.get('/products', validateQuery, listProducts);
router.get('/categories', getCategories);
router.get('/products/:id', getProductById);

export default router;
