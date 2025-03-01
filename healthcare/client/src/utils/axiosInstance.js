import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', 
});

axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user')); 
    console.log("this is user" , user);
    if (user && user.token) { 
      config.headers['Authorization'] = `Bearer ${user.token}`; 
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

export default axiosInstance;
