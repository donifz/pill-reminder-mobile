import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config';

const API_URL = getApiUrl();

export interface Guardian {
  id: string;
  userId: string;
  guardianId: string;
  isAccepted: boolean;
  invitationToken: string;
  invitationExpiresAt: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  guardian?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GuardianResponse {
  id: string;
  isAccepted: boolean;
  invitationToken: string;
  invitationExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  guardian: {
    id: string;
    name: string;
    email: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AcceptInvitationParams {
  token: string;
}

class GuardianService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async inviteGuardian(email: string): Promise<Guardian> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.post(
        `${API_URL}/guardians/invite`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Invite guardian error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async acceptInvitation({ token }: AcceptInvitationParams): Promise<Guardian> {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) throw new Error('No authentication token found');

      console.log('Accepting invitation with token:', token);
      console.log('Auth token:', authToken);

      const response = await axios.post(
        `${API_URL}/guardians/accept/${token}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Accept invitation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Accept invitation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async getGuardians(): Promise<Guardian[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get(`${API_URL}/guardians`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('getGuardians response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get guardians error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async getGuardianFor(): Promise<Guardian[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get(`${API_URL}/guardians/for`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get guardian for error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async removeGuardian(guardianId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      await axios.delete(`${API_URL}/guardians/${guardianId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      console.error('Remove guardian error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }
}

export const guardianService = new GuardianService(); 