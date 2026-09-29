import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, AppBar, Toolbar, IconButton, Menu, MenuItem, Avatar, Paper } from '@mui/material';
import { Menu as MenuIcon, Logout, Person, Dashboard as DashboardIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../store/slices/authSlice';
import { dashboardApi } from '../api/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [summary, setSummary] = useState(null);

  const isManagerOrAdmin = ['manager', 'admin', 'safety_officer'].includes(user?.role);

  useEffect(() => {
    if (isManagerOrAdmin) {
      dashboardApi.getSummary().then(res => setSummary(res.data)).catch(console.error);
    }
  }, [isManagerOrAdmin]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleExportCsv = async () => {
    try {
      await dashboardApi.exportCsv();
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  const roleColors = {
    reporter: 'info',
    safety_officer: 'success',
    manager: 'warning',
    admin: 'error',
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppBar position="static" elevation={0} sx={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
            SiteSafe
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <select 
              value={i18n.language} 
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
            <Chip label={t(`roles.${user?.role}`)} color={roleColors[user?.role] || 'default'} size="small" />
            <IconButton onClick={handleMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          {t('auth.logout')}
        </MenuItem>
      </Menu>

      <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>{t('dashboard.welcome')}, {user?.name}</Typography>
            <Typography variant="body1" color="text.secondary">
              {t('dashboard.loggedInAs')} <strong>{t(`roles.${user?.role}`)}</strong> {t('dashboard.inOrg')} <strong>{user?.orgId}</strong>
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button variant="contained" color="primary" onClick={() => navigate('/incidents/new')}>{t('dashboard.reportIncident')}</Button>
            <Button variant="outlined" onClick={() => navigate('/incidents')}>{t('dashboard.viewIncidents')}</Button>
            {isManagerOrAdmin && (
              <Button variant="outlined" color="secondary" startIcon={<DownloadIcon />} onClick={handleExportCsv}>
                {t('dashboard.exportCsv')}
              </Button>
            )}
          </Box>
        </Box>

        {isManagerOrAdmin && summary && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{t('dashboard.overdueActions')}</Typography>
                  <Typography variant="h2" color="error.main" fontWeight="bold">
                    {summary.overdueActions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{t('dashboard.incidentsBySeverity')}</Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.incidentsBySeverity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name={t('dashboard.incidentCount')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{t('dashboard.topSites')}</Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.topSites} layout="vertical" margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="_id" type="category" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#ffc658" name={t('dashboard.incidents')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{t('dashboard.incidentTrend')}</Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={summary.trendOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#82ca9d" name={t('dashboard.incidents')} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}