
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Navbar from './components/Navbar';
import GoalSheet from './pages/Employee/GoalSheet';
import CheckIn from './pages/Employee/CheckIn';
import TeamDashboard from './pages/Manager/TeamDashboard';
import ApprovalView from './pages/Manager/ApprovalView';
import ManagerCheckIn from './pages/Manager/ManagerCheckIn';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AuditLog from './pages/Admin/AuditLog';
import Reports from './pages/Admin/Reports';
import CycleManagement from './pages/Admin/CycleManagement';
import Analytics from './pages/Admin/Analytics';

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />

      {/* Employee Routes */}
      <Route path="/employee/goals" element={
        <PrivateRoute roles={['employee']}>
          <GoalSheet />
        </PrivateRoute>
      } />
      <Route path="/employee/checkin" element={
        <PrivateRoute roles={['employee']}>
          <CheckIn />
        </PrivateRoute>
      } />

      {/* Manager Routes */}
      <Route path="/manager/dashboard" element={
        <PrivateRoute roles={['manager']}>
          <TeamDashboard />
        </PrivateRoute>
      } />
      <Route path="/manager/approval" element={
        <PrivateRoute roles={['manager']}>
          <ApprovalView />
        </PrivateRoute>
      } />
      <Route path="/manager/checkin" element={
        <PrivateRoute roles={['manager']}>
          <ManagerCheckIn />
        </PrivateRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <PrivateRoute roles={['admin']}>
          <AdminDashboard />
        </PrivateRoute>
      } />
      <Route path="/admin/audit" element={
        <PrivateRoute roles={['admin']}>
          <AuditLog />
        </PrivateRoute>
      } />
      <Route path="/admin/reports" element={
        <PrivateRoute roles={['admin']}>
          <Reports />
        </PrivateRoute>
      } />
      <Route path="/admin/cycles" element={
        <PrivateRoute roles={['admin']}>
          <CycleManagement />
        </PrivateRoute>
      } />
      <Route path="/admin/analytics" element={
        <PrivateRoute roles={['admin']}>
           <Analytics />
        </PrivateRoute>
      } />

      {/* Default redirect based on role */}
      <Route path="/" element={
        user?.role === 'employee' ? <Navigate to="/employee/goals" /> :
        user?.role === 'manager' ? <Navigate to="/manager/dashboard" /> :
        user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> :
        <Navigate to="/login" />
      } />
    </Routes>
   </> 
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        
      <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;