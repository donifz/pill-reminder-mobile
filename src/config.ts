export const config = {
  development: {
    apiUrl: 'http://13.126.213.177:3000',
  },
  production: {
    apiUrl: 'http://13.126.213.177:3000',
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