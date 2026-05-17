
const express = require('express');
const isWindowOpen = (phaseName, cycles) => {
  const now = new Date();
  const cycle = cycles.find(c => c.phase_name === phaseName);
  if (!cycle) return false;
  return now >= new Date(cycle.opens_on) && 
         now <= new Date(cycle.closes_on);
};
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Calculate Score based on UoM type
const calculateScore = (uom_type, target, actual, target_date, completion_date) => {
  switch (uom_type) {
    case 'min':
      return (actual / target) * 100;
    case 'max':
      return (target / actual) * 100;
    case 'timeline':
      if (!completion_date || !target_date) return 0;
      return new Date(completion_date) <= new Date(target_date) ? 100 : 0;
    case 'zero':
      return actual === 0 ? 100 : 0;
    default:
      return 0;
  }
};

// Submit Quarterly Checkin (Employee)
router.post('/submit', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const { goal_id, quarter, actual_achievement, completion_date, status } = req.body;
  const employee_id = req.user.id;

  try {
    // Check if checkin window is open
    const cycleResult = await pool.query(
      `SELECT * FROM goal_cycles WHERE org_id = (
        SELECT org_id FROM users WHERE id = $1
      )`,
      [employee_id]
    );
    const cycles = cycleResult.rows;
    const quarterMap = {
      'Q1': 'Q1 Check-in',
      'Q2': 'Q2 Check-in',
      'Q3': 'Q3 Check-in',
      'Q4': 'Q4 / Annual'
    };
    const phaseName = quarterMap[quarter];
    if (!isWindowOpen(phaseName, cycles)) {
      return res.status(400).json({ 
        message: `${quarter} check-in window is currently closed.` 
      });
    }
    // Get goal details for score calculation
    const goalResult = await pool.query(
      `SELECT * FROM goals WHERE id = $1`, [goal_id]
    );
    const goal = goalResult.rows[0];
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Calculate score
    const score = calculateScore(
      goal.uom_type,
      goal.target,
      actual_achievement,
      goal.target_date,
      completion_date
    );

    // Check if checkin already exists for this quarter
    const existing = await pool.query(
      `SELECT * FROM checkins WHERE goal_id = $1 AND quarter = $2`,
      [goal_id, quarter]
    );

    if (existing.rows.length > 0) {
      // Update existing checkin
      await pool.query(
        `UPDATE checkins SET actual_achievement = $1, completion_date = $2, 
         status = $3, score = $4 WHERE goal_id = $5 AND quarter = $6`,
        [actual_achievement, completion_date, status, score, goal_id, quarter]
      );
    } else {
      // Create new checkin
      await pool.query(
        `INSERT INTO checkins (goal_id, employee_id, quarter, actual_achievement, 
         completion_date, status, score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [goal_id, employee_id, quarter, actual_achievement, completion_date, status, score]
      );
    }

    res.json({ message: 'Checkin submitted', score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get My Checkins (Employee)
router.get('/my-checkins', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const employee_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT c.*, g.title as goal_title, g.target, g.uom_type
       FROM checkins c
       LEFT JOIN goals g ON c.goal_id = g.id
       WHERE c.employee_id = $1
       ORDER BY c.created_at DESC`,
      [employee_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Team Checkins (Manager)
router.get('/team-checkins', verifyToken, authorizeRoles('manager'), async (req, res) => {
  const manager_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT c.*, g.title as goal_title, g.target, g.uom_type,
       u.name as employee_name
       FROM checkins c
       LEFT JOIN goals g ON c.goal_id = g.id
       LEFT JOIN users u ON c.employee_id = u.id
       WHERE u.manager_id = $1
       ORDER BY c.created_at DESC`,
      [manager_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Manager Comment (Manager)
router.post('/comment', verifyToken, authorizeRoles('manager'), async (req, res) => {
  const { checkin_id, comment } = req.body;
  const manager_id = req.user.id;
  try {
    await pool.query(
      `INSERT INTO checkin_comments (checkin_id, manager_id, comment)
       VALUES ($1, $2, $3)`,
      [checkin_id, manager_id, comment]
    );
    res.json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Comments for a Checkin
router.get('/comments/:checkinId', verifyToken, async (req, res) => {
  const { checkinId } = req.params;
  try {
    const result = await pool.query(
      `SELECT cc.*, u.name as manager_name
       FROM checkin_comments cc
       LEFT JOIN users u ON cc.manager_id = u.id
       WHERE cc.checkin_id = $1
       ORDER BY cc.created_at DESC`,
      [checkinId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;