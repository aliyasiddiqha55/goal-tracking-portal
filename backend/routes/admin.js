
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Get All Users (Admin)
router.get('/users', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, d.name as department
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.id
       WHERE u.org_id = $1
       ORDER BY u.role, u.name`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Audit Logs (Admin)
router.get('/audit-logs', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT al.*, u.name as changed_by_name, g.title as goal_title
       FROM audit_logs al
       LEFT JOIN users u ON al.changed_by = u.id
       LEFT JOIN goals g ON al.goal_id = g.id
       WHERE g.org_id = $1
       ORDER BY al.changed_at DESC`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Achievement Report (Admin) - CSV Export
router.get('/achievement-report', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT 
         u.name as employee_name,
         d.name as department,
         g.title as goal_title,
         g.target as planned_target,
         g.uom_type,
         g.weightage,
         c.quarter,
         c.actual_achievement,
         c.status,
         c.score
       FROM goals g
       LEFT JOIN users u ON g.employee_id = u.id
       LEFT JOIN departments d ON u.dept_id = d.id
       LEFT JOIN checkins c ON g.id = c.goal_id
       WHERE g.org_id = $1
       ORDER BY u.name, g.title, c.quarter`,
      [org_id]
    );

    // Convert to CSV
    const headers = [
      'Employee Name', 'Department', 'Goal Title',
      'Planned Target', 'UoM Type', 'Weightage',
      'Quarter', 'Actual Achievement', 'Status', 'Score'
    ];

    const csvRows = [headers.join(',')];
    result.rows.forEach(row => {
      csvRows.push([
        row.employee_name, row.department, row.goal_title,
        row.planned_target, row.uom_type, row.weightage,
        row.quarter, row.actual_achievement, row.status, row.score
      ].join(','));
    });

    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=achievement-report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Completion Dashboard (Admin)
router.get('/completion-dashboard', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT 
         u.name as employee_name,
         u.role,
         d.name as department,
         COUNT(g.id) as total_goals,
         COUNT(CASE WHEN g.status = 'approved' THEN 1 END) as approved_goals,
         COUNT(CASE WHEN g.status = 'submitted' THEN 1 END) as pending_goals,
         COUNT(c.id) as total_checkins
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.id
       LEFT JOIN goals g ON u.id = g.employee_id
       LEFT JOIN checkins c ON g.id = c.goal_id
       WHERE u.org_id = $1
       GROUP BY u.id, u.name, u.role, d.name
       ORDER BY u.name`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manage Goal Cycles (Admin)
router.post('/cycles', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const { phase_name, opens_on, closes_on } = req.body;
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `INSERT INTO goal_cycles (org_id, phase_name, opens_on, closes_on)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [org_id, phase_name, opens_on, closes_on]
    );
    res.status(201).json({ message: 'Cycle created', cycle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Cycles (Admin)
router.get('/cycles', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT * FROM goal_cycles WHERE org_id = $1 ORDER BY opens_on`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Department (Admin)
router.post('/departments', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const { name } = req.body;
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `INSERT INTO departments (org_id, name) VALUES ($1, $2) RETURNING *`,
      [org_id, name]
    );
    res.status(201).json({ message: 'Department created', department: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Departments (Admin)
router.get('/departments', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT * FROM departments WHERE org_id = $1 ORDER BY name`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Thrust Area (Admin)
router.post('/thrust-areas', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const { name } = req.body;
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `INSERT INTO thrust_areas (org_id, name) VALUES ($1, $2) RETURNING *`,
      [org_id, name]
    );
    res.status(201).json({ message: 'Thrust area created', thrust_area: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Thrust Areas
router.get('/thrust-areas', verifyToken, async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT * FROM thrust_areas WHERE org_id = $1 ORDER BY name`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;