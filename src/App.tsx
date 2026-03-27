import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import DashboardRedirect from "@/components/DashboardRedirect";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import AccountDashboard from "@/pages/AccountDashboard";
import AccountsReceivable from "@/pages/AccountsReceivable";
import AccountsPayable from "@/pages/AccountsPayable";
import GeneralLedger from "@/pages/GeneralLedger";
import FinancialReports from "@/pages/FinancialReports";
import PaymentApplicationForm from "@/pages/PaymentApplicationForm";
import PaymentApplicationsList from "@/pages/PaymentApplicationsList";
import PaymentVoucherForm from "@/pages/PaymentVoucherForm";
import Loans from "@/pages/Loans";
import CreateLoan from "@/pages/CreateLoan";
import LoanDetail from "@/pages/LoanDetail";
import UserManagement from "@/pages/UserManagement";
import BankManagement from "@/pages/BankManagement";
import BrokerManagement from "@/pages/BrokerManagement";
import BranchManagement from "@/pages/BranchManagement";
import Commission from "@/pages/Commission";
import Reports from "@/pages/Reports";
import AddLead from "@/pages/AddLead";
import LeadsList from "@/pages/LeadsList";
import LeadDetail from "@/pages/LeadDetail";
import BroadcastNotification from "@/pages/BroadcastNotification";
import PDDTracking from "@/pages/PDDTracking";
import Payments from "@/pages/Payments";
import CreatePaymentApplication from "@/pages/CreatePaymentApplication";
import CreatePaymentVoucher from "@/pages/CreatePaymentVoucher";
import PaymentDetail from "@/pages/PaymentDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  const auth = useAuth();
  if (!auth || auth.isLoading) return null;
  const { user } = auth;
  return (
    <Routes>
      <Route path="/login" element={user ? <DashboardRedirect /> : <Login />} />
      <Route path="/signup" element={user ? <DashboardRedirect /> : <Signup />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'bank', 'broker', 'employee']}>
            <Dashboard />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Account Department Routes - Only for super_admin, admin, and accountant */}
      <Route path="/account" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}>
            <AccountDashboard />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/account/receivables" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}>
            <AccountsReceivable />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/account/payables" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}>
            <AccountsPayable />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/account/ledger" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}>
            <GeneralLedger />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/account/reports" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}>
            <FinancialReports />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Regular Routes */}
      <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
      <Route path="/loans/new" element={<ProtectedRoute><CreateLoan /></ProtectedRoute>} />
      <Route path="/loans/:id" element={<ProtectedRoute><LoanDetail /></ProtectedRoute>} />
      <Route path="/loans/:id/edit" element={<ProtectedRoute><CreateLoan /></ProtectedRoute>} />
      <Route path="/add-lead" element={<ProtectedRoute><AddLead /></ProtectedRoute>} />
      <Route path="/leads-list" element={<ProtectedRoute><LeadsList /></ProtectedRoute>} />
      <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/banks" element={<ProtectedRoute><BankManagement /></ProtectedRoute>} />
      <Route path="/brokers" element={<ProtectedRoute><BrokerManagement /></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute><BranchManagement /></ProtectedRoute>} />
      <Route path="/commission" element={<ProtectedRoute><Commission /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/pdd-tracking" element={<ProtectedRoute><PDDTracking /></ProtectedRoute>} />
      
      {/* Payment Routes - Available to all authenticated users */}
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/payments/new" element={<ProtectedRoute><CreatePaymentApplication /></ProtectedRoute>} />
      <Route path="/payments/loan/:loanId" element={<ProtectedRoute><CreatePaymentApplication /></ProtectedRoute>} />
      <Route path="/payments/:id" element={<ProtectedRoute><PaymentDetail /></ProtectedRoute>} />
      <Route path="/payments/:paymentId/voucher" element={<ProtectedRoute><CreatePaymentVoucher /></ProtectedRoute>} />
      
      {/* Payment Application Routes */}
      <Route path="/payments/applications" element={<ProtectedRoute><PaymentApplicationsList /></ProtectedRoute>} />
      <Route path="/payments/applications/new" element={<ProtectedRoute><PaymentApplicationForm /></ProtectedRoute>} />
      <Route path="/payments/applications/loan/:loanId" element={<ProtectedRoute><PaymentApplicationForm /></ProtectedRoute>} />
      
      {/* Account Department Voucher Routes */}
      <Route path="/account/vouchers/create/:applicationId" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}>
            <PaymentVoucherForm />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      <Route path="/broadcast" element={<ProtectedRoute><BroadcastNotification /></ProtectedRoute>} />
      <Route path="/" element={<DashboardRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
