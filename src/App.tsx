import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { syncToken } from './utils/mobileBridge';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/shared/Layout';
import PrivacyPolicy from './pages/PrivacyPolicy';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

import LeadsPage from './pages/leads';
import CreateLeadPage from './pages/leads/new';
import LeadDetailPage from './pages/leads/[id]';
import UserProfilePage from './pages/users/[id]';
import ContactsPage from './pages/contacts';
import ContactDetailPage from './pages/contacts/[id]';
import AccountsPage from './pages/accounts';
import AccountDetailPage from './pages/accounts/[id]';
import OpportunitiesPage from './pages/opportunities';
import MarketingPage from './pages/marketing';
import AdsDashboard from './pages/marketing/ads';
import CreateCampaignPage from './pages/marketing/new-campaign';
import CommunicationsPage from './pages/communications';
import CalendarPage from './pages/calendar';
import TasksPage from './pages/tasks';
import SettingsPage from './pages/settings';
import AutomationPage from './pages/automation';
import ProductsPage from './pages/products';
import QuotesPage from './pages/quotes';
import FieldForcePage from './pages/field-force';
import SupportPage from './pages/support';
import GoalsPage from './pages/goals';
import SalesTargetsPage from './pages/sales-targets';
import CommissionsPage from './pages/sales/commissions';
import ReportsPage from './pages/reports';
import WhatsAppInbox from './pages/WhatsAppInbox';
import SMSCampaignsPage from './pages/marketing/sms';
import LandingPagesManager from './pages/marketing/landing-pages';
import WebFormsPage from './pages/marketing/forms';
import WhatsAppCampaignsPage from './pages/marketing/whatsapp';
import EmailListsPage from './pages/marketing/lists';

// Settings sub-pages
import ProfileSettingsPage from './pages/settings/profile';
import TeamSettingsPage from './pages/settings/team';
import RolesSettingsPage from './pages/settings/roles';
import CustomFieldsSettingsPage from './pages/settings/custom-fields';
import TerritoriesSettingsPage from './pages/settings/territories';
import SuperAdminDashboard from './pages/super-admin';
import OrganisationDetailPage from './pages/super-admin/organisation/[id]';
import OrganisationSettingsPage from './pages/settings/organisation';
import LeadScoringSettingsPage from './pages/settings/lead-scoring';
import AssignmentRulesPage from './pages/settings/assignment-rules';
import HierarchyPage from './pages/organisation/hierarchy';
import AiWriterPage from './pages/marketing/ai-writer';
import WorkflowsPage from './pages/automation/workflows';
import CreateWorkflowPage from './pages/automation/new';
import WorkflowDetailPage from './pages/automation/WorkflowDetail';
import AnalyticsPage from './pages/reports/analytics';

import IntegrationsSettingsPage from './pages/settings/Integrations';
import PipelinesSettingsPage from './pages/settings/pipelines';
import NotificationsSettingsPage from './pages/settings/notifications';
import ImportPage from './pages/settings/import';
import DeveloperSettingsPage from './pages/settings/developer';
import CallRecordingSettingsPage from './pages/settings/call-recording';
import BillingSettingsPage from './pages/settings/Billing';
import AuditLogsPage from './pages/settings/audit-logs';
import CallsPage from './pages/calls';


import SSOCallback from './pages/SSOCallback';

const SSOLogin = lazy(() => import('./pages/SSOLogin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

function AppContent() {
  useEffect(() => {
    // Sync token to mobile app on mount and when it might change (e.g. login)
    // For simplicity, we check localStorage here. Ideally use an AuthContext.
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed.token) {
          syncToken(parsed.token);
        }
      } catch (e) {
        console.error('Failed to parse user info for token sync', e);
      }
    }
  }, []);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          {/* ... existing routes ... */}
          <Route path="/login" element={<Login />} />
          <Route path="/sso-login" element={<Suspense fallback={<div>Loading...</div>}><SSOLogin /></Suspense>} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/new" element={<CreateLeadPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:id" element={<AccountDetailPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/marketing/ads" element={<AdsDashboard />} />
            <Route path="/marketing/sms" element={<SMSCampaignsPage />} />
            <Route path="/marketing/landing-pages" element={<LandingPagesManager />} />
            <Route path="/marketing/forms" element={<WebFormsPage />} />
            <Route path="/marketing/campaigns/new" element={<CreateCampaignPage />} />
            <Route path="/marketing/lists" element={<EmailListsPage />} />
            <Route path="/marketing/whatsapp" element={<WhatsAppCampaignsPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/whatsapp/inbox" element={<WhatsAppInbox />} />
            <Route path="/calls" element={<CallsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/ai-writer" element={<AiWriterPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/organisation/hierarchy" element={<HierarchyPage />} />
            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            <Route path="/settings/team" element={<TeamSettingsPage />} />
            <Route path="/settings/roles" element={<RolesSettingsPage />} />
            <Route path="/settings/pipelines" element={<PipelinesSettingsPage />} />
            <Route path="/settings/custom-fields" element={<CustomFieldsSettingsPage />} />
            <Route path="/settings/territories" element={<TerritoriesSettingsPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/automation/new" element={<CreateWorkflowPage />} />
            <Route path="/automation/:id" element={<WorkflowDetailPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/field-force" element={<FieldForcePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/sales-targets" element={<SalesTargetsPage />} />
            <Route path="/sales/commissions" element={<CommissionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* Super Admin & Organisation Settings */}
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/organisation/:id" element={<OrganisationDetailPage />} />
            <Route path="/settings/organisation" element={<OrganisationSettingsPage />} />
            <Route path="/settings/lead-scoring" element={<LeadScoringSettingsPage />} />
            <Route path="/settings/assignment-rules" element={<AssignmentRulesPage />} />
            <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
            <Route path="/settings/import" element={<ImportPage />} />
            <Route path="/settings/developer" element={<DeveloperSettingsPage />} />
            <Route path="/settings/call-recording" element={<CallRecordingSettingsPage />} />
            <Route path="/settings/billing" element={<BillingSettingsPage />} />
            <Route path="/settings/audit-logs" element={<AuditLogsPage />} />
          </Route>

          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster
          position="bottom-right"
          expand={true}
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              borderRadius: '12px',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;