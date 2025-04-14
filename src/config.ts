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
  if (__DEV__) {
    return config.development.apiUrl;
  }
  // In production, use production URL
  return config.production.apiUrl;
}; 