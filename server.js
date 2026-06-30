require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the static frontend
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/npos', require('./routes/npos'));
app.use('/api/influencers', require('./routes/influencers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/earnings', require('./routes/earnings'));
app.use('/api/submissions', require('./routes/submissions'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Socia server running at http://localhost:${PORT}`);
});
