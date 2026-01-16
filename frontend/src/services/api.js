import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'Network Error';
    
    console.error('API Error:', {
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
    });
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
    });
  }
);

// Module API calls
export const getCommonModules = () => api.get('/modules/common');
export const getAllSpecializations = () => api.get('/specializations');
export const getSpecializationModules = (code) => api.get(`/specializations/${code}/modules`);

// GPA Calculation API call
export const calculateGPA = (grades) => api.post('/calculate/gpa', { grades });

// Export default instance
export default api;