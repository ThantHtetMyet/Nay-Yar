import axios from 'axios';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5010/api' : 'http://localhost:5010/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (userID, password) => {
  try {
    const response = await api.post('/login', { userID, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getListings = async () => {
  try {
    const response = await api.get('/listings');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export default api;
