const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/emailService');

const isWindowOpen = (phaseName, cycles) => {
  const now = new Date();
  const cycle = cycles.find(c => c.phase_name === phaseName);
  if (!cycle) return false;
  return now >= new Date(cycle.opens_on) && now <= new Date(cycle.closes_on);
};

// Create Goal (Employee)
router.post('/create', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const { thrust_area_id, title, description, uom_type, target, target_date, weightage } = req.body;
  const employee_id = req.user.id;
  const org_id = req.user.org_id;
  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM goals WHERE employee_id = $1`, [employee_id]
    );
    if (parseInt(countResult.rows[0].count) >= 8) {
      return res.status(400).json({ message: 'Maximum 8 goals allowed' });
    }
    if (weightage < 10) {
      return res.status(400).json({ message: 'Minimum weightage is 10%' });
    }
    const result = await pool.query(
      `INSERT INTO goals (employee_id, org_id, thrust_area_id, title, description, uom_type, target, target_date, weightage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [employee_id, org_id, thrust_area_id, title, description, uom_type, target, target_date, weightage]
    );
    res.status(201).json({ message: 'Goal created', goal: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get My Goals (Employee)
router.get('/my-goals', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const employee_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT g.*, t.name as thrust_area_name 
       FROM goals g 
       LEFT JOIN thrust_areas t ON g.thrust_area_id = t.id
       WHERE g.employee_id = $1 
       ORDER BY g.created_at DESC`,
      [employee_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit Goals (Employee)
router.post('/submit', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const employee_id = req.user.id;
  const org_id = req.user.org_id;
  try {
    const cycleResult = await pool.query(
      `SELECT * FROM goal_cycles WHERE org_id = $1`, [org_id]
    );
    const cycles = cycleResult.rows;
    if (!isWindowOpen('Phase 1 — Goal Setting', cycles)) {
      return res.status(400).json({ message: 'Goal submission window is currently closed. Opens in May.' });
    }
    const weightResult = await pool.query(
      `SELECT SUM(weightage) as total FROM goals WHERE employee_id = $1 AND status = 'draft'`,
      [employee_id]
    );
    const total = parseFloat(weightResult.rows[0].total);
    if (total !== 100) {
      return res.status(400).json({ message: `Total weightage must be 100%. Current: ${total}%` });
    }
    await pool.query(
      `UPDATE goals SET status = 'submitted' WHERE employee_id = $1 AND status = 'draft'`,
      [employee_id]
    );
    const managerResult = await pool.query(
      `SELECT u.name, m.email as manager_email
       FROM users u LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.id = $1`, [employee_id]
    );
    const userData = managerResult.rows[0];
    if (userData?.manager_email) {
      const template = emailTemplates.goalSubmitted(userData.name, userData.manager_email);
      await sendEmail(template.to, template.subject, template.html);
    }
    res.json({ message: 'Goals submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Team Goals (Manager)
router.get('/team-goals', verifyToken, authorizeRoles('manager'), async (req, res) => {
  const manager_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT g.*, u.name as employee_name, t.name as thrust_area_name
       FROM goals g
       LEFT JOIN users u ON g.employee_id = u.id
       LEFT JOIN thrust_areas t ON g.thrust_area_id = t.id
       WHERE u.manager_id = $1
       ORDER BY g.created_at DESC`,
      [manager_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve Goal (Manager)
router.put('/approve/:goalId', verifyToken, authorizeRoles('manager'), async (req, res) => {
  const { goalId } = req.params;
  try {
    await pool.query(
      `UPDATE goals SET status = 'approved', is_locked = TRUE WHERE id = $1`,
      [goalId]
    );
    await pool.query(
      `INSERT INTO audit_logs (goal_id, changed_by, field_changed, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [goalId, req.user.id, 'status', 'submitted', 'approved']
    );
    const empResult = await pool.query(
      `SELECT u.email FROM goals g
       LEFT JOIN users u ON g.employee_id = u.id WHERE g.id = $1`, [goalId]
    );
    if (empResult.rows[0]?.email) {
      const template = emailTemplates.goalApproved(empResult.rows[0].email);
      await sendEmail(template.to, template.subject, template.html);
    }
    res.json({ message: 'Goal approved and locked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Return Goal for Rework (Manager)
router.put('/rework/:goalId', verifyToken, authorizeRoles('manager'), async (req, res) => {
  const { goalId } = req.params;
  const { comment } = req.body;
  try {
    await pool.query(
      `UPDATE goals SET status = 'rework', rework_comment = $1 WHERE id = $2`,
      [comment, goalId]
    );
    await pool.query(
      `INSERT INTO audit_logs (goal_id, changed_by, field_changed, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [goalId, req.user.id, 'status', 'submitted', `rework: ${comment}`]
    );
    const empResult = await pool.query(
      `SELECT u.email FROM goals g
       LEFT JOIN users u ON g.employee_id = u.id WHERE g.id = $1`, [goalId]
    );
    if (empResult.rows[0]?.email) {
      const template = emailTemplates.goalRework(
        empResult.rows[0].email,
        comment || 'Please review and resubmit'
      );
      await sendEmail(template.to, template.subject, template.html);
    }
    res.json({ message: 'Goal returned for rework' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit Goal by Manager
router.put('/edit/:goalId', verifyToken, authorizeRoles('manager'), async (req, res) => {
  const { goalId } = req.params;
  const { target, weightage } = req.body;
  try {
    await pool.query(
      `UPDATE goals SET target = $1, weightage = $2 WHERE id = $3`,
      [target, weightage, goalId]
    );
    res.json({ message: 'Goal updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unlock Goal (Admin)
router.put('/unlock/:goalId', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const { goalId } = req.params;
  try {
    await pool.query(`UPDATE goals SET is_locked = FALSE WHERE id = $1`, [goalId]);
    await pool.query(
      `INSERT INTO audit_logs (goal_id, changed_by, field_changed, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [goalId, req.user.id, 'is_locked', 'true', 'false']
    );
    res.json({ message: 'Goal unlocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Resubmit rework goal (Employee)
router.put('/resubmit/:goalId', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const { goalId } = req.params;
  try {
    const goalCheck = await pool.query(
      `SELECT * FROM goals WHERE id = $1 AND status = 'rework'`, [goalId]
    );
    if (goalCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Goal is not in rework status' });
    }
    await pool.query(`UPDATE goals SET status = 'submitted' WHERE id = $1`, [goalId]);
    res.json({ message: 'Goal resubmitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Employee edit rework goal
router.put('/edit-employee/:goalId', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const { goalId } = req.params;
  const { title, description, target, target_date, weightage } = req.body;
  try {
    const goalCheck = await pool.query(
      `SELECT * FROM goals WHERE id = $1 AND status = 'rework'`, [goalId]
    );
    if (goalCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Goal is not in rework status' });
    }
    await pool.query(
      `UPDATE goals SET title=$1, description=$2, target=$3, 
       target_date=$4, weightage=$5, status='submitted' WHERE id=$6`,
      [title, description, target, target_date, weightage, goalId]
    );
    res.json({ message: 'Goal updated and resubmitted!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get locked goals (Admin)
router.get('/locked-goals', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT g.*, u.name as employee_name
       FROM goals g LEFT JOIN users u ON g.employee_id = u.id
       WHERE g.org_id = $1 AND g.is_locked = TRUE
       ORDER BY g.created_at DESC`, [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all employees (Manager/Admin)
router.get('/employees', verifyToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, d.name as department
       FROM users u LEFT JOIN departments d ON u.dept_id = d.id
       WHERE u.org_id = $1 AND u.role = 'employee'
       ORDER BY u.name`, [org_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Push Shared Goal to employees (Manager/Admin)
router.post('/push-shared', verifyToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  const { title, description, thrust_area_id, uom_type, target, target_date, employee_ids } = req.body;
  const org_id = req.user.org_id;
  const owner_id = req.user.id;
  try {
    const goalResult = await pool.query(
      `INSERT INTO goals (employee_id, org_id, thrust_area_id, title, description, 
       uom_type, target, target_date, weightage, status, is_shared, is_locked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10, 'approved', TRUE, TRUE) RETURNING *`,
      [owner_id, org_id, thrust_area_id, title, description, uom_type, target, target_date]
    );
    const primaryGoal = goalResult.rows[0];
    for (const employee_id of employee_ids) {
      await pool.query(
        `INSERT INTO shared_goals (source_goal_id, employee_id, weightage) VALUES ($1, $2, 10)`,
        [primaryGoal.id, employee_id]
      );
      await pool.query(
        `INSERT INTO goals (employee_id, org_id, thrust_area_id, title, description,
         uom_type, target, target_date, weightage, status, is_shared, is_locked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10, 'approved', TRUE, TRUE)`,
        [employee_id, org_id, thrust_area_id, title, description, uom_type, target, target_date]
      );
    }
    res.json({ message: `Goal pushed to ${employee_ids.length} employees!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get shared goals for employee
router.get('/shared-goals', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const employee_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT g.*, t.name as thrust_area_name, sg.weightage as shared_weightage
       FROM shared_goals sg
       LEFT JOIN goals g ON sg.source_goal_id = g.id
       LEFT JOIN thrust_areas t ON g.thrust_area_id = t.id
       WHERE sg.employee_id = $1`, [employee_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update shared goal weightage (Employee)
router.put('/shared-goals/:sharedGoalId/weightage', verifyToken, authorizeRoles('employee'), async (req, res) => {
  const { sharedGoalId } = req.params;
  const { weightage } = req.body;
  try {
    if (parseFloat(weightage) < 10) {
      return res.status(400).json({ message: 'Minimum weightage is 10%' });
    }
    await pool.query(
      `UPDATE shared_goals SET weightage = $1 WHERE id = $2 AND employee_id = $3`,
      [weightage, sharedGoalId, req.user.id]
    );
    res.json({ message: 'Weightage updated!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;