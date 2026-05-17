import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SharedGoals = () => {
  const { token } = useAuth();
  const [sharedGoals, setSharedGoals] = useState([]);
  const [weightages, setWeightages] = useState({});

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSharedGoals();
  }, []);

  const fetchSharedGoals = async () => {
    try {
      const res = await axios.get(
        `${API}/api/goals/shared-goals`, { headers }
      );
      setSharedGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch shared goals');
    }
  };

  const handleWeightageUpdate = async (sharedGoalId) => {
    const weightage = weightages[sharedGoalId];
    if (!weightage) return;
    try {
      await axios.put(
        `${API}/api/goals/shared-goals/${sharedGoalId}/weightage`,
        { weightage }, { headers }
      );
      toast.success('Weightage updated!');
      fetchSharedGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  if (sharedGoals.length === 0) return null;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📌 Shared Goals (Pushed by Manager/Admin)</h3>
      {sharedGoals.map(goal => (
        <div key={goal.id} style={styles.goalCard}>
          <div style={styles.goalHeader}>
            <span style={styles.sharedBadge}>SHARED</span>
            <span style={styles.readOnly}>🔒 Title & Target are Read-only</span>
          </div>
          <h4 style={styles.goalTitle}>{goal.title}</h4>
          <p style={styles.goalDesc}>{goal.description}</p>
          <div style={styles.goalMeta}>
            <span>🎯 Target: {goal.target || goal.target_date}</span>
            <span>📊 UoM: {goal.uom_type}</span>
            <span>📁 {goal.thrust_area_name}</span>
          </div>
          <div style={styles.weightageRow}>
            <span style={styles.weightageLabel}>
              Your Weightage: {goal.shared_weightage}%
            </span>
            <input
              style={styles.weightageInput}
              type="number"
              min="10"
              placeholder="Update %"
              onChange={(e) => setWeightages({
                ...weightages,
                [goal.id]: e.target.value
              })}
            />
            <button
              style={styles.updateBtn}
              onClick={() => handleWeightageUpdate(goal.id)}
            >
              Update
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { marginTop: '24px' },
  title: { color: '#2d3748', marginBottom: '16px' },
  goalCard: { backgroundColor: '#fffff0', border: '1px solid #f6e05e', padding: '16px', borderRadius: '12px', marginBottom: '12px' },
  goalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  sharedBadge: { backgroundColor: '#f6e05e', color: '#744210', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' },
  readOnly: { fontSize: '12px', color: '#718096' },
  goalTitle: { margin: '0 0 4px', color: '#2d3748' },
  goalDesc: { color: '#718096', fontSize: '13px', marginBottom: '8px' },
  goalMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#4a5568', marginBottom: '12px' },
  weightageRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  weightageLabel: { fontWeight: '600', color: '#2d3748', fontSize: '14px' },
  weightageInput: { padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '80px', fontSize: '14px' },
  updateBtn: { padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }
};

export default SharedGoals;
