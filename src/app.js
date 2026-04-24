import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// test route
app.get('/', (req, res) => {
  res.json({
    message: 'Finsight Backend API is running',
  });
});

export default app;
