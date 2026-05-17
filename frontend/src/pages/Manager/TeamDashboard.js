
import React, { useState, useEffect } from 'react';
import PushSharedGoal from '../../components/PushSharedGoal';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const TeamDashboard = () => {
  const { token } = useAuth();
  const [teamGoals, setTeamGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTeamGoals();
  }, []);

  const fetchTeamGoals = async () => {
    try {
      const res = await axios.get(`${API}/api/goals/team-goals`, { headers });
      setTeamGoals(res.data);
    } catch (err) {
      toast.error('Failed to fetch team goals');
    } finally {
      setLoading(false);
    }
  };

  // Group goals by employee
  const groupedByEmployee = teamGoals.reduce((acc, goal) => {
    if (!acc[goal.employee_name]) {
      acc[goal.employee_name] = [];
    }
    acc[goal.employee_name].push(goal);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#48bb78';
      case 'submitted': return '#4299e1';
      case 'rework': return '#f56565';
      default: return '#a0aec0';
    }
  };

  const getStatusCount = (goals, status) => {
    return goals.filter(g => g.status === status).length;
  };

  if (loading) return <div style={styles.loading}>Loading team data...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Team Dashboard</h1>
        <div style={styles.headerButtons}>
          <button
            style={styles.navButton}
            onClick={() => navigate('/manager/approval')}
          >
            📋 Review Goals
          </button>
          <button
            style={styles.navButton}
            onClick={() => navigate('/manager/checkin')}
          >
            ✅ Check-ins
          </button>
        </div>
      </div>
      {/* Push Shared Goal */}
      <PushSharedGoal />

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>
            {Object.keys(groupedByEmployee).length}
          </h3>
          <p style={styles.summaryLabel}>Team Members</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>{teamGoals.length}</h3>
          <p style={styles.summaryLabel}>Total Goals</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={{ ...styles.summaryNumber, color: '#4299e1' }}>
            {teamGoals.filter(g => g.status === 'submitted').length}
          </h3>
          <p style={styles.summaryLabel}>Pending Approval</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={{ ...styles.summaryNumber, color: '#48bb78' }}>
            {teamGoals.filter(g => g.status === 'approved').length}
          </h3>
          <p style={styles.summaryLabel}>Approved Goals</p>
        </div>
      </div>

      {/* Team Members */}
      {Object.keys(groupedByEmployee).length === 0 && (
        <div style={styles.emptyState}>
          <p>No team members found.</p>
        </div>
      )}

      {Object.entries(groupedByEmployee).map(([employeeName, goals]) => (
        <div key={employeeName} style={styles.employeeCard}>
          <div style={styles.employeeHeader}>
            <div style={styles.avatar}>
              {employeeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={styles.employeeName}>{employeeName}</h3>
              <p style={styles.employeeStats}>
                {goals.length} goals |
                ✅ {getStatusCount(goals, 'approved')} approved |
                ⏳ {getStatusCount(goals, 'submitted')} pending |
                🔄 {getStatusCount(goals, 'rework')} rework
              </p>
            </div>
          </div>

          {/* Goals Table */}
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Goal Title</th>
                <th style={styles.th}>Thrust Area</th>
                <th style={styles.th}>UoM</th>
                <th style={styles.th}>Target</th>
                <th style={styles.th}>Weightage</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {goals.map(goal => (
                <tr key={goal.id} style={styles.tableRow}>
                  <td style={styles.td}>{goal.title}</td>
                  <td style={styles.td}>{goal.thrust_area_name}</td>
                  <td style={styles.td}>{goal.uom_type?.toUpperCase()}</td>
                  <td style={styles.td}>{goal.target || goal.target_date}</td>
                  <td style={styles.td}>{goal.weightage}%</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(goal.status)
                    }}>
                      {goal.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
  loading: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  headerButtons: { display: 'flex', gap: '12px' },
  navButton: { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
  summaryNumber: { fontSize: '32px', fontWeight: '700', color: '#2d3748', margin: '0 0 4px' },
  summaryLabel: { color: '#718096', margin: 0, fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  employeeCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px' },
  employeeHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700' },
  employeeName: { margin: '0 0 4px', color: '#2d3748', fontSize: '18px' },
  employeeStats: { margin: 0, color: '#718096', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f7fafc' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#4a5568', textTransform: 'uppercase' },
  tableRow: { borderTop: '1px solid #e2e8f0' },
  td: { padding: '12px', fontSize: '14px', color: '#2d3748' },
  statusBadge: { color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }
};

export default TeamDashboard;