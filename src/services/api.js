import axios from 'axios';

const LS_API_BASE = 'fg_api_base';
const LS_TOKEN = 'fg_token';

export function getApiBase() {
  const fromLS = localStorage.getItem(LS_API_BASE);
  return fromLS || import.meta.env.VITE_API_BASE || 'http://localhost:3001';
}
export function setApiBase(url) { localStorage.setItem(LS_API_BASE, url); }

export const api = axios.create({ baseURL: getApiBase(), timeout: 15000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem(LS_TOKEN);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) localStorage.removeItem(LS_TOKEN);
    return Promise.reject(err);
  }
);

export function setToken(token){
  if (token) localStorage.setItem(LS_TOKEN, token);
  else localStorage.removeItem(LS_TOKEN);
}
export function getToken(){ return localStorage.getItem(LS_TOKEN); }
