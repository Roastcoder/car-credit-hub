const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

let authToken: string | null = localStorage.getItem('auth_token');

// Mock user for development
const MOCK_USER = {
  id: 1,
  name: 'Admin User',
  email: 'admin@meharfinance.com',
  role: 'admin'
};

// Mock login function
const mockLogin = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple mock authentication
  if (email && password) {
    const token = 'mock-jwt-token-' + Date.now();
    return {
      token,
      user: MOCK_USER
    };
  } else {
    throw new Error('Invalid credentials');
  }
};

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
    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      return this.mockRequest(endpoint, options);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
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
    } catch (error: any) {
      // If backend is not available, fall back to mock data
      console.warn('Backend not available, using mock data:', error.message);
      return this.mockRequest(endpoint, options);
    }
  },

  async mockRequest(endpoint: string, options: RequestInit = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const method = options.method || 'GET';
    
    // Mock responses based on endpoint
    if (endpoint === '/auth/login') {
      const body = JSON.parse(options.body as string);
      return mockLogin(body.email, body.password);
    }
    
    if (endpoint === '/auth/profile') {
      return { user: MOCK_USER };
    }
    
    if (endpoint === '/dashboard/stats') {
      return {
        totalLoans: 156,
        approvedLoans: 89,
        pendingLoans: 34,
        rejectedLoans: 33,
        totalAmount: 125000000,
        monthlyGrowth: 12.5
      };
    }
    
    if (endpoint.startsWith('/loans')) {
      const { MOCK_LOANS } = await import('./mock-data');
      const { WorkflowService } = await import('./workflow');
      
      if (method === 'GET') {
        if (endpoint === '/loans') {
          // Get current user from token or mock user
          const currentUser = MOCK_USER;
          let filteredLoans = MOCK_LOANS;
          
          // Filter loans based on ownership (owner_role)
          filteredLoans = MOCK_LOANS.filter(loan => {
            // Check if loan should be visible to current user based on owner_role
            return WorkflowService.shouldShowLoanToUser(loan, currentUser.role);
          });
          
          return { data: filteredLoans, total: filteredLoans.length };
        }
        
        // Handle specific loan ID
        const loanIdMatch = endpoint.match(/\/loans\/([^/]+)$/);
        if (loanIdMatch) {
          const loanId = loanIdMatch[1];
          const loan = MOCK_LOANS.find(l => l.id === loanId || l.loan_number === loanId);
          if (loan && WorkflowService.shouldShowLoanToUser(loan, MOCK_USER.role)) {
            return { data: loan };
          }
          throw new Error('Loan not found');
        }
        
        // Handle loan status endpoint
        const statusMatch = endpoint.match(/\/loans\/([^/]+)\/status/);
        if (statusMatch) {
          const loanId = statusMatch[1];
          const loan = MOCK_LOANS.find(l => l.id === loanId);
          return { status: loan?.status || 'submitted' };
        }
        
        // Handle audit logs
        const auditMatch = endpoint.match(/\/loans\/([^/]+)\/audit-logs$/);
        if (auditMatch) {
          return { data: [] }; // Return empty audit logs for mock
        }
      }
      
      if (method === 'POST') {
        // Handle workflow actions
        const workflowMatch = endpoint.match(/\/loans\/([^/]+)\/workflow$/);
        if (workflowMatch) {
          const loanId = workflowMatch[1];
          const body = JSON.parse(options.body as string);
          
          const loan = MOCK_LOANS.find(l => l.id === loanId || l.loan_number === loanId);
          if (!loan) throw new Error('Loan not found');
          
          // Use the owner role of the current status to determine next step
          const currentOwnerRole = WorkflowService.getOwnerRole(loan.status as any);
          const result = WorkflowService.getNextStatusAndOwner(currentOwnerRole, body.action);
          
          if (!result) throw new Error(`Action '${body.action}' not valid for role '${currentOwnerRole}' at status '${loan.status}'`);
          
          // Update the mock loan in memory (for this session)
          loan.status = result.status;
          loan.owner_role = result.owner;
          
          return { 
            message: 'Workflow action performed successfully', 
            action: body.action,
            newStatus: result.status,
            newOwner: result.owner
          };
        }
      }
    }
    
    if (endpoint === '/banks') {
      const { BANKS } = await import('./mock-data');
      return { data: BANKS.map((name, index) => ({ id: index + 1, name, status: 'active' })) };
    }
    
    if (endpoint === '/financers') {
      const { FINANCERS } = await import('./mock-data');
      return { data: FINANCERS.map((name, index) => ({ id: index + 1, name, status: 'active' })) };
    }
    
    if (endpoint === '/brokers') {
      return { data: [{ id: 1, name: 'Vikram Singh', status: 'active' }] };
    }
    
    if (endpoint === '/users') {
      return { data: [MOCK_USER] };
    }
    
    if (endpoint === '/leads') {
      return { data: [] };
    }
    
    if (endpoint === '/branches') {
      return { data: [{ id: 1, name: 'Main Branch', location: 'Mumbai' }] };
    }
    
    // Default empty response
    console.log('Mock endpoint not implemented:', endpoint);
    return { data: [], message: 'Mock data not implemented for this endpoint' };
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
  getAll: () => api.get('/leads'),
  getById: (id: number) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: number, data: any) => api.put(`/leads/${id}`, data),
  delete: (id: number) => api.delete(`/leads/${id}`),
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

// Legacy supabase compatibility
export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        let data;
        if (USE_MOCK_DATA) {
          data = await mockLogin(email, password);
        } else {
          data = await authAPI.login(email, password);
        }
        
        if (data.token) {
          api.setToken(data.token);
        }
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
