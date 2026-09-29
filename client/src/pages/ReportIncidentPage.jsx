import { useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem, Paper } from '@mui/material';
import { incidentApi } from '../api/incidents';
import { useNavigate } from 'react-router-dom';

export function ReportIncidentPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'injury',
    severity: 'low',
    siteId: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) {
        data.append('attachments', file);
      }
      await incidentApi.createIncident(data);
      navigate('/incidents');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit incident');
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Report Incident</Typography>
        
        {error && <Typography color="error" gutterBottom>{error}</Typography>}
        
        <form onSubmit={handleSubmit}>
          <TextField fullWidth margin="normal" label="Title" name="title" value={formData.title} onChange={handleChange} required minLength={5} />
          
          <TextField fullWidth margin="normal" label="Description" name="description" multiline rows={4} value={formData.description} onChange={handleChange} required minLength={10} />
          
          <TextField fullWidth margin="normal" select label="Type" name="type" value={formData.type} onChange={handleChange}>
            <MenuItem value="injury">Injury</MenuItem>
            <MenuItem value="near_miss">Near Miss</MenuItem>
            <MenuItem value="hazard">Hazard</MenuItem>
          </TextField>
          
          <TextField fullWidth margin="normal" select label="Severity" name="severity" value={formData.severity} onChange={handleChange}>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
          
          <TextField fullWidth margin="normal" label="Site ID (Mock)" name="siteId" value={formData.siteId} onChange={handleChange} required />
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Attachments (Optional Image)</Typography>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" type="submit">Submit</Button>
            <Button variant="outlined" onClick={() => navigate('/dashboard')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
