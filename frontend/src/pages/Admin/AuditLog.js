
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AuditLog = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(
        `${API}/api/admin/audit-logs`, { headers }
      );
      setLogs(res.data);
    } catch (err) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.changed_by_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.goal_title?.toLowerCase().includes(search.toLowerCase()) ||
    log.field_changed?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={styles.loading}>Loading audit logs...</div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backBtn}
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back
          </button>
          <h1 style={styles.title}>Audit Log</h1>
        </div>
        <input
          style={styles.search}
          placeholder="Search by user, goal or field..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.card}>
        {filteredLogs.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No audit logs found.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Date & Time</th>
                <th style={styles.th}>Changed By</th>
                <th style={styles.th}>Goal</th>
                <th style={styles.th}>Field Changed</th>
                <th style={styles.th}>Old Value</th>
                <th style={styles.th}>New Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    {new Date(log.changed_at).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.userBadge}>
                      {log.changed_by_name}
                    </span>
                  </td>
                  <td style={styles.td}>{log.goal_title}</td>
                  <td style={styles.td}>
                    <span style={styles.fieldBadge}>
                      {log.field_changed}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.oldValue}>
                      {log.old_value || '-'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.newValue}>
                      {log.new_value || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
  search: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '300px' },
  card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f7fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#4a5568', textTransform: 'uppercase' },
  tableRow: { borderTop: '1px solid #e2e8f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#2d3748' },
  userBadge: { backgroundColor: '#ebf4ff', color: '#2b6cb0', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' },
  fieldBadge: { backgroundColor: '#fefcbf', color: '#744210', padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' },
  oldValue: { backgroundColor: '#fff5f5', color: '#c53030', padding: '3px 10px', borderRadius: '10px', fontSize: '12px' },
  newValue: { backgroundColor: '#f0fff4', color: '#276749', padding: '3px 10px', borderRadius: '10px', fontSize: '12px' }
};

export default AuditLog;