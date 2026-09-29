import { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { incidentApi } from '../api/incidents';
import { useNavigate } from 'react-router-dom';

export function IncidentListPage() {
  const [incidents, setIncidents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const navigate = useNavigate();

  const fetchIncidents = async (currentCursor = null, replace = false) => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (currentCursor) params.cursor = currentCursor;
      
      const { data } = await incidentApi.getIncidents(params);
      
      if (replace) {
        setIncidents(data.incidents);
      } else {
        setIncidents((prev) => [...prev, ...data.incidents]);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    }
  };

  useEffect(() => {
    fetchIncidents(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, severityFilter]);

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchIncidents(nextCursor);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Incidents</Typography>
        <Button variant="contained" onClick={() => navigate('/incidents/new')}>Report Incident</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="reported">Reported</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="action_pending">Action Pending</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Severity</InputLabel>
          <Select value={severityFilter} label="Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.map((inc) => (
              <TableRow key={inc._id} hover onClick={() => navigate(`/incidents/${inc._id}`)} sx={{ cursor: 'pointer' }}>
                <TableCell>{inc.title}</TableCell>
                <TableCell>{inc.type}</TableCell>
                <TableCell>
                  <Chip size="small" label={inc.severity} color={getSeverityColor(inc.severity)} />
                </TableCell>
                <TableCell>{inc.status}</TableCell>
                <TableCell>{new Date(inc.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No incidents found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      
      {nextCursor && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={handleLoadMore}>Load More</Button>
        </Box>
      )}
    </Box>
  );
}
