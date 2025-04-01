export const config = {
  development: {
    apiUrl: 'http://localhost:3001',
  },
  production: {
    apiUrl: 'https://pill-reminder-backend.onrender.com',
  },
};

export const getApiUrl = () => {
  // In production builds, always use production URL
  if (process.env.NODE_ENV === 'production') {
    return config.production.apiUrl;
  }
  // In development, use development URL
  return config.development.apiUrl;
}; 