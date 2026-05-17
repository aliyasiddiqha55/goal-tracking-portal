
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ManagerCheckIn = () => {
  const { token } = useAuth();
  const [teamCheckins, setTeamCheckins] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  useEffect(() => {
    fetchTeamCheckins();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeamCheckins = async () => {
    try {
      const res = await axios.get(`${API}/api/checkins/team-checkins`, { headers });
      setTeamCheckins(res.data);
    } catch (err) {
      toast.error('Failed to fetch checkins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (checkinId) => {
    const comment = comments[checkinId];
    if (!comment?.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    try {
      await axios.post(`${API}/api/checkins/comment`, {
        checkin_id: checkinId,
        comment
      }, { headers });
      toast.success('Comment added!');
      setComments({ ...comments, [checkinId]: '' });
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const filteredCheckins = teamCheckins.filter(
    c => c.quarter === selectedQuarter
  );

  // Group by employee
  const groupedByEmployee = filteredCheckins.reduce((acc, checkin) => {
    if (!acc[checkin.employee_name]) acc[checkin.employee_name] = [];
    acc[checkin.employee_name].push(checkin);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#48bb78';
      case 'on_track': return '#4299e1';
      case 'not_started': return '#a0aec0';
      default: return '#a0aec0';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#48bb78';
    if (score >= 50) return '#ecc94b';
    return '#f56565';
  };

  if (loading) return (
    <div style={styles.loading}>Loading checkins...</div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Team Check-ins</h1>
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

      {/* Empty State */}
      {Object.keys(groupedByEmployee).length === 0 && (
        <div style={styles.emptyState}>
          <p>No check-ins found for {selectedQuarter}</p>
        </div>
      )}

      {/* Employee Checkins */}
      {Object.entries(groupedByEmployee).map(([employeeName, checkins]) => (
        <div key={employeeName} style={styles.employeeCard}>
          <div style={styles.employeeHeader}>
            <div style={styles.avatar}>
              {employeeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={styles.employeeName}>{employeeName}</h3>
              <p style={styles.employeeStats}>
                {checkins.length} goals updated for {selectedQuarter}
              </p>
            </div>
          </div>

          {checkins.map(checkin => (
            <div key={checkin.id} style={styles.checkinCard}>
              <div style={styles.checkinHeader}>
                <div>
                  <h4 style={styles.goalTitle}>{checkin.goal_title}</h4>
                  <span style={styles.uomBadge}>
                    {checkin.uom_type?.toUpperCase()}
                  </span>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(checkin.status)
                }}>
                  {checkin.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Planned vs Actual */}
              <div style={styles.metricsRow}>
                <div style={styles.metricBox}>
                  <p style={styles.metricLabel}>Planned Target</p>
                  <p style={styles.metricValue}>{checkin.target}</p>
                </div>
                <div style={styles.metricBox}>
                  <p style={styles.metricLabel}>Actual Achievement</p>
                  <p style={styles.metricValue}>
                    {checkin.actual_achievement || '-'}
                  </p>
                </div>
                <div style={styles.metricBox}>
                  <p style={styles.metricLabel}>Score</p>
                  <p style={{
                    ...styles.metricValue,
                    color: getScoreColor(checkin.score)
                  }}>
                    {checkin.score ? `${checkin.score.toFixed(1)}%` : '-'}
                  </p>
                </div>
              </div>

              {/* Manager Comment */}
              <div style={styles.commentSection}>
                <label style={styles.label}>
                  Add Check-in Comment
                </label>
                <textarea
                  style={styles.textarea}
                  placeholder="Document your discussion here..."
                  value={comments[checkin.id] || ''}
                  onChange={(e) => setComments({
                    ...comments,
                    [checkin.id]: e.target.value
                  })}
                />
                <button
                  style={styles.commentButton}
                  onClick={() => handleAddComment(checkin.id)}
                >
                  Add Comment
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
  container: { padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' },
  loading: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  quarterSelector: { display: 'flex', gap: '8px' },
  quarterBtn: { padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#a0aec0' },
  employeeCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px' },
  employeeHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700' },
  employeeName: { margin: '0 0 4px', color: '#2d3748', fontSize: '18px' },
  employeeStats: { margin: 0, color: '#718096', fontSize: '13px' },
  checkinCard: { backgroundColor: '#f7fafc', padding: '16px', borderRadius: '8px', marginBottom: '12px' },
  checkinHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  goalTitle: { margin: '0 0 4px', color: '#2d3748' },
  uomBadge: { fontSize: '11px', color: '#718096', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '8px' },
  statusBadge: { color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' },
  metricBox: { backgroundColor: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center' },
  metricLabel: { margin: '0 0 4px', fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' },
  metricValue: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#2d3748' },
  commentSection: {},
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#4a5568' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', minHeight: '80px', boxSizing: 'border-box', resize: 'vertical' },
  commentButton: { marginTop: '8px', padding: '8px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }
};

export default ManagerCheckIn;