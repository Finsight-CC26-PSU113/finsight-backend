import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';
import authRoutes from './routes/authRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import savingsGoalRoutes from './routes/savingsGoalRoutes.js';
import riskProfileRoutes from './routes/riskProfileRoutes.js';
import aiInsightRoutes from './routes/aiInsightRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (useful for dynamic ngrok URLs)
      callback(null, true);
    },
    credentials: true,
    maxAge: 86400, // cache preflight 24h — browser tidak perlu kirim OPTIONS tiap request
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'src', 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(authRoutes);
app.use(passwordRoutes);
app.use(categoryRoutes);
app.use(transactionRoutes);
app.use(budgetRoutes);
app.use(dashboardRoutes);
app.use(receiptRoutes);
app.use(recommendationRoutes);
app.use(investmentRoutes);
app.use(savingsRoutes);
app.use(riskProfileRoutes);
app.use(aiInsightRoutes);
app.use(savingsGoalRoutes);

app.use(errorHandler);

export default app;
