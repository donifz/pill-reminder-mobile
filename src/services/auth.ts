import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config';

const API_URL = getApiUrl(); // Update this with your backend URL

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
}

const TOKEN_KEY = 'auth_token';

export const authService = {
  setToken: async (token: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  getToken: async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  removeToken: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    const { token, user } = response.data;
    await authService.setToken(token);
    return { token, user };
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    const { token, user } = response.data;
    await authService.setToken(token);
    return { token, user };
  },

  logout: async () => {
    await authService.removeToken();
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = await authService.getToken();
      if (!token) return null;

      const response = await axios.get(`${API_URL}/auth/me`);
      return response.data;
    } catch (error) {
      await authService.removeToken();
      return null;
    }
  },
}; 