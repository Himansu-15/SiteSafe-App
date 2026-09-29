import api from './axios';

export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  exportCsv: async () => {
    const response = await api.get('/incidents/export.csv', {
      responseType: 'blob', // Important for file download
    });
    
    // Create a blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'incidents.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
