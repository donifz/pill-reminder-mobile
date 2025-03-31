import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// For Android emulator
const API_URL = 'http://10.0.2.2:3001';
// For iOS simulator
// const API_URL = 'http://localhost:3001';
// For physical device, use your machine's local IP address:
// const API_URL = 'http://192.168.1.X:3001';

export type User = {
  id: string;
  name: string;
  email: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
};

class AuthService {
  private async setToken(token: string) {
    try {
      await AsyncStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Error setting token:', error);
      throw error;
    }
  }

  private async removeToken() {
    try {
      await AsyncStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<User> {
    try {
      console.log('Attempting login with:', { email: data.email });
      console.log('API URL:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, data, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Login response:', response.data);
      
      // Check if we have the expected data structure
      if (!response.data.access_token) {
        throw new Error('Invalid response: missing access token');
      }

      await this.setToken(response.data.access_token);
      return response.data.user;
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Register response:', response.data);

      if (!response.data.access_token) {
        throw new Error('Invalid response: missing access token');
      }

      await this.setToken(response.data.access_token);
      return response.data.user;
    } catch (error: any) {
      console.error('Register error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return null;

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/auth/me`);
      return response.data;
    } catch (error) {
      await this.removeToken();
      return null;
    }
  }
}

export const authService = new AuthService(); 