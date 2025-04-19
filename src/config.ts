export const config = {
  development: {
    // Use your machine's local IP address instead of localhost
    apiUrl: 'http://13.126.213.177:3000', // Your actual local IP address
  },
  production: {
    apiUrl: 'http://13.126.213.177:3000',
  },
};

export const getApiUrl = () => {
  try {
    // In development mode, use development URL
    if (__DEV__) {
      console.log('Using development API URL:', config.development.apiUrl);
      return config.development.apiUrl;
    }
    
    // In production, use production URL
    console.log('Using production API URL:', config.production.apiUrl);
    return config.production.apiUrl;
  } catch (error) {
    console.error('Error getting API URL:', error);
    // Fallback to production URL if there's an error
    return config.production.apiUrl;
  }
}; 