import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LockedGoals = ({ token, API, onUnlock }) => {
  const [lockedGoals, setLockedGoals] = useState([]);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchLockedGoals();
  }, []);

  const fetchLockedGoals = async () => {
    try {
      const res = await axios.get(
        `${API}/api/goals/locked-goals`, { headers }
      );
      setLockedGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch locked goals');
    }
  };

  if (lockedGoals.length === 0) return (
    <p style={{ color: '#a0aec0' }}>No locked goals found.</p>
  );

  return (
    <table style={styles.table}>
      <thead>
        <tr style={styles.tableHeader}>
          <th style={styles.th}>Employee</th>
          <th style={styles.th}>Goal Title</th>
          <th style={styles.th}>Weightage</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Action</th>
        </tr>
      </thead>
      <tbody>
        {lockedGoals.map(goal => (
          <tr key={goal.id} style={styles.tableRow}>
            <td style={styles.td}>{goal.employee_name}</td>
            <td style={styles.td}>{goal.title}</td>
            <td style={styles.td}>{goal.weightage}%</td>
            <td style={styles.td}>
              <span style={styles.lockedBadge}>🔒 Locked</span>
            </td>
            <td style={styles.td}>
              <button
                style={styles.unlockBtn}
                onClick={() => {
                  onUnlock(goal.id);
                  fetchLockedGoals();
                }}
              >
                🔓 Unlock
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const styles = {
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f7fafc' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#4a5568', textTransform: 'uppercase' },
  tableRow: { borderTop: '1px solid #e2e8f0' },
  td: { padding: '12px', fontSize: '14px', color: '#2d3748' },
  lockedBadge: { backgroundColor: '#fff5f5', color: '#c53030', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' },
  unlockBtn: { padding: '6px 14px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }
};

export default LockedGoals;
