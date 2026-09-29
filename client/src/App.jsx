import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { Box } from '@mui/material';
import { fetchCurrentUser } from './store/slices/authSlice';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGate } from './components/RoleGate';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentListPage } from './pages/IncidentListPage';
import { ReportIncidentPage } from './pages/ReportIncidentPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { socket, connectSocket, disconnectSocket } from './api/socket';

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">Loading...</Box>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
      
      const handleActionAssigned = (data) => toast.info(data.message);
      const handleIncidentUpdated = (data) => toast.success(data.message);
      const handleActionOverdue = (data) => toast.error(data.message);

      socket.on('action_assigned', handleActionAssigned);
      socket.on('incident_updated', handleIncidentUpdated);
      socket.on('action_overdue', handleActionOverdue);

      return () => {
        socket.off('action_assigned', handleActionAssigned);
        socket.off('incident_updated', handleIncidentUpdated);
        socket.off('action_overdue', handleActionOverdue);
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <IncidentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents/new"
        element={
          <ProtectedRoute>
            <ReportIncidentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents/:id"
        element={
          <ProtectedRoute>
            <IncidentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}

export default function App() {
  return <AppRoutes />;
}