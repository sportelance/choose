const express = require('express');
const cors = require('./middleware/cors');
const votesRouter = require('./routes/votes');
const resultsRouter = require('./routes/results');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors);
app.use(express.json());

// Routes
app.use('/votes', votesRouter);
app.use('/results', resultsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Drink Vote API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Drink Vote API running on port ${PORT}`);
});
