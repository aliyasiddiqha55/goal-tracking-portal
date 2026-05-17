
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const { token } = useAuth();
  const [completion, setCompletion] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCompletion();
  }, []);

  const fetchCompletion = async () => {
    try {
      const res = await axios.get(
        `${API}/api/admin/completion-dashboard`, { headers }
      );
      setCompletion(res.data);
    } catch (err) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get(
        `${API}/api/admin/achievement-report`,
        { headers, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'achievement-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded!');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  const totalGoals = completion.reduce(
    (sum, r) => sum + parseInt(r.total_goals || 0), 0
  );
  const totalApproved = completion.reduce(
    (sum, r) => sum + parseInt(r.approved_goals || 0), 0
  );
  const totalCheckins = completion.reduce(
    (sum, r) => sum + parseInt(r.total_checkins || 0), 0
  );

  if (loading) return (
    <div style={styles.loading}>Loading reports...</div>
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
          <h1 style={styles.title}>Reports</h1>
        </div>
        <button style={styles.exportBtn} onClick={handleExportCSV}>
          ⬇️ Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>{completion.length}</h3>
          <p style={styles.summaryLabel}>Total Employees</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>{totalGoals}</h3>
          <p style={styles.summaryLabel}>Total Goals</p>
        </div>
        <div style={{
          ...styles.summaryCard,
          borderTop: '4px solid #48bb78'
        }}>
          <h3 style={{
            ...styles.summaryNumber, color: '#48bb78'
          }}>
            {totalApproved}
          </h3>
          <p style={styles.summaryLabel}>Approved Goals</p>
        </div>
        <div style={{
          ...styles.summaryCard,
          borderTop: '4px solid #4f46e5'
        }}>
          <h3 style={{
            ...styles.summaryNumber, color: '#4f46e5'
          }}>
            {totalCheckins}
          </h3>
          <p style={styles.summaryLabel}>Total Check-ins</p>
        </div>
      </div>

      {/* Completion Table */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Completion Dashboard</h2>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Employee</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Total Goals</th>
              <th style={styles.th}>Approved</th>
              <th style={styles.th}>Pending</th>
              <th style={styles.th}>Check-ins</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {completion.map((row, i) => (
              <tr key={i} style={styles.tableRow}>
                <td style={styles.td}>{row.employee_name}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor:
                      row.role === 'admin' ? '#fed7d7' :
                      row.role === 'manager' ? '#bee3f8' : '#c6f6d5',
                    color:
                      row.role === 'admin' ? '#c53030' :
                      row.role === 'manager' ? '#2b6cb0' : '#276749'
                  }}>
                    {row.role}
                  </span>
                </td>
                <td style={styles.td}>{row.department || '-'}</td>
                <td style={styles.td}>{row.total_goals}</td>
                <td style={styles.td}>
                  <span style={styles.approvedNum}>
                    {row.approved_goals}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.pendingNum}>
                    {row.pending_goals}
                  </span>
                </td>
                <td style={styles.td}>{row.total_checkins}</td>
                <td style={styles.td}>
                  {parseInt(row.approved_goals) === parseInt(row.total_goals) && parseInt(row.total_goals) > 0 ? (
                    <span style={styles.completeBadge}>✅ Complete</span>
                  ) : parseInt(row.total_goals) === 0 ? (
                    <span style={styles.notStartedBadge}>⬜ Not Started</span>
                  ) : (
                    <span style={styles.inProgressBadge}>🔄 In Progress</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
  loading: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  exportBtn: { padding: '12px 24px', backgroundColor: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
  summaryNumber: { fontSize: '32px', fontWeight: '700', color: '#2d3748', margin: '0 0 4px' },
  summaryLabel: { color: '#718096', margin: 0, fontSize: '14px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  cardTitle: { margin: '0 0 16px', color: '#2d3748' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f7fafc' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#4a5568', textTransform: 'uppercase' },
  tableRow: { borderTop: '1px solid #e2e8f0' },
  td: { padding: '12px', fontSize: '14px', color: '#2d3748' },
  roleBadge: { padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' },
  approvedNum: { backgroundColor: '#f0fff4', color: '#276749', padding: '3px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' },
  pendingNum: { backgroundColor: '#fff5f5', color: '#c53030', padding: '3px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' },
  completeBadge: { fontSize: '12px', fontWeight: '600', color: '#276749' },
  notStartedBadge: { fontSize: '12px', fontWeight: '600', color: '#718096' },
  inProgressBadge: { fontSize: '12px', fontWeight: '600', color: '#4f46e5' }
};

export default Reports;