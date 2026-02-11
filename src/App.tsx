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
import SharedProductPage from './pages/public/SharedProductPage';


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
import AdsManager from './pages/marketing/AdsManager';
import CreateCampaignPage from './pages/marketing/new-campaign';
import CommunicationsPage from './pages/communications';
import CalendarPage from './pages/calendar';
import TasksPage from './pages/tasks';
import CallsPage from './pages/calls';
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
import CampaignReportsPage from './pages/reports/campaigns';
import FieldForceReportsPage from './pages/reports/field-force';
import LeadReportsPage from './pages/reports/leads';
import FollowUpReportsPage from './pages/reports/follow-ups';

import IntegrationsSettingsPage from './pages/settings/Integrations';
import PipelinesSettingsPage from './pages/settings/pipelines';
import NotificationsSettingsPage from './pages/settings/notifications';



import SSOCallback from './pages/SSOCallback';

const SSOLogin = lazy(() => import('./pages/SSOLogin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds (reduced from 5 minutes)
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
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
        // Initialize global currency if available
        if (parsed.organisation?.currency) {
          // Lazy import to avoid circular dependency if any, though utils is safe
          import('./lib/utils').then(({ setGlobalCurrency }) => {
            setGlobalCurrency(parsed.organisation.currency);
          });
        }
      } catch (e) {
        console.error('Failed to parse user info', e);
      }
    }

    // Log environment info and warn if local
    import('./utils/environmentChecker').then(({ logEnvironmentInfo, warnIfLocalEnvironment }) => {
      logEnvironmentInfo();
      warnIfLocalEnvironment();
    });
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
            <Route path="/marketing/ads-manager" element={<AdsManager />} />
            <Route path="/marketing/sms" element={<SMSCampaignsPage />} />
            <Route path="/marketing/landing-pages" element={<LandingPagesManager />} />
            <Route path="/marketing/forms" element={<WebFormsPage />} />
            <Route path="/marketing/campaigns/new" element={<CreateCampaignPage />} />
            <Route path="/marketing/lists" element={<EmailListsPage />} />
            <Route path="/marketing/whatsapp" element={<WhatsAppCampaignsPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/whatsapp/inbox" element={<WhatsAppInbox />} />

            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calls" element={<CallsPage />} />
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
            <Route path="/settings/organisation" element={<OrganisationSettingsPage />} />
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
            <Route path="/reports/analytics" element={<AnalyticsPage />} />
            <Route path="/reports/campaigns" element={<CampaignReportsPage />} />
            <Route path="/reports/field-force" element={<FieldForceReportsPage />} />
            <Route path="/reports/leads" element={<LeadReportsPage />} />
            <Route path="/reports/follow-ups" element={<FollowUpReportsPage />} />

            {/* Super Admin & Organisation Settings */}
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/organisation/:id" element={<OrganisationDetailPage />} />

            <Route path="/settings/lead-scoring" element={<LeadScoringSettingsPage />} />
            <Route path="/settings/assignment-rules" element={<AssignmentRulesPage />} />
            <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />

          </Route>

          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/shared-product/:slug" element={<SharedProductPage />} />
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