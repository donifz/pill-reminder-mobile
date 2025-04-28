import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config';

// Use the same API_URL as other services
const API_URL = getApiUrl();

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

class DoctorService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getDoctors(): Promise<Doctor[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      try {
        const response = await axios.get<Doctor[]>(`${API_URL}/doctors`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching doctors, using mock data:', error);
        return this.getMockDoctors();
      }
    } catch (error: any) {
      console.error('Get doctors error:', error);
      return this.getMockDoctors();
    }
  }

  async getDoctorById(id: string): Promise<Doctor> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      try {
        const response = await axios.get<Doctor>(`${API_URL}/doctors/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching doctor details, using mock data:', error);
        const mockDoctor = this.getMockDoctors().find(d => d.id === id);
        if (!mockDoctor) throw new Error('Doctor not found');
        return mockDoctor;
      }
    } catch (error: any) {
      console.error('Get doctor by id error:', error);
      throw error;
    }
  }

  async getAppointments(): Promise<Appointment[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      try {
        const response = await axios.get<Appointment[]>(`${API_URL}/appointments`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching appointments, using mock data:', error);
        return this.getMockAppointments();
      }
    } catch (error: any) {
      console.error('Get appointments error:', error);
      return this.getMockAppointments();
    }
  }

  async getUpcomingAppointment(): Promise<Appointment | null> {
    try {
      const appointments = await this.getAppointments();
      const upcomingAppointments = appointments
        .filter(a => a.status === 'scheduled')
        .sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
      
      return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
    } catch (error) {
      console.error('Error getting upcoming appointment:', error);
      return null;
    }
  }

  // Mock data for when API fails
  private getMockDoctors(): Doctor[] {
    return [
      {
        id: '1',
        name: 'Sarah Johnson',
        specialty: 'Cardiologist',
        phone: '(555) 123-4567',
        email: 'sjohnson@example.com',
        imageUrl: 'https://randomuser.me/api/portraits/women/43.jpg'
      },
      {
        id: '2',
        name: 'Michael Chen',
        specialty: 'Neurologist',
        phone: '(555) 987-6543',
        email: 'mchen@example.com',
        imageUrl: 'https://randomuser.me/api/portraits/men/76.jpg'
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        specialty: 'Dermatologist',
        phone: '(555) 246-8101',
        email: 'erodriguez@example.com',
        imageUrl: 'https://randomuser.me/api/portraits/women/28.jpg'
      }
    ];
  }

  private getMockAppointments(): Appointment[] {
    const doctors = this.getMockDoctors();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return [
      {
        id: '1',
        doctor: doctors[0],
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        notes: 'Annual checkup',
        status: 'scheduled'
      },
      {
        id: '2',
        doctor: doctors[1],
        date: nextWeek.toISOString().split('T')[0],
        time: '14:30',
        notes: 'Follow-up consultation',
        status: 'scheduled'
      },
      {
        id: '3',
        doctor: doctors[2],
        date: today.toISOString().split('T')[0],
        time: '09:15',
        notes: 'Skin examination',
        status: 'completed'
      }
    ];
  }
}

export const doctorService = new DoctorService(); 