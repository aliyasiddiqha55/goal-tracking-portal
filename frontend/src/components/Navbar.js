
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (user?.role === 'employee') return [
      { label: '🎯 My Goals', path: '/employee/goals' },
      { label: '✅ Check-in', path: '/employee/checkin' }
    ];
    if (user?.role === 'manager') return [
      { label: '👥 Team Dashboard', path: '/manager/dashboard' },
      { label: '📋 Approve Goals', path: '/manager/approval' },
      { label: '✅ Check-ins', path: '/manager/checkin' }
    ];
    if (user?.role === 'admin') return [
      { label: '🏠 Dashboard', path: '/admin/dashboard' },
      { label: '📋 Audit Log', path: '/admin/audit' },
      { label: '📊 Reports', path: '/admin/reports' },
      { label: '🗓️ Cycles', path: '/admin/cycles' }
    ];
    return [];
  };

  const getRoleColor = () => {
    if (user?.role === 'admin') return '#c53030';
    if (user?.role === 'manager') return '#2b6cb0';
    return '#276749';
  };

  const getRoleBg = () => {
    if (user?.role === 'admin') return '#fff5f5';
    if (user?.role === 'manager') return '#ebf8ff';
    return '#f0fff4';
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navLeft}>
        <h2 style={styles.logo}>🎯 Goal Portal</h2>
        <div style={styles.navLinks}>
          {getNavLinks().map(link => (
            <button
              key={link.path}
              style={styles.navLink}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.navRight}>
        <span style={{
          ...styles.roleBadge,
          backgroundColor: getRoleBg(),
          color: getRoleColor()
        }}>
          {user?.role?.toUpperCase()}
        </span>
        <span style={styles.userName}>{user?.name}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '60px',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
  logo: { margin: 0, fontSize: '18px', color: '#4f46e5' },
  navLinks: { display: 'flex', gap: '8px' },
  navLink: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '500'
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700'
  },
  userName: { fontSize: '14px', color: '#2d3748', fontWeight: '600' },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff5f5',
    color: '#c53030',
    border: '1px solid #fed7d7',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px'
  }
};

export default Navbar;