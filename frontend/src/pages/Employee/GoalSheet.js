import React, { useState, useEffect } from 'react';
import SharedGoals from '../../components/SharedGoals';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const GoalSheet = () => {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalWeightage, setTotalWeightage] = useState(0);
  const [form, setForm] = useState({
    thrust_area_id: '',
    title: '',
    description: '',
    uom_type: '',
    target: '',
    target_date: '',
    weightage: ''
  });
  const [editingGoal, setEditingGoal] = useState(null);
  const [editForm, setEditForm] = useState({});

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchGoals();
    fetchThrustAreas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const total = goals.reduce((sum, g) => sum + parseFloat(g.weightage || 0), 0);
    setTotalWeightage(total);
  }, [goals]);

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API}/api/goals/my-goals`, { headers });
      setGoals(res.data);
    } catch (err) {
      toast.error('Failed to fetch goals');
    }
  };

  const fetchThrustAreas = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/thrust-areas`, { headers });
      setThrustAreas(res.data);
    } catch (err) {
      toast.error('Failed to fetch thrust areas');
    }
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    if (parseFloat(form.weightage) < 10) {
      toast.error('Minimum weightage is 10%');
      return;
    }
    if (goals.length >= 8) {
      toast.error('Maximum 8 goals allowed');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/api/goals/create`, form, { headers });
      toast.success('Goal created!');
      setShowForm(false);
      setForm({
        thrust_area_id: '', title: '', description: '',
        uom_type: '', target: '', target_date: '', weightage: ''
      });
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAll = async () => {
    if (totalWeightage !== 100) {
      toast.error(`Total weightage must be 100%. Current: ${totalWeightage}%`);
      return;
    }
    try {
      await axios.post(`${API}/api/goals/submit`, {}, { headers });
      toast.success('Goals submitted to manager!');
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit goals');
    }
  };

  const handleEditRework = (goal) => {
    setEditingGoal(goal.id);
    setEditForm({
      thrust_area_id: goal.thrust_area_id,
      title: goal.title,
      description: goal.description,
      uom_type: goal.uom_type,
      target: goal.target,
      target_date: goal.target_date,
      weightage: goal.weightage
    });
  };

  const handleSaveEdit = async (goalId) => {
    if (parseFloat(editForm.weightage) < 10) {
      toast.error('Minimum weightage is 10%');
      return;
    }
    try {
      await axios.put(`${API}/api/goals/edit-employee/${goalId}`,
        editForm, { headers });
      toast.success('Goal updated and resubmitted!');
      setEditingGoal(null);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update goal');
    }
  };

  // const handleResubmit = async (goalId) => {
  //   try {
  //     await axios.put(`${API}/api/goals/resubmit/${goalId}`, {}, { headers });
  //     toast.success('Goal resubmitted!');
  //     fetchGoals();
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || 'Failed to resubmit');
  //   }
  // };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#48bb78';
      case 'submitted': return '#4299e1';
      case 'rework': return '#f56565';
      default: return '#a0aec0';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Goal Sheet</h1>
        <div style={styles.headerRight}>
          <div style={{
            ...styles.weightBadge,
            backgroundColor: totalWeightage === 100 ? '#c6f6d5' : '#fed7d7',
            color: totalWeightage === 100 ? '#276749' : '#c53030'
          }}>
            Weightage: {totalWeightage}% / 100%
          </div>
          {goals.length < 8 && goals.some(g => g.status === 'draft') && (
            <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
              + Add Goal ({8 - goals.length} remaining)
            </button>
          )}
        </div>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Goal</h3>
          <form onSubmit={handleSubmitGoal}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Thrust Area</label>
                <select
                  style={styles.input}
                  value={form.thrust_area_id}
                  onChange={(e) => setForm({ ...form, thrust_area_id: e.target.value })}
                  required
                >
                  <option value="">Select Thrust Area</option>
                  {thrustAreas.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Goal Title</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Enter goal title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Enter description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Unit of Measurement</label>
                <select
                  style={styles.input}
                  value={form.uom_type}
                  onChange={(e) => setForm({ ...form, uom_type: e.target.value })}
                  required
                >
                  <option value="">Select UoM</option>
                  <option value="min">Numeric / % (Higher is Better — e.g. Sales)</option>
                  <option value="max">Numeric / % (Lower is Better — e.g. Cost, TAT)</option>
                  <option value="timeline">Timeline (Date-based Completion)</option>
                  <option value="zero">Zero-based (0 = Success — e.g. Safety Incidents)</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Target</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="Enter target"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Target Date</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Weightage (%)</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="Min 10%"
                  min="10"
                  max="100"
                  value={form.weightage}
                  onChange={(e) => setForm({ ...form, weightage: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={styles.formActions}>
              <button type="button" style={styles.cancelButton}
                onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" style={styles.saveButton} disabled={loading}>
                {loading ? 'Saving...' : 'Save Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div style={styles.goalsGrid}>
        {goals.length === 0 && (
          <div style={styles.emptyState}>
            <p>No goals yet. Click "Add Goal" to get started!</p>
          </div>
        )}
        {goals.map((goal) => (
          <div key={goal.id} style={styles.goalCard}>
            <div style={styles.goalHeader}>
              <span style={styles.thrustBadge}>{goal.thrust_area_name}</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(goal.status)
              }}>
                {goal.status?.toUpperCase()}
              </span>
            </div>
            <h3 style={styles.goalTitle}>{goal.title}</h3>
            <p style={styles.goalDesc}>{goal.description}</p>
            <div style={styles.goalMeta}>
              <span>🎯 Target: {goal.target || goal.target_date}</span>
              <span>📊 UoM: {
                goal.uom_type === 'min' ? 'Numeric/% (Higher is Better)' :
                goal.uom_type === 'max' ? 'Numeric/% (Lower is Better)' :
                goal.uom_type === 'timeline' ? 'Timeline' :
                goal.uom_type === 'zero' ? 'Zero-based' : ''
              }</span>
              <span>⚖️ Weight: {goal.weightage}%</span>
            </div>

            {/* Locked Badge */}
            {goal.is_locked && (
              <div style={styles.lockedBadge}>🔒 Locked</div>
            )}

            {/* Rework Section */}
            {goal.status === 'rework' && (
              <div>
                {goal.rework_comment && (
                  <div style={styles.reworkComment}>
                    💬 Manager says: "{goal.rework_comment}"
                  </div>
                )}
                {editingGoal === goal.id ? (
                  <div style={styles.editReworkForm}>
                    <input
                      style={styles.input}
                      placeholder="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({
                        ...editForm, title: e.target.value
                      })}
                    />
                    <input
                      style={styles.input}
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({
                        ...editForm, description: e.target.value
                      })}
                    />
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="Target"
                      value={editForm.target}
                      onChange={(e) => setEditForm({
                        ...editForm, target: e.target.value
                      })}
                    />
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="Weightage %"
                      min="10"
                      value={editForm.weightage}
                      onChange={(e) => setEditForm({
                        ...editForm, weightage: e.target.value
                      })}
                    />
                    <div style={styles.editReworkActions}>
                      <button
                        style={styles.cancelButton}
                        onClick={() => setEditingGoal(null)}
                      >
                        Cancel
                      </button>
                      <button
                        style={styles.saveButton}
                        onClick={() => handleSaveEdit(goal.id)}
                      >
                        Save & Resubmit
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    style={styles.resubmitBtn}
                    onClick={() => handleEditRework(goal)}
                  >
                    ✏️ Edit & Resubmit
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {goals.length > 0 && goals.some(g => g.status === 'draft') && (
        <div style={styles.submitSection}>
          <p style={{ color: totalWeightage === 100 ? '#276749' : '#c53030' }}>
            {totalWeightage === 100
              ? '✅ Ready to submit!'
              : `⚠️ Total weightage is ${totalWeightage}%. Must be 100%`}
          </p>
          <button
            style={totalWeightage === 100 ? styles.submitButton : styles.submitButtonDisabled}
            onClick={handleSubmitAll}
            disabled={totalWeightage !== 100}
          >
            Submit Goals to Manager
          </button>
        </div>
      )}
      <SharedGoals />
    </div>
  );
};

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  weightBadge: { padding: '8px 16px', borderRadius: '20px', fontWeight: '700', fontSize: '14px' },
  addButton: { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  formCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '24px' },
  formTitle: { marginTop: 0, color: '#2d3748' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#4a5568' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' },
  cancelButton: { padding: '10px 20px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  saveButton: { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  goalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  goalCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  goalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  thrustBadge: { backgroundColor: '#ebf4ff', color: '#2b6cb0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  statusBadge: { color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  goalTitle: { margin: '0 0 8px', color: '#2d3748', fontSize: '16px' },
  goalDesc: { color: '#718096', fontSize: '13px', marginBottom: '12px' },
  goalMeta: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#4a5568' },
  lockedBadge: { marginTop: '12px', backgroundColor: '#fff5f5', color: '#c53030', padding: '6px', borderRadius: '6px', fontSize: '12px', textAlign: 'center' },
  emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#a0aec0' },
  reworkComment: { marginTop: '8px', padding: '8px 12px', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '6px', fontSize: '13px', color: '#c53030', fontWeight: '600' },
  editReworkForm: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  editReworkActions: { display: 'flex', gap: '8px', marginTop: '4px' },
  resubmitBtn: { marginTop: '12px', width: '100%', padding: '8px', backgroundColor: '#ecc94b', color: '#744210', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  submitSection: { marginTop: '24px', textAlign: 'center' },
  submitButton: { padding: '14px 40px', backgroundColor: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
  submitButtonDisabled: { padding: '14px 40px', backgroundColor: '#a0aec0', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'not-allowed' }
};

export default GoalSheet;
