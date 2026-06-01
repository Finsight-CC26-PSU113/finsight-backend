import { Router } from 'express';
import {
  getInvestments,
  getInvestmentProducts,
  getInvestmentProductById,
  getInvestmentQuotes,
  getInvestmentPortfolio,
  createPortfolioPosition,
  updatePortfolioPosition,
  deletePortfolioPosition,
} from '../controllers/investmentController.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.get('/api/investments', authenticate, getInvestments);
router.get('/api/investments/products', authenticate, getInvestmentProducts);
router.get('/api/investments/products/:id', authenticate, getInvestmentProductById);
router.get('/api/investments/quotes', authenticate, getInvestmentQuotes);
router.get('/api/investments/portfolio', authenticate, getInvestmentPortfolio);
router.post('/api/investments/portfolio/positions', authenticate, createPortfolioPosition);
router.patch('/api/investments/portfolio/positions/:id', authenticate, updatePortfolioPosition);
router.delete('/api/investments/portfolio/positions/:id', authenticate, deletePortfolioPosition);

export default router;
