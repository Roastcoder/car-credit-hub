import { useEffect } from "react";
import { requestAllNativePermissions } from "./lib/permissions";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import DashboardRedirect from "@/components/DashboardRedirect";

// Lazy load pages to break circular dependencies and improve performance
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AccountDashboard = lazy(() => import("@/pages/AccountDashboard"));
const AccountsReceivable = lazy(() => import("@/pages/AccountsReceivable"));
const AccountsPayable = lazy(() => import("@/pages/AccountsPayable"));
const GeneralLedger = lazy(() => import("@/pages/GeneralLedger"));
const FinancialReports = lazy(() => import("@/pages/FinancialReports"));
const PaymentApplicationForm = lazy(() => import("@/pages/PaymentApplicationForm"));
const PaymentApplicationsList = lazy(() => import("@/pages/PaymentApplicationsList"));
const PaymentVoucherForm = lazy(() => import("@/pages/PaymentVoucherForm"));
const Loans = lazy(() => import("@/pages/Loans"));
const CreateLoan = lazy(() => import("@/pages/CreateLoan"));
const LoanDetail = lazy(() => import("@/pages/LoanDetail"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const BankManagement = lazy(() => import("@/pages/BankManagement"));
const BrokerManagement = lazy(() => import("@/pages/BrokerManagement"));
const MyBrokers = lazy(() => import("@/pages/MyBrokers"));
const BranchManagement = lazy(() => import("@/pages/BranchManagement"));
const Commission = lazy(() => import("@/pages/Commission"));
const Reports = lazy(() => import("@/pages/Reports"));
const AddLead = lazy(() => import("@/pages/AddLead"));
const LeadsList = lazy(() => import("@/pages/LeadsList"));
const LeadDetail = lazy(() => import("@/pages/LeadDetail"));
const BroadcastNotification = lazy(() => import("@/pages/BroadcastNotification"));
const PDDTracking = lazy(() => import("@/pages/PDDTracking"));
const Payments = lazy(() => import("@/pages/Payments"));
const CreatePaymentApplication = lazy(() => import("@/pages/CreatePaymentApplication"));
const CreatePaymentVoucher = lazy(() => import("@/pages/CreatePaymentVoucher"));
const PaymentDetail = lazy(() => import("./pages/PaymentDetail"));
const VouchersList = lazy(() => import("@/pages/VouchersList"));
const PermissionManagement = lazy(() => import("@/pages/PermissionManagement"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Download = lazy(() => import("@/pages/Download"));
const Profile = lazy(() => import("@/pages/Profile"));
const ExternalApiLogs = lazy(() => import("@/pages/ExternalApiLogs"));
const CreditReports = lazy(() => import("./pages/CreditReports"));
const SchemeManagement = lazy(() => import("./pages/SchemeManagement"));
const ModelManagement = lazy(() => import("./pages/ModelManagement"));
const SubventionGrid = lazy(() => import("./pages/SubventionGrid"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'manager', 'rbm', 'pdd_manager', 'bank', 'broker', 'employee']}>
            <Dashboard />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Account Department Routes */}
      <Route path="/account" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}>
            <AccountDashboard />
          </RoleProtectedRoute>
        </ProtectedRoute>
      }>
        <Route path="receivables" element={<AccountsReceivable />} />
        <Route path="payables" element={<AccountsPayable />} />
        <Route path="vouchers" element={<VouchersList />} />
        <Route path="ledger" element={<GeneralLedger />} />
        <Route path="reports" element={<FinancialReports />} />
        <Route path="vouchers/create/:applicationId" element={<PaymentVoucherForm />} />
        <Route path="payments/:id" element={<PaymentDetail />} />
        <Route path="payments/edit/:id" element={<PaymentApplicationForm />} />
      </Route>
      
      {/* Regular Routes */}
      <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
      <Route path="/loans/new" element={<ProtectedRoute><CreateLoan /></ProtectedRoute>} />
      <Route path="/loans/:id" element={<ProtectedRoute><LoanDetail /></ProtectedRoute>} />
      <Route path="/loans/:id/edit" element={<ProtectedRoute><CreateLoan /></ProtectedRoute>} />
      <Route path="/add-lead" element={<ProtectedRoute><AddLead /></ProtectedRoute>} />
      <Route path="/leads-list" element={<ProtectedRoute><LeadsList mode="branch" /></ProtectedRoute>} />
      <Route path="/broker-leads" element={<ProtectedRoute><LeadsList mode="broker" /></ProtectedRoute>} />
      <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/permissions" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin']}>
            <PermissionManagement />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/banks" element={<ProtectedRoute><BankManagement /></ProtectedRoute>} />
      <Route path="/brokers" element={<ProtectedRoute><BrokerManagement /></ProtectedRoute>} />
      <Route path="/my-brokers" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['employee']}>
            <MyBrokers />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/branches" element={<ProtectedRoute><BranchManagement /></ProtectedRoute>} />
      <Route path="/commission" element={<ProtectedRoute><Commission /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/pdd-tracking" element={<ProtectedRoute><PDDTracking /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentApplicationsList /></ProtectedRoute>} />
      <Route path="/payments/new" element={<ProtectedRoute><PaymentApplicationForm /></ProtectedRoute>} />
      <Route path="/payments/loan/:loanId" element={<ProtectedRoute><PaymentApplicationForm /></ProtectedRoute>} />
      <Route path="/payments/:id" element={<ProtectedRoute><PaymentDetail /></ProtectedRoute>} />
      <Route path="/payments/edit/:id" element={<ProtectedRoute><PaymentApplicationForm /></ProtectedRoute>} />
      <Route path="/broadcast" element={<ProtectedRoute><BroadcastNotification /></ProtectedRoute>} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/download" element={<Download />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/api-logs" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <ExternalApiLogs />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/credit-reports" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin']}>
            <CreditReports />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/settings/schemes" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin']}>
            <SchemeManagement />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/settings/vehicle-models" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin']}>
            <ModelManagement />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/settings/subvention" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={['super_admin']}>
            <SubventionGrid />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      <Route path="/" element={<DashboardRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  useEffect(() => {
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={
              <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <AppRoutes />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
