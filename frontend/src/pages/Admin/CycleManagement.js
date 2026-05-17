
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const CycleManagement = () => {
  const { token } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    phase_name: '',
    opens_on: '',
    closes_on: ''
  });
  const navigate = useNavigate();

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const res = await axios.get(
        `${API}/api/admin/cycles`, { headers }
      );
      setCycles(res.data);
    } catch (err) {
      toast.error('Failed to fetch cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/api/admin/cycles`, form, { headers }
      );
      toast.success('Cycle created!');
      setShowForm(false);
      setForm({ phase_name: '', opens_on: '', closes_on: '' });
      fetchCycles();
    } catch (err) {
      toast.error('Failed to create cycle');
    }
  };

  const isActive = (cycle) => {
    const now = new Date();
    const opens = new Date(cycle.opens_on);
    const closes = new Date(cycle.closes_on);
    return now >= opens && now <= closes;
  };

  const getPhaseColor = (phase) => {
    if (phase?.includes('Goal')) return '#4f46e5';
    if (phase?.includes('Q1')) return '#4299e1';
    if (phase?.includes('Q2')) return '#48bb78';
    if (phase?.includes('Q3')) return '#ecc94b';
    if (phase?.includes('Q4') || phase?.includes('Annual')) return '#ed8936';
    return '#a0aec0';
  };

  const defaultCycles = [
    { phase_name: 'Phase 1 — Goal Setting', opens_on: '2025-05-01', closes_on: '2025-06-30' },
    { phase_name: 'Q1 Check-in', opens_on: '2025-07-01', closes_on: '2025-07-31' },
    { phase_name: 'Q2 Check-in', opens_on: '2025-10-01', closes_on: '2025-10-31' },
    { phase_name: 'Q3 Check-in', opens_on: '2026-01-01', closes_on: '2026-01-31' },
    { phase_name: 'Q4 / Annual', opens_on: '2026-03-01', closes_on: '2026-04-30' }
  ];

  const handleLoadDefaults = async () => {
    try {
      for (const cycle of defaultCycles) {
        await axios.post(
          `${API}/api/admin/cycles`, cycle, { headers }
        );
      }
      toast.success('Default cycles loaded!');
      fetchCycles();
    } catch (err) {
      toast.error('Failed to load default cycles');
    }
  };

  if (loading) return (
    <div style={styles.loading}>Loading cycles...</div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backBtn}
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back
          </button>
          <h1 style={styles.title}>Cycle Management</h1>
        </div>
        <div style={styles.headerButtons}>
          {cycles.length === 0 && (
            <button
              style={styles.defaultBtn}
              onClick={handleLoadDefaults}
            >
              📅 Load Default Cycles
            </button>
          )}
          <button
            style={styles.addBtn}
            onClick={() => setShowForm(!showForm)}
          >
            + Add Cycle
          </button>
        </div>
      </div>

      {/* Add Cycle Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Cycle</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Phase Name</label>
                <select
                  style={styles.input}
                  value={form.phase_name}
                  onChange={(e) => setForm({
                    ...form, phase_name: e.target.value
                  })}
                  required
                >
                  <option value="">Select Phase</option>
                  <option value="Phase 1 — Goal Setting">
                    Phase 1 — Goal Setting
                  </option>
                  <option value="Q1 Check-in">Q1 Check-in</option>
                  <option value="Q2 Check-in">Q2 Check-in</option>
                  <option value="Q3 Check-in">Q3 Check-in</option>
                  <option value="Q4 / Annual">Q4 / Annual</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Opens On</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.opens_on}
                  onChange={(e) => setForm({
                    ...form, opens_on: e.target.value
                  })}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Closes On</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.closes_on}
                  onChange={(e) => setForm({
                    ...form, closes_on: e.target.value
                  })}
                  required
                />
              </div>
            </div>
            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" style={styles.saveBtn}>
                Create Cycle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cycles Timeline */}
      {cycles.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No cycles created yet.</p>
          <p>Click "Load Default Cycles" to set up the standard schedule!</p>
        </div>
      ) : (
        <div style={styles.cyclesList}>
          {cycles.map((cycle, index) => (
            <div key={cycle.id} style={styles.cycleCard}>
              <div style={{
                ...styles.cycleIndicator,
                backgroundColor: getPhaseColor(cycle.phase_name)
              }} />
              <div style={styles.cycleContent}>
                <div style={styles.cycleHeader}>
                  <h3 style={styles.cycleName}>{cycle.phase_name}</h3>
                  {isActive(cycle) && (
                    <span style={styles.activeBadge}>
                      🟢 ACTIVE NOW
                    </span>
                  )}
                </div>
                <div style={styles.cycleDates}>
                  <span>📅 Opens: {new Date(cycle.opens_on)
                    .toLocaleDateString()}</span>
                  <span>📅 Closes: {new Date(cycle.closes_on)
                    .toLocaleDateString()}</span>
                </div>
                <div style={styles.cycleProgress}>
                  {new Date() < new Date(cycle.opens_on) && (
                    <span style={styles.upcomingBadge}>
                      ⏳ Upcoming
                    </span>
                  )}
                  {new Date() > new Date(cycle.closes_on) && (
                    <span style={styles.closedBadge}>
                      🔒 Closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' },
  loading: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  headerButtons: { display: 'flex', gap: '12px' },
  defaultBtn: { padding: '10px 20px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  addBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  formCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '24px' },
  formTitle: { margin: '0 0 16px', color: '#2d3748' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#4a5568' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#a0aec0', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  cyclesList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  cycleCard: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', overflow: 'hidden' },
  cycleIndicator: { width: '8px', flexShrink: 0 },
  cycleContent: { padding: '20px', flex: 1 },
  cycleHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  cycleName: { margin: 0, color: '#2d3748', fontSize: '18px' },
  activeBadge: { backgroundColor: '#f0fff4', color: '#276749', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' },
  cycleDates: { display: 'flex', gap: '24px', fontSize: '14px', color: '#4a5568', marginBottom: '8px' },
  cycleProgress: {},
  upcomingBadge: { backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' },
  closedBadge: { backgroundColor: '#f7fafc', color: '#718096', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }
};

export default CycleManagement;