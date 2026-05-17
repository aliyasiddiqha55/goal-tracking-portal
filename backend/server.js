
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { startEscalationJob } = require('./utils/escalation');
const goalRoutes = require('./routes/goals');
const checkinRoutes = require('./routes/checkins');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://goal-tracking-portal-five.vercel.app',
    'https://goal-tracking-portal-a5e0j7jj8-aliya-siddiqha-s-projects.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/admin', adminRoutes);
// DB Test route
app.get('/test-db', async (req, res) => {
  try {
    const pool = require('./config/db');
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Goal Tracking Portal API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startEscalationJob();
});