
const cron = require('node-cron');
const pool = require('../config/db');
const { sendEmail } = require('./emailService');

const DAYS_TO_SUBMIT = 7;
const DAYS_TO_APPROVE = 3;

const checkEscalations = async () => {
  console.log('Running escalation check...');
  try {

    // Rule 1 — Employee hasn't submitted goals within N days
    const unsubmitted = await pool.query(`
      SELECT u.name, u.email, m.email as manager_email,
             hr.email as hr_email
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN users hr ON hr.role = 'admin' 
        AND hr.org_id = u.org_id
      JOIN goal_cycles gc ON gc.phase_name = 'Phase 1 — Goal Setting'
        AND gc.org_id = u.org_id
      WHERE u.role = 'employee'
      AND NOW() > gc.opens_on + INTERVAL '${DAYS_TO_SUBMIT} days'
      AND NOW() < gc.closes_on
      AND NOT EXISTS (
        SELECT 1 FROM goals g 
        WHERE g.employee_id = u.id 
        AND g.status IN ('submitted','approved')
      )
    `);

    for (const emp of unsubmitted.rows) {
      // Notify employee
      await sendEmail(
        emp.email,
        '⚠️ Action Required: Please submit your goals',
        `<div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#f56565;">Goals Not Submitted</h2>
          <p>Hi ${emp.name}, you have not submitted your goals yet.</p>
          <p>The goal setting window is still open. Please submit before the deadline.</p>
          <a href="${process.env.FRONTEND_URL}/employee/goals"
             style="background:#4f46e5;color:white;padding:10px 20px;
                    border-radius:8px;text-decoration:none;display:inline-block;">
            Submit Goals Now
          </a>
        </div>`
      );

      // Notify manager
      if (emp.manager_email) {
        await sendEmail(
          emp.manager_email,
          `⚠️ ${emp.name} has not submitted goals yet`,
          `<div style="font-family:sans-serif;padding:20px;">
            <h2 style="color:#f56565;">Team Member Alert</h2>
            <p>${emp.name} has not submitted their goals after ${DAYS_TO_SUBMIT} days.</p>
            <p>Please follow up with them.</p>
          </div>`
        );
      }

      // Log escalation
      await pool.query(`
        INSERT INTO audit_logs (goal_id, changed_by, field_changed, old_value, new_value)
        SELECT g.id, u.id, 'escalation', 'pending', 'goals_not_submitted'
        FROM users u
        LEFT JOIN goals g ON g.employee_id = u.id
        WHERE u.email = $1
        LIMIT 1
      `, [emp.email]);
    }

    // Rule 2 — Manager hasn't approved goals within N days
    const unapproved = await pool.query(`
      SELECT DISTINCT
        m.name as manager_name,
        m.email as manager_email,
        u.name as employee_name,
        g.id as goal_id
      FROM goals g
      LEFT JOIN users u ON g.employee_id = u.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE g.status = 'submitted'
      AND g.created_at < NOW() - INTERVAL '${DAYS_TO_APPROVE} days'
    `);

    for (const item of unapproved.rows) {
      if (item.manager_email) {
        await sendEmail(
          item.manager_email,
          `⚠️ Pending Approval: ${item.employee_name} goals`,
          `<div style="font-family:sans-serif;padding:20px;">
            <h2 style="color:#ecc94b;">Goals Pending Your Approval</h2>
            <p>${item.employee_name} submitted goals ${DAYS_TO_APPROVE}+ days ago.</p>
            <p>Please review and approve them.</p>
            <a href="${process.env.FRONTEND_URL}/manager/approval"
               style="background:#4f46e5;color:white;padding:10px 20px;
                      border-radius:8px;text-decoration:none;display:inline-block;">
              Review Now
            </a>
          </div>`
        );

        // Log escalation
        await pool.query(`
          INSERT INTO audit_logs (goal_id, changed_by, field_changed, old_value, new_value)
          VALUES ($1, $2, 'escalation', 'submitted', 'approval_overdue')
        `, [item.goal_id, item.manager_email]);
      }
    }

    // Rule 3 — Check-in not completed within active window
    const missedCheckins = await pool.query(`
      SELECT u.name, u.email, m.email as manager_email,
             gc.phase_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      JOIN goal_cycles gc ON gc.org_id = u.org_id
      WHERE u.role = 'employee'
      AND NOW() BETWEEN gc.opens_on AND gc.closes_on
      AND gc.phase_name IN ('Q1 Check-in','Q2 Check-in','Q3 Check-in','Q4 / Annual')
      AND NOT EXISTS (
        SELECT 1 FROM checkins c
        JOIN goals g ON c.goal_id = g.id
        WHERE g.employee_id = u.id
        AND c.quarter = CASE gc.phase_name
          WHEN 'Q1 Check-in' THEN 'Q1'
          WHEN 'Q2 Check-in' THEN 'Q2'
          WHEN 'Q3 Check-in' THEN 'Q3'
          WHEN 'Q4 / Annual' THEN 'Q4'
        END
      )
    `);

    for (const emp of missedCheckins.rows) {
      await sendEmail(
        emp.email,
        `⏰ Reminder: ${emp.phase_name} is due`,
        `<div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#ecc94b;">${emp.phase_name} Reminder</h2>
          <p>Hi ${emp.name}, the ${emp.phase_name} window is open.</p>
          <p>Please update your goal progress before it closes.</p>
          <a href="${process.env.FRONTEND_URL}/employee/checkin"
             style="background:#4f46e5;color:white;padding:10px 20px;
                    border-radius:8px;text-decoration:none;display:inline-block;">
            Submit Check-in
          </a>
        </div>`
      );
    }

    console.log('Escalation check complete!');
    return {
      unsubmitted: unsubmitted.rows.length,
      unapproved: unapproved.rows.length,
      missedCheckins: missedCheckins.rows.length
    };

  } catch (err) {
    console.error('Escalation error:', err.message);
    throw err;
  }
};

// Run every day at 9 AM
const startEscalationJob = () => {
  cron.schedule('0 9 * * *', checkEscalations);
  console.log('Escalation job scheduled — runs daily at 9 AM');
};

module.exports = { startEscalationJob, checkEscalations };