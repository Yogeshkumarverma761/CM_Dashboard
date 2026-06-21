// ============================================================
// apiClient.js — Replaces supabaseClient.js
// All API calls go through the Express backend on port 3001.
// JWT token is stored in localStorage for session persistence.
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Export isMock = false since we're always using live API now
export const isMock = false;

// ─── Token Helpers ─────────────────────────────────────────
export const getToken = () => localStorage.getItem('delhi_cm_token');
export const setToken = (token) => localStorage.setItem('delhi_cm_token', token);
export const clearToken = () => localStorage.removeItem('delhi_cm_token');

// ─── Base Fetch Wrapper ────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ─── API Methods ────────────────────────────────────────────
export const apiClient = {
  get: (path, queryParams = {}) => {
    const params = new URLSearchParams(
      Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return apiFetch(params ? `${path}?${params}` : path);
  },

  post: (path, body) => apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  patch: (path, body) => apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body)
  }),

  delete: (path) => apiFetch(path, {
    method: 'DELETE'
  })
};

export default apiClient;
