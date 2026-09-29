import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Alert } from '@mui/material';

export function RoleGate({ children, allowedRoles, fallback }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return fallback || <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return fallback || (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          You don't have permission to access this page. Required roles: {allowedRoles.join(', ')}
        </Alert>
      </Box>
    );
  }

  return children;
}