import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
}); 

axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user')); 
    if (user && user.token) { 
      config.headers['Authorization'] = `Bearer ${user.token}`; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
