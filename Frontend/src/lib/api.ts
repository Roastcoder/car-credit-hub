const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('Frontend connecting to API at:', API_URL);

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
      (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'API Error');
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

// Auth API
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  signup: (name: string, email: string, password: string, role?: string, branchId?: string) =>
    api.post('/auth/signup', { name, email, password, role, branch_id: branchId }),
  getProfile: () => api.get('/auth/profile'),
};

// Loans API
export const loansAPI = {
  getAll: (params?: any) => api.get('/loans' + (params ? `?${new URLSearchParams(params)}` : '')),
  getById: (id: string | number) => api.get(`/loans/${id}`),
  create: (data: any) => api.post('/loans', data),
  update: (id: string | number, data: any) => api.put(`/loans/${id}`, data),
  delete: (id: string | number) => api.delete(`/loans/${id}`),
  performWorkflowAction: (id: string | number, action: string, remarks?: string) =>
    api.post(`/loans/${id}/workflow`, { action, remarks }),
  getAuditLogs: (id: string | number) => api.get(`/loans/${id}/audit-logs`),
  getLastLoanNumber: () => api.get('/loans/last-number'),
};

// Banks API
export const banksAPI = {
  getAll: () => api.get('/banks'),
  getById: (id: number) => api.get(`/banks/${id}`),
  create: (data: any) => api.post('/banks', data),
  update: (id: number, data: any) => api.put(`/banks/${id}`, data),
  delete: (id: number) => api.delete(`/banks/${id}`),
};

// Brokers API
export const brokersAPI = {
  getAll: () => api.get('/brokers'),
  getById: (id: number) => api.get(`/brokers/${id}`),
  create: (data: any) => api.post('/brokers', data),
  update: (id: number, data: any) => api.put(`/brokers/${id}`, data),
  delete: (id: number) => api.delete(`/brokers/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Leads API
export const leadsAPI = {
  getAll: (params?: any) => api.get('/leads' + (params ? `?${new URLSearchParams(params)}` : '')),
  getById: (id: string | number) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string | number, data: any) => api.put(`/leads/${id}`, data),
  delete: (id: string | number) => api.delete(`/leads/${id}`),
};

// Commissions API
export const commissionsAPI = {
  getAll: () => api.get('/commissions'),
  getById: (id: number) => api.get(`/commissions/${id}`),
  create: (data: any) => api.post('/commissions', data),
  update: (id: number, data: any) => api.put(`/commissions/${id}`, data),
  delete: (id: number) => api.delete(`/commissions/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Reports API
export const reportsAPI = {
  loans: (params?: any) => api.get('/reports/loans' + (params ? `?${new URLSearchParams(params)}` : '')),
  commissions: (params?: any) => api.get('/reports/commissions' + (params ? `?${new URLSearchParams(params)}` : '')),
  sales: () => api.get('/reports/sales'),
};

// Branches API
export const branchesAPI = {
  getAll: () => api.get('/branches'),
  getById: (id: number) => api.get(`/branches/${id}`),
  create: (data: any) => api.post('/branches', data),
  update: (id: number, data: any) => api.put(`/branches/${id}`, data),
  delete: (id: number) => api.delete(`/branches/${id}`),
};

// Financers API
export const financersAPI = {
  getAll: () => api.get('/financers'),
  getById: (id: number) => api.get(`/financers/${id}`),
  create: (data: any) => api.post('/financers', data),
  update: (id: number, data: any) => api.put(`/financers/${id}`, data),
  delete: (id: number) => api.delete(`/financers/${id}`),
};

// External APIs (Proxied via backend)
export const externalAPI = {
  fetchRCData: (rcNumber: string) => api.post('/external/surepass/rc', { id_number: rcNumber, enrich: true }),
};

// Account Department API
export const accountAPI = {
  getOverview: () => api.get('/account/overview'),
  getReceivables: () => api.get('/account/receivables'),
  getPayables: () => api.get('/account/payables'),
  getLedger: (params?: any) => api.get('/account/ledger' + (params ? `?${new URLSearchParams(params)}` : '')),
  getChartOfAccounts: () => api.get('/account/chart-of-accounts'),
  createReceivable: (data: any) => api.post('/account/receivables', data),
  createPayable: (data: any) => api.post('/account/payables', data),
  generateReport: (params: any) => api.get('/account/reports' + `?${new URLSearchParams(params)}`),
};

// Payment Applications API
export const paymentApplicationAPI = {
  getAll: () => api.get('/payments/applications'),
  getById: (id: number) => api.get(`/payments/applications/${id}`),
  create: (data: any) => api.post('/payments/applications', data),
  managerAction: (id: number, action: string, remarks?: string) => 
    api.post(`/payments/applications/${id}/manager-action`, { action, remarks }),
  addUTR: (id: number, utr_number: string) => 
    api.post(`/payments/applications/${id}/utr`, { utr_number }),
  getPddDocuments: (loanId: string) => api.get(`/payments/loans/${loanId}/pdd-documents`),
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.request('/payments/upload-document', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it with boundary
    });
  },
  createVoucher: (data: any) => api.post('/payments/vouchers', data),
  getNextVoucherNumber: () => api.get('/payments/vouchers/next-number'),
  uploadPaymentProof: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.request(`/payments/applications/${id}/payment-proof`, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it with boundary
    });
  },
  getAccountantStats: () => api.get('/payments/stats/accountant'),
};

// Legacy supabase compatibility shim (for components using supabase.auth.*)
export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const data = await authAPI.login(email, password);
        if (data.token) api.setToken(data.token);
        return { data: { user: data.user }, error: null };
      } catch (error: any) {
        return { data: { user: null }, error: { message: error.message } };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        await authAPI.signup(options?.data?.full_name || 'User', email, password);
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    },
    signOut: async () => {
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
};
