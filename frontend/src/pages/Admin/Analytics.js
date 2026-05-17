import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
  ResponsiveContainer
} from 'recharts';

const API = 'https://goal-tracking-portal-backend.onrender.com';
const COLORS = ['#4f46e5', '#48bb78', '#ecc94b', '#f56565', '#4299e1'];

const Analytics = () => {
  const { token } = useAuth();
  const [completion, setCompletion] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${API}/api/admin/completion-dashboard`, { headers }
      );
      setCompletion(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Data for charts
  const statusData = [
    {
      name: 'Approved',
      value: completion.reduce((s, r) =>
        s + parseInt(r.approved_goals || 0), 0)
    },
    {
      name: 'Pending',
      value: completion.reduce((s, r) =>
        s + parseInt(r.pending_goals || 0), 0)
    },
    {
      name: 'Check-ins',
      value: completion.reduce((s, r) =>
        s + parseInt(r.total_checkins || 0), 0)
    }
  ];

  const goalsData = completion.slice(0, 8).map(r => ({
    name: r.employee_name?.split(' ')[0],
    approved: parseInt(r.approved_goals || 0),
    pending: parseInt(r.pending_goals || 0),
    checkins: parseInt(r.total_checkins || 0)
  }));

  const deptMap = {};
  completion.forEach(r => {
    if (r.department) {
      if (!deptMap[r.department]) {
        deptMap[r.department] = { total: 0, approved: 0 };
      }
      deptMap[r.department].total += parseInt(r.total_goals || 0);
      deptMap[r.department].approved += parseInt(r.approved_goals || 0);
    }
  });
  const deptData = Object.entries(deptMap).map(([name, data]) => ({
    name,
    completion: data.total > 0
      ? Math.round((data.approved / data.total) * 100) : 0
  }));

  if (loading) return (
    <div style={styles.loading}>Loading analytics...</div>
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
          <h1 style={styles.title}>📊 Analytics</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>{completion.length}</h3>
          <p style={styles.summaryLabel}>Total Employees</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>
            {completion.reduce((s, r) =>
              s + parseInt(r.total_goals || 0), 0)}
          </h3>
          <p style={styles.summaryLabel}>Total Goals</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={{
            ...styles.summaryNumber, color: '#48bb78'
          }}>
            {completion.reduce((s, r) =>
              s + parseInt(r.approved_goals || 0), 0)}
          </h3>
          <p style={styles.summaryLabel}>Approved Goals</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={{
            ...styles.summaryNumber, color: '#4f46e5'
          }}>
            {completion.reduce((s, r) =>
              s + parseInt(r.total_checkins || 0), 0)}
          </h3>
          <p style={styles.summaryLabel}>Total Check-ins</p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* Bar Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Goals per Employee</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill="#48bb78" name="Approved" />
              <Bar dataKey="pending" fill="#f56565" name="Pending" />
              <Bar dataKey="checkins" fill="#4f46e5" name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Goal Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Chart */}
      {deptData.length > 0 && (
        <div style={styles.chartCardFull}>
          <h3 style={styles.chartTitle}>
            Department Completion Rate (%)
          </h3>
          <ResponsiveContainer width="1
