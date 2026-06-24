import { Router } from 'express';
import { validateQuery } from '../middleware/validateQuery.js';
import {
  validateCreateBody,
  validateUpdateBody,
} from '../middleware/validateProductBody.js';
import {
  listProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
} from '../controllers/productController.js';

const router = Router();

router.get('/products', validateQuery, listProducts);
router.get('/categories', getCategories);
router.get('/products/:id', getProductById);
router.post('/products', validateCreateBody, createProduct);
router.patch('/products/:id', validateUpdateBody, updateProduct);

export default router;
