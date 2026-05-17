
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ApprovalView = () => {
  const { token } = useAuth();
  const [teamGoals, setTeamGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({});

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTeamGoals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeamGoals = async () => {
    try {
      const res = await axios.get(`${API}/api/goals/team-goals`, { headers });
      setTeamGoals(res.data);
    } catch (err) {
      toast.error('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (goalId) => {
    try {
      await axios.put(`${API}/api/goals/approve/${goalId}`, {}, { headers });
      toast.success('Goal approved and locked!');
      fetchTeamGoals();
    } catch (err) {
      toast.error('Failed to approve goal');
    }
  };

  const handleRework = async (goalId) => {
    try {
      await axios.put(`${API}/api/goals/rework/${goalId}`, {}, { headers });
      toast.success('Goal returned for rework!');
      fetchTeamGoals();
    } catch (err) {
      toast.error('Failed to return goal');
    }
  };

  const handleEdit = async (goalId) => {
    const data = editForm[goalId];
    if (!data) return;
    try {
      await axios.put(`${API}/api/goals/edit/${goalId}`, data, { headers });
      toast.success('Goal updated!');
      fetchTeamGoals();
    } catch (err) {
      toast.error('Failed to update goal');
    }
  };

  // Group by employee
  const groupedByEmployee = teamGoals.reduce((acc, goal) => {
    if (!acc[goal.employee_name]) acc[goal.employee_name] = [];
    acc[goal.employee_name].push(goal);
    return acc;
  }, {});

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Goal Approval</h1>
        <span style={styles.pendingBadge}>
          {teamGoals.length} Pending
        </span>
      </div>

      {teamGoals.length === 0 && (
        <div style={styles.emptyState}>
          <p>✅ No pending goals to approve!</p>
        </div>
      )}

      {Object.entries(groupedByEmployee).map(([employeeName, goals]) => (
        <div key={employeeName} style={styles.employeeSection}>
          <h2 style={styles.employeeName}>👤 {employeeName}</h2>

          {goals.map(goal => (
            <div key={goal.id} style={styles.goalCard}>
              <div style={styles.goalInfo}>
                <div style={styles.goalLeft}>
                  <span style={styles.thrustBadge}>
                    {goal.thrust_area_name}
                  </span>
                  <h3 style={styles.goalTitle}>{goal.title}</h3>
                  <p style={styles.goalDesc}>{goal.description}</p>
                  <div style={styles.goalMeta}>
                    <span>📊 UoM: {goal.uom_type?.toUpperCase()}</span>
                    <span>🎯 Target: {goal.target || goal.target_date}</span>
                    <span>⚖️ Weight: {goal.weightage}%</span>
                  </div>
                </div>

                {/* Inline Edit */}
                <div style={styles.editSection}>
                  <h4 style={styles.editTitle}>Edit (Optional)</h4>
                  <div style={styles.editField}>
                    <label style={styles.label}>Target</label>
                    <input
                      style={styles.input}
                      type="number"
                      defaultValue={goal.target}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        [goal.id]: {
                          ...editForm[goal.id],
                          target: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div style={styles.editField}>
                    <label style={styles.label}>Weightage (%)</label>
                    <input
                      style={styles.input}
                      type="number"
                      defaultValue={goal.weightage}
                      min="10"
                      onChange={(e) => setEditForm({
                        ...editForm,
                        [goal.id]: {
                          ...editForm[goal.id],
                          weightage: e.target.value
                        }
                      })}
                    />
                  </div>
                  <button
                    style={styles.editButton}
                    onClick={() => handleEdit(goal.id)}
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={styles.actions}>
                <button
                  style={styles.reworkButton}
                  onClick={() => handleRework(goal.id)}
                >
                  🔄 Return for Rework
                </button>
                <button
                  style={styles.approveButton}
                  onClick={() => handleApprove(goal.id)}
                >
                  ✅ Approve & Lock
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' },
  loading: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  pendingBadge: { backgroundColor: '#fed7d7', color: '#c53030', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#48bb78', fontSize: '18px' },
  employeeSection: { marginBottom: '24px' },
  employeeName: { color: '#4a5568', fontSize: '18px', marginBottom: '12px' },
  goalCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '12px' },
  goalInfo: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', marginBottom: '16px' },
  goalLeft: {},
  thrustBadge: { backgroundColor: '#ebf4ff', color: '#2b6cb0', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' },
  goalTitle: { margin: '8px 0 4px', color: '#2d3748', fontSize: '16px' },
  goalDesc: { color: '#718096', fontSize: '13px', marginBottom: '8px' },
  goalMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#4a5568' },
  editSection: { backgroundColor: '#f7fafc', padding: '16px', borderRadius: '8px' },
  editTitle: { margin: '0 0 12px', color: '#4a5568', fontSize: '13px', textTransform: 'uppercase' },
  editField: { marginBottom: '10px' },
  label: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#4a5568' },
  input: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' },
  editButton: { width: '100%', padding: '8px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' },
  reworkButton: { padding: '10px 20px', backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  approveButton: { padding: '10px 20px', backgroundColor: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default ApprovalView;