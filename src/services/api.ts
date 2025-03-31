import axios from 'axios';

const API_URL = 'http://localhost:3001'; // Update this with your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Medication {
  id: string;
  name: string;
  dose: string;
  times: string[];
  taken: boolean;
  startDate: string;
  endDate: string;
  duration: number;
}

export const medicationService = {
  getAll: async (): Promise<Medication[]> => {
    const response = await api.get('/medications');
    return response.data;
  },

  create: async (data: Omit<Medication, 'id' | 'taken'>): Promise<Medication> => {
    const response = await api.post('/medications', data);
    return response.data;
  },

  take: async (id: string): Promise<Medication> => {
    const response = await api.post(`/medications/${id}/take`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/medications/${id}`);
  },
}; 