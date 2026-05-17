
import React, { useState, useEffect } from 'react';
import LockedGoals from '../../components/LockedGoals';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [newThrust, setNewThrust] = useState('');
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '',
    role: 'employee', dept_id: '', manager_id: ''
  });
  const navigate = useNavigate();

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);
  const handleUnlockGoal = async (goalId) => {
  try {
    await axios.put(`${API}/api/goals/unlock/${goalId}`, {}, { headers });
    toast.success('Goal unlocked!');
    fetchAll();
  } catch (err) {
    toast.error('Failed to unlock goal');
  }
};

  const fetchAll = async () => {
    try {
      const [usersRes, completionRes, deptsRes, thrustRes] = await Promise.all([
        axios.get(`${API}/api/admin/users`, { headers }),
        axios.get(`${API}/api/admin/completion-dashboard`, { headers }),
        axios.get(`${API}/api/admin/departments`, { headers }),
        axios.get(`${API}/api/admin/thrust-areas`, { headers })
      ]);
      setUsers(usersRes.data);
      setCompletion(completionRes.data);
      setDepartments(deptsRes.data);
      setThrustAreas(thrustRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${API}/api/admin/users`, { headers });
      const orgId = res.data[0]?.org_id;
      await axios.post(`${API}/api/auth/register`, {
        ...userForm,
        org_id: orgId
      }, { headers });
      toast.success('User created!');
      setShowAddUser(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    try {
      await axios.post(`${API}/api/admin/departments`,
        { name: newDept }, { headers });
      toast.success('Department created!');
      setNewDept('');
      fetchAll();
    } catch (err) {
      toast.error('Failed to create department');
    }
  };

  const handleAddThrust = async () => {
    if (!newThrust.trim()) return;
    try {
      await axios.post(`${API}/api/admin/thrust-areas`,
        { name: newThrust }, { headers });
      toast.success('Thrust area created!');
      setNewThrust('');
      fetchAll();
    } catch (err) {
      toast.error('Failed to create thrust area');
    }
  };

  const managers = users.filter(u => u.role === 'manager');

  if (loading) return (
    <div style={styles.loading}>Loading admin dashboard...</div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <div style={styles.headerButtons}>
          <button style={styles.navBtn}
            onClick={() => navigate('/admin/audit')}>
            📋 Audit Log
          </button>
          <button style={styles.navBtn}
            onClick={() => navigate('/admin/reports')}>
            📊 Reports
          </button>
          <button style={styles.navBtn}
            onClick={() => navigate('/admin/cycles')}>
            🗓️ Cycles
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>{users.length}</h3>
          <p style={styles.summaryLabel}>Total Users</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>
            {users.filter(u => u.role === 'employee').length}
          </h3>
          <p style={styles.summaryLabel}>Employees</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>
            {users.filter(u => u.role === 'manager').length}
          </h3>
          <p style={styles.summaryLabel}>Managers</p>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryNumber}>
            {departments.length}
          </h3>
          <p style={styles.summaryLabel}>Departments</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.actionsGrid}>
        {/* Add Department */}
        <div style={styles.actionCard}>
          <h3 style={styles.actionTitle}>Add Department</h3>
          <div style={styles.actionRow}>
            <input
              style={styles.input}
              placeholder="Department name"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
            <button style={styles.addBtn} onClick={handleAddDept}>
              Add
            </button>
          </div>
          <div style={styles.tagList}>
            {departments.map(d => (
              <span key={d.id} style={styles.tag}>{d.name}</span>
            ))}
          </div>
        </div>

        {/* Add Thrust Area */}
        <div style={styles.actionCard}>
          <h3 style={styles.actionTitle}>Add Thrust Area</h3>
          <div style={styles.actionRow}>
            <input
              style={styles.input}
              placeholder="Thrust area name"
              value={newThrust}
              onChange={(e) => setNewThrust(e.target.value)}
            />
            <button style={styles.addBtn} onClick={handleAddThrust}>
              Add
            </button>
          </div>
          <div style={styles.tagList}>
            {thrustAreas.map(t => (
              <span key={t.id} style={styles.tag}>{t.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Add User */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Users</h2>
          <button
            style={styles.addUserBtn}
            onClick={() => setShowAddUser(!showAddUser)}
          >
            + Add User
          </button>
        </div>

        {showAddUser && (
          <div style={styles.formCard}>
            <form onSubmit={handleAddUser}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Name</label>
                  <input style={styles.input} required
                    value={userForm.name}
                    onChange={(e) => setUserForm({
                      ...userForm, name: e.target.value
                    })}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input style={styles.input} type="email" required
                    value={userForm.email}
                    onChange={(e) => setUserForm({
                      ...userForm, email: e.target.value
                    })}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Password</label>
                  <input style={styles.input} type="password" required
                    value={userForm.password}
                    onChange={(e) => setUserForm({
                      ...userForm, password: e.target.value
                    })}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Role</label>
                  <select style={styles.input}
                    value={userForm.role}
                    onChange={(e) => setUserForm({
                      ...userForm, role: e.target.value
                    })}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Department</label>
                  <select style={styles.input}
                    value={userForm.dept_id}
                    onChange={(e) => setUserForm({
                      ...userForm, dept_id: e.target.value
                    })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Manager</label>
                  <select style={styles.input}
                    value={userForm.manager_id}
                    onChange={(e) => setUserForm({
                      ...userForm, manager_id: e.target.value
                    })}
                  >
                    <option value="">Select Manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn}
                  onClick={() => setShowAddUser(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.saveBtn}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Locked Goals Section */}
        <div style={styles.section}>
           <h2 style={styles.sectionTitle}>🔒 Locked Goals (Click to Unlock)</h2>
           <LockedGoals 
              token={token} 
              API={API} 
              onUnlock={handleUnlockGoal} 
           />
        </div>

        {/* Users Table */}
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Goals</th>
              <th style={styles.th}>Check-ins</th>
            </tr>
          </thead>
          <tbody>
            {completion.map((row, i) => (
              <tr key={i} style={styles.tableRow}>
                <td style={styles.td}>{row.employee_name}</td>
                <td style={styles.td}>{row.role}</td>
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
                <td style={styles.td}>{row.total_checkins}</td>
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
  title: { fontSize: '28px', color: '#1a202c', margin: 0 },
  headerButtons: { display: 'flex', gap: '12px' },
  navBtn: { padding: '10px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
  summaryNumber: { fontSize: '32px', fontWeight: '700', color: '#2d3748', margin: '0 0 4px' },
  summaryLabel: { color: '#718096', margin: 0, fontSize: '14px' },
  actionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  actionCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  actionTitle: { margin: '0 0 12px', color: '#2d3748', fontSize: '16px' },
  actionRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
  input: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' },
  addBtn: { padding: '10px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { backgroundColor: '#ebf4ff', color: '#2b6cb0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  section: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { margin: 0, color: '#2d3748' },
  addUserBtn: { padding: '10px 20px', backgroundColor: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  formCard: { backgroundColor: '#f7fafc', padding: '20px', borderRadius: '8px', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#4a5568' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#f7fafc' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#4a5568', textTransform: 'uppercase' },
  tableRow: { borderTop: '1px solid #e2e8f0' },
  td: { padding: '12px', fontSize: '14px', color: '#2d3748' },
  roleBadge: { padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }
};

export default AdminDashboard;