import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add a request interceptor
axios.interceptors.request.use(
  async (config) => {
    // Get the token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Remove the token if it's expired or invalid
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
); 