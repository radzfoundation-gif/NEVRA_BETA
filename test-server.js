// Simple test server for Passenger
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.type('text/html').send('<h1>Test Server OK</h1>');
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 8788;
app.listen(PORT, () => {
  console.log(`Test server listening on ${PORT}`);
});
