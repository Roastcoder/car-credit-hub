const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let authToken: string | null = localStorage.getItem('auth_token');

export const api = {
  setToken(token: string | null) {
    authToken = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const data = await api.post('/auth.php?action=login', { email, password });
      if (data.token) {
        api.setToken(data.token);
      }
      return { data: { user: data.user }, error: data.error ? { message: data.error } : null };
    },
    signUp: async ({ email, password, options }: any) => {
      const data = await api.post('/auth.php?action=signup', {
        email,
        password,
        full_name: options?.data?.full_name,
      });
      return { error: data.error ? { message: data.error } : null };
    },
    signOut: async () => {
      await api.post('/auth.php?action=logout', {});
      api.setToken(null);
      return {};
    },
    getSession: async () => {
      return { data: { session: authToken ? { user: {} } : null } };
    },
    onAuthStateChange: (callback: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          const data = await api.get(`/${table}.php?${column}=${value}`);
          return { data, error: null };
        },
        order: (column: string, options: any) => ({
          limit: (n: number) => ({
            single: async () => {
              const data = await api.get(`/${table}.php?${column}=${value}`);
              return { data, error: null };
            },
          }),
        }),
      }),
      order: (column: string, options: any) => ({
        limit: async (n: number) => {
          const data = await api.get(`/${table}.php`);
          return { data, error: null };
        },
      }),
    }),
    insert: async (data: any) => {
      const result = await api.post(`/${table}.php`, data);
      return { error: result.success ? null : { message: 'Insert failed' } };
    },
    update: async (data: any) => ({
      eq: async (column: string, value: any) => {
        const result = await api.put(`/${table}.php?id=${value}`, data);
        return { error: result.success ? null : { message: 'Update failed' } };
      },
    }),
    delete: () => ({
      eq: async (column: string, value: any) => {
        const result = await api.delete(`/${table}.php?id=${value}`);
        return { error: result.success ? null : { message: 'Delete failed' } };
      },
    }),
  }),
};
