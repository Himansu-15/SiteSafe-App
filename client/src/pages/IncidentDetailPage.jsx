import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, Chip, Divider, List, ListItem, ListItemText, TextField } from '@mui/material';
import { useSelector } from 'react-redux';
import { incidentApi } from '../api/incidents';
import { useTranslation } from 'react-i18next';

export function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { t } = useTranslation();
  
  const [incident, setIncident] = useState(null);
  const [actions, setActions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newAction, setNewAction] = useState({ assignedTo: '', dueDate: '', notes: '' });

  const fetchData = async () => {
    try {
      const [incRes, actRes, logRes] = await Promise.all([
        incidentApi.getIncidentById(id),
        incidentApi.getActions(id),
        incidentApi.getAuditLogs('Incident', id)
      ]);
      setIncident(incRes.data.incident);
      setActions(actRes.data.actions);
      setLogs(logRes.data.logs);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await incidentApi.updateStatus(id, newStatus);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleAddAction = async (e) => {
    e.preventDefault();
    try {
      await incidentApi.createAction(id, newAction);
      setNewAction({ assignedTo: '', dueDate: '', notes: '' });
      fetchData();
    } catch (err) {
      alert('Error creating action');
    }
  };

  if (!incident) return <Typography>Loading...</Typography>;

  const canManage = user?.role === 'safety_officer' || user?.role === 'admin';
  const validTransitions = {
    'reported': 'investigating',
    'investigating': 'action_pending',
    'action_pending': 'closed',
  };
  const nextStatus = validTransitions[incident.status];

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Button onClick={() => navigate('/incidents')} sx={{ mb: 2 }}>&larr; Back</Button>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight="bold">{incident.title}</Typography>
              <Chip label={incident.status} color="primary" />
            </Box>
            <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>{incident.description}</Typography>
            
            {canManage && nextStatus && (
              <Button variant="contained" color="secondary" onClick={() => handleStatusChange(nextStatus)}>
                Transition to {nextStatus}
              </Button>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Corrective Actions</Typography>
            {actions.map(action => (
              <Box key={action._id} mb={2} p={2} border="1px solid #eee" borderRadius={2}>
                <Typography variant="subtitle2">Assigned to: {action.assignedTo?.name || action.assignedTo}</Typography>
                <Typography variant="body2">Due: {new Date(action.dueDate).toLocaleDateString()}</Typography>
                <Chip size="small" label={action.status} sx={{ mt: 1 }} />
              </Box>
            ))}
            
            {canManage && incident.status !== 'closed' && (
              <form onSubmit={handleAddAction} style={{ marginTop: '20px' }}>
                <Typography variant="subtitle1">Add New Action</Typography>
                <TextField fullWidth size="small" margin="normal" label="Assigned To (User ID)" value={newAction.assignedTo} onChange={e => setNewAction({...newAction, assignedTo: e.target.value})} required />
                <TextField fullWidth size="small" margin="normal" type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={newAction.dueDate} onChange={e => setNewAction({...newAction, dueDate: e.target.value})} required />
                <TextField fullWidth size="small" margin="normal" label="Notes" value={newAction.notes} onChange={e => setNewAction({...newAction, notes: e.target.value})} />
                <Button type="submit" variant="outlined" sx={{ mt: 1 }}>Add Action</Button>
              </form>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Timeline (Audit Log)</Typography>
            <List dense>
              {logs.map(log => (
                <ListItem key={log._id}>
                  <ListItemText 
                    primary={`${log.field} changed`}
                    secondary={`${new Date(log.timestamp).toLocaleString()} by ${log.actorId?.name || 'System'}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
