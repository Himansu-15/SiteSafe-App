import api from './axios';

export const incidentApi = {
  getIncidents: async (params) => {
    const response = await api.get('/incidents', { params });
    return response.data;
  },
  
  createIncident: async (formData) => {
    const response = await api.post('/incidents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getIncidentById: async (id) => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/incidents/${id}/status`, { status });
    return response.data;
  },
  getActions: async (incidentId) => {
    const response = await api.get(`/incidents/${incidentId}/actions`);
    return response.data;
  },
  createAction: async (incidentId, data) => {
    const response = await api.post(`/incidents/${incidentId}/actions`, data);
    return response.data;
  },
  getAuditLogs: async (entityType, entityId) => {
    const response = await api.get(`/audit/${entityType}/${entityId}`);
    return response.data;
  }
};
