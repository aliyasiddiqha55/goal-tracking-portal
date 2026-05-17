import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PushSharedGoal = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', thrust_area_id: '',
    uom_type: '', target: '', target_date: ''
  });

  const API = 'http://localhost:5000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, thrustRes] = await Promise.all([
        axios.get(`${API}/api/goals/employees`, { headers }),
        axios.get(`${API}/api/admin/thrust-areas`, { headers })
      ]);
      setEmployees(empRes.data);
      setThrustAreas(thrustRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    }
  };

  const handleEmployeeToggle = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      toast.error('Select at least one employee!');
      return;
    }
    try {
      await axios.post(`${API}/api/goals/push-shared`, {
        ...form,
        employee_ids: selectedEmployees
      }, { headers });
      toast.success(`Goal pushed to ${selectedEmployees.length} employees!`);
      setShowForm(false);
      setSelectedEmployees([]);
      setForm({
        title: '', description: '', thrust_area_id: '',
        uom_type: '', target: '', target_date: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to push goal');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📌 Push Shared Goal</h3>
        <button
          style={styles.toggleBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Push Goal to Team'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Goal Title</label>
              <input style={styles.input} required
                placeholder="Enter goal title"
                value={form.title}
                onChange={(e) => setForm({
                  ...form, title: e.target.value
                })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Thrust Area</label>
              <select style={styles.input} required
                value={form.thrust_area_id}
                onChange={(e) => setForm({
                  ...form, thrust_area_id: e.target.value
                })}
              >
                <option value="">Select Thrust Area</option>
                {thrustAreas.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <input style={styles.input}
                placeholder="Enter description"
                value={form.description}
                onChange={(e) => setForm({
                  ...form, description: e.target.value
                })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>UoM Type</label>
              <select style={styles.input} required
                value={form.uom_type}
                onChange={(e) => setForm({
                  ...form, uom_type: e.target.value
                })}
              >
                <option value="">Select UoM</option>
                <option value="min">Numeric/% Higher is Better</option>
                <option value="max">Numeric/% Lower is Better</option>
                <option value="timeline">Timeline</option>
                <option value="zero">Zero-based</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Target</label>
              <input style={styles.input} type="number"
                placeholder="Enter target"
                value={form.target}
                onChange={(e) => setForm({
                  ...form, target: e.target.value
                })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Target Date</label>
              <input style={styles.input} type="date"
                value={form.target_date}
                onChange={(e) => setForm({
                  ...form, target_date: e.target.value
                })}
              />
            </div>
          </div>

          <div style={styles.employeeSection}>
            <label style={styles.label}>
              Select Employees to Push To:
            </label>
            <div style={styles.employeeList}>
              {employees.map(emp => (
                <div
                  key={emp.id}
                  style={{
                    ...styles.employeeItem,
                    backgroundColor: selectedEmployees.includes(emp.id)
                      ? '#ebf4ff' : 'white',
                    border: selectedEmployees.includes(emp.id)
                      ? '2px solid #4f46e5' : '1px solid #e2e8f0'
                  }}
                  onClick={() => handleEmployeeToggle(emp.id)}
                >
                  <span style={styles.empName}>{emp.name}</span>
                  <span style={styles.empDept}>{emp.department}</span>
                  {selectedEmployees.includes(emp.id) && (
                    <span style={styles.checkmark}>✅</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.formActions}>
            <span style={styles.selectedCount}>
              {selectedEmployees.length} employees selected
            </span>
            <button type="submit" style={styles.submitBtn}>
              Push Goal to Selected Employees
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const styles = {
  container: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, color: '#2d3748' },
  toggleBtn: { padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  form: { marginTop: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#4a5568' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' },
  employeeSection: { marginBottom: '16px' },
  employeeList: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' },
  employeeItem: { padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' },
  empName: { fontWeight: '600', fontSize: '14px', color: '#2d3748' },
  empDept: { fontSize: '12px', color: '#718096' },
  checkmark: { fontSize: '12px' },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  selectedCount: { color: '#4a5568', fontWeight: '600' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }
};

export default PushSharedGoal;