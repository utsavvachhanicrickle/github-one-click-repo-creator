const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

// Axios-like response interceptor wrapper around fetch
async function request(url, options = {}) {
  let finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  if (options.method === 'GET' || !options.method) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}_t=${Date.now()}`;
  }

  const defaultHeaders = {
    'Accept': 'application/json',
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...options.headers
  };

  const fetchOptions = {
    credentials: 'include',
    ...options,
    headers: defaultHeaders
  };

  try {
    const res = await fetch(finalUrl, fetchOptions);

    if (res.status === 401 && !options._retry && !url.includes('/api/auth/me')) {
      options._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(request(url, options)),
            reject,
          });
        });
      }

      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
          processQueue();
          resolve(request(url, options));
        } catch (err) {
          processQueue(err);
          
          // Clear session data and trigger Redux logout updates
          import('../store/index').then((m) => {
             m.store.dispatch({ type: 'auth/setAuthData', payload: null });
             m.store.dispatch({
               type: 'toast/showToast',
               payload: { message: 'Session expired. Please log in again.', type: 'error' }
             });
          });
          reject(err);
        } finally {
          isRefreshing = false;
        }
      });
    }

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    const axiosResponse = {
      data,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      config: options
    };

    if (!res.ok) {
      const axiosError = new Error(data.message || 'API request failed');
      axiosError.response = axiosResponse;
      throw axiosError;
    }

    return axiosResponse;
  } catch (error) {
    console.error(`[API Service] Request Error on ${url}:`, error);
    throw error;
  }
}

const API = {
  get: (url, config) => request(url, { ...config, method: 'GET' }),
  post: (url, data, config) => request(url, {
    ...config,
    method: 'POST',
    body: (data instanceof FormData || typeof data === 'string') ? data : JSON.stringify(data)
  }),
  put: (url, data, config) => request(url, {
    ...config,
    method: 'PUT',
    body: (data instanceof FormData || typeof data === 'string') ? data : JSON.stringify(data)
  }),
  delete: (url, config) => request(url, { ...config, method: 'DELETE' }),
  interceptors: {
    response: {
      use: () => {} // Mock interface for compatibility
    }
  }
};

export default API;
