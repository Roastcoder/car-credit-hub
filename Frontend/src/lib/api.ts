const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const headers: any = { ...options.headers };
    
    // Only set Content-Type to application/json if body is NOT FormData
    // When body is FormData, browser needs to set its own Content-Type with boundary
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    } else if (!options.body) {
      // Default for GET/DELETE without body
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

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
  signup: (name: string, email: string, password: string, role?: string, branchId?: string, referredBy?: string) =>
    api.post('/auth/signup', { name, email, password, role, branch_id: branchId, referred_by: referredBy }),
  requestOTP: (phone: string, purpose: 'login' | 'signup' = 'login') => api.post('/auth/request-otp', { phone, purpose }),
  verifyOTP: (data: { 
    phone: string; 
    otp: string; 
    purpose: 'login' | 'signup';
    name?: string;
    email?: string;
    password?: string;
    branch_id?: string | number;
    referred_by?: string;
  }) => api.post('/auth/verify-otp', data),
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
  getAll: (params?: any) => api.get('/users' + (params ? `?${new URLSearchParams(params)}` : '')),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  updateRole: (id: number, data: any) => api.put(`/users/${id}/role`, data),
  resetPassword: (id: number, newPassword: string) => api.put(`/users/${id}/password`, { newPassword }),
  delete: (id: number) => api.delete(`/users/${id}`),
  updateProfile: (data: FormData | { name?: string; phone?: string }) => 
    api.request('/users/me/profile', { 
      method: 'PUT', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
  changePassword: (data: any) => api.put('/users/me/change-password', data),
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

// Schemes API
export const schemesAPI = {
  getAll: () => api.get('/schemes'),
  create: (data: any) => api.post('/schemes', data),
  update: (id: number | string, data: any) => api.put(`/schemes/${id}`, data),
  delete: (id: number | string) => api.delete(`/schemes/${id}`),
};

// Vehicle Models API
export const vehicleModelsAPI = {
  getMakes: () => api.get('/vehicle-models/makes'),
  createMake: (data: any) => api.post('/vehicle-models/makes', data),
  deleteMake: (id: number | string) => api.delete(`/vehicle-models/makes/${id}`),
  getAll: (params?: any) => api.get('/vehicle-models' + (params ? `?${new URLSearchParams(params)}` : '')),
  create: (data: any) => api.post('/vehicle-models', data),
  update: (id: number | string, data: any) => api.put(`/vehicle-models/${id}`, data),
  delete: (id: number | string) => api.delete(`/vehicle-models/${id}`),
};

// Subvention Grid API
export const subventionAPI = {
  getAll: () => api.get('/subvention'),
  create: (data: any) => api.post('/subvention', data),
  update: (id: number | string, data: any) => api.put(`/subvention/${id}`, data),
  delete: (id: number | string) => api.delete(`/subvention/${id}`),
  calculate: (data: any) => api.post('/subvention/calculate', data),
};

// External APIs (Proxied via backend)
export const externalAPI = {
  fetchRCData: (rcNumber: string) => api.post('/external/surepass/rc', { id_number: rcNumber, enrich: true }),
  fetchRCFullData: async (rcNumber: string) => {
    try {
      return await api.post('/external/surepass/rc-full', { id_number: rcNumber });
    } catch (error: any) {
      // Some deployed backends may still expose only the older RC proxy route.
      if (error?.message === 'Route not found') {
        return api.post('/external/surepass/rc', { id_number: rcNumber, enrich: true });
      }
      throw error;
    }
  },
  fetchChallanData: (params: { rc_number: string, chassis_number: string, engine_number: string }) => 
    api.post('/external/surepass/challan', params),
  fetchCreditReport: (params: { 
    provider: string; 
    loan_id?: string | number;
    name?: string; 
    mobile?: string; 
    pan?: string; 
    aadhaar?: string;
    id_number?: string;
    id_type?: string;
    gender?: string;
  }) => api.post('/external/surepass/credit-report', params),
  getLogs: () => api.get('/external/logs'),
  getVehicleCache: (vehicleNumber: string) => api.get(`/external/vehicle/${vehicleNumber}`),
};

// Credit Reports API
export const creditReportsAPI = {
  getAll: (params?: any) => api.get('/credit-reports' + (params ? `?${new URLSearchParams(params)}` : '')),
  getLoanReports: (loanId: string | number) => api.get(`/credit-reports/loan/${loanId}`),
  delete: (id: string | number) => api.delete(`/credit-reports/${id}`),
};

// Account Department API
export const accountAPI = {
  getOverview: (v = Date.now()) => api.get(`/account/overview?v=${v}`),
  getReceivables: (v = Date.now()) => api.get(`/account/receivables?v=${v}`),
  getPayables: (v = Date.now()) => api.get(`/account/payables?v=${v}`),
  getLedger: (params?: any) => {
    const queryParams = new URLSearchParams(params);
    queryParams.append('v', Date.now().toString());
    return api.get('/account/ledger' + `?${queryParams}`);
  },
  getChartOfAccounts: (v = Date.now()) => api.get(`/account/chart-of-accounts?v=${v}`),
  createReceivable: (data: any) => api.post('/account/receivables', data),
  createPayable: (data: any) => api.post('/account/payables', data),
  generateReport: (params: any) => {
    const queryParams = new URLSearchParams(params);
    queryParams.append('v', Date.now().toString());
    return api.get('/account/reports' + `?${queryParams}`);
  },
};

// Payment Applications API
export const paymentApplicationAPI = {
  getAll: (v = Date.now()) => api.get(`/payments/applications?v=${v}`),
  getById: (id: number, v = Date.now()) => api.get(`/payments/applications/${id}?v=${v}`),
  create: (data: any) => api.post('/payments/applications', data),
  update: (id: number, data: any) => api.put(`/payments/applications/${id}`, data),
  managerAction: (id: number, action: string, remarks?: string) => 
    api.post(`/payments/applications/${id}/manager-action`, { action, remarks }),
  addUTR: (id: number, utr_number: string, extra?: { amount: number; narration?: string }) => 
    api.post(`/payments/applications/${id}/utr`, { utr_number, ...extra }),
  saveLedger: (id: number, ledger_entries: any[]) =>
    api.post(`/payments/applications/${id}/ledger`, { ledger_entries }),
  initiateAadhaarVerification: (id: number, aadhaar_number: string) => 
    api.post(`/payments/applications/${id}/aadhaar-verify/initiate`, { aadhaar_number }),
  verifyAadhaarOTP: (id: number, otp: string) => 
    api.post(`/payments/applications/${id}/aadhaar-verify/otp`, { otp }),
  uploadProof: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    try {
      return await api.request(`/payments/applications/${id}/payment-proof`, {
        method: 'POST',
        headers: {}, // fetch will set boundary for FormData
        body: formData
      });
    } catch (error: any) {
      if (!String(error?.message || '').includes('Not Found')) {
        throw error;
      }

      const fallbackFormData = new FormData();
      fallbackFormData.append('document', file);
      return api.request(`/payments/${id}/payment-proof`, {
        method: 'POST',
        headers: {},
        body: fallbackFormData
      });
    }
  },
  getPddDocuments: (loanId: string) => api.get(`/loans/${loanId}/pdd-documents`),
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
  uploadPaymentProof: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    try {
      return await api.request(`/payments/applications/${id}/payment-proof`, {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type to let browser set it with boundary
      });
    } catch (error: any) {
      if (!String(error?.message || '').includes('Not Found')) {
        throw error;
      }

      const fallbackFormData = new FormData();
      fallbackFormData.append('document', file);
      return api.request(`/payments/${id}/payment-proof`, {
        method: 'POST',
        body: fallbackFormData,
        headers: {}
      });
    }
  },
  getAccountantStats: () => api.get('/payments/stats/accountant'),
};

// Permissions API
export const permissionsAPI = {
  getAllUsers: () => api.get('/permissions/users'),
  getByUserId: (userId: number | string) => api.get(`/permissions/user/${userId}`),
  update: (userId: number | string, permissions: any) => api.put(`/permissions/user/${userId}`, { permissions }),
};

// SMS API
export const smsAPI = {
  getBalance: () => api.get('/sms/balance'),
  sendTest: (data: { mobile: string; message: string }) => api.post('/sms/test', data),
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
