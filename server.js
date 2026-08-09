require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the static frontend (and uploaded materials). Dotfiles (.env, etc.) are
// never served, even though they live in the same root as the static assets.
app.use(express.static(path.join(__dirname), { dotfiles: 'ignore' }));

// API routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/npos', require('./routes/npos'));
app.use('/api/influencers', require('./routes/influencers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/earnings', require('./routes/earnings'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/go', require('./routes/go'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Socia server running at http://localhost:${PORT}`);
});
