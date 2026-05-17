
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const CheckIn = () => {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [loadingGoal, setLoadingGoal] = useState(null);
  const [form, setForm] = useState({});

  const API = 'https://goal-tracking-portal-backend.onrender.com';
  const headers = { Authorization: `Bearer ${token}` };

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  useEffect(() => {
    fetchGoals();
    fetchCheckins();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API}/api/goals/my-goals`, { headers });
      const approvedGoals = res.data.filter(g => g.status === 'approved');
      setGoals(approvedGoals);
    } catch (err) {
      toast.error('Failed to fetch goals');
    }
  };

  const fetchCheckins = async () => {
    try {
      const res = await axios.get(`${API}/api/checkins/my-checkins`, { headers });
      setCheckins(res.data);
    } catch (err) {
      toast.error('Failed to fetch checkins');
    }
  };

  const getExistingCheckin = (goalId, quarter) => {
    return checkins.find(c => c.goal_id === goalId && c.quarter === quarter);
  };

  const handleSubmitCheckin = async (goalId) => {
    const data = form[goalId];
    if (!data?.status) {
      toast.error('Please select a status');
      return;
    }
    setLoadingGoal(goalId);
    try {
      await axios.post(`${API}/api/checkins/submit`, {
        goal_id: goalId,
        quarter: selectedQuarter,
        actual_achievement: data.actual_achievement,
        completion_date: data.completion_date,
        status: data.status
      }, { headers });
      toast.success('Checkin submitted!');
      fetchCheckins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit checkin');
    } finally {
       setLoadingGoal(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#48bb78';
      case 'on_track': return '#4299e1';
      case 'not_started': return '#a0aec0';
      default: return '#a0aec0';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Quarterly Check-in</h1>
        <div style={styles.quarterSelector}>
          {quarters.map(q => (
            <button
              key={q}
              style={{
                ...styles.quarterBtn,
                backgroundColor: selectedQuarter === q ? '#4f46e5' : '#e2e8f0',
                color: selectedQuarter === q ? 'white' : '#4a5568'
              }}
              onClick={() => setSelectedQuarter(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Goals List */}
      {goals.length === 0 && (
        <div style={styles.emptyState}>
          <p>No approved goals found. Goals must be approved before check-in.</p>
        </div>
      )}

      {goals.map((goal) => {
        const existing = getExistingCheckin(goal.id, selectedQuarter);
        return (
          <div key={goal.id} style={styles.goalCard}>
            <div style={styles.goalHeader}>
              <div>
                <h3 style={styles.goalTitle}>{goal.title}</h3>
                <span style={styles.uomBadge}>
                 {
                   goal.uom_type === 'min' ? 'Numeric/% Higher is Better' :
                   goal.uom_type === 'max' ? 'Numeric/% Lower is Better' :
                   goal.uom_type === 'timeline' ? 'Timeline' :
                   goal.uom_type === 'zero' ? 'Zero-based' : ''
                  } | Target: {goal.target || goal.target_date}
                </span>
              </div>
              {existing && (
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(existing.status)
                }}>
                  {existing.status?.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>

            {existing ? (
              <div style={styles.existingCheckin}>
                <p>✅ Already submitted for {selectedQuarter}</p>
                <div style={styles.checkinDetails}>
                  <span>Achievement: {existing.actual_achievement}</span>
                  <span>Score: {existing.score?.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div style={styles.checkinForm}>
                <div style={styles.formRow}>
                  {goal.uom_type === 'timeline' ? (
                    <div style={styles.field}>
                      <label style={styles.label}>Completion Date</label>
                      <input
                        style={styles.input}
                        type="date"
                        onChange={(e) => setForm({
                          ...form,
                          [goal.id]: { ...form[goal.id], completion_date: e.target.value }
                        })}
                      />
                    </div>
                  ) : (
                    <div style={styles.field}>
                      <label style={styles.label}>Actual Achievement</label>
                      <input
                        style={styles.input}
                        type="number"
                        placeholder="Enter actual value"
                        onChange={(e) => setForm({
                          ...form,
                          [goal.id]: { ...form[goal.id], actual_achievement: e.target.value }
                        })}
                      />
                    </div>
                  )}
                  <div style={styles.field}>
                    <label style={styles.label}>Status</label>
                    <select
                      style={styles.input}
                      onChange={(e) => setForm({
                        ...form,
                        [goal.id]: { ...form[goal.id], status: e.target.value }
                      })}
                    >
                      <option value="">Select Status</option>
                      <option value="not_started">Not Started</option>
                      <option value="on_track">On Track</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <button
                  style={styles.submitBtn}
                  onClick={() => handleSubmitCheckin(goal.id)}
                  disabled={loadingGoal === goal.id}
                >
                  {loadingGoal === goal.id ? 'Submitting...' : `Submit ${selectedQuarter} Check-in`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  container: { padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  quarterSelector: { display: 'flex', gap: '8px' },
  quarterBtn: { padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  goalCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px' },
  goalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  goalTitle: { margin: '0 0 4px', color: '#2d3748' },
  uomBadge: { fontSize: '12px', color: '#718096' },
  statusBadge: { color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  existingCheckin: { backgroundColor: '#f0fff4', padding: '12px', borderRadius: '8px' },
  checkinDetails: { display: 'flex', gap: '20px', marginTop: '8px', fontSize: '14px', color: '#2d3748', fontWeight: '600' },
  checkinForm: {},
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#4a5568' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' },
  submitBtn: { padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default CheckIn;