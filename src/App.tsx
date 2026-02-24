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
import Terms from './pages/Terms';
import SharedProductPage from './pages/public/SharedProductPage';
import { PageLoader } from './components/ui/page-loader';


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load secondary pages to improve performance
const LeadsPage = lazy(() => import('./pages/leads'));
const CreateLeadPage = lazy(() => import('./pages/leads/new'));
const LeadDetailPage = lazy(() => import('./pages/leads/[id]'));
const ReEnquiriesPage = lazy(() => import('./pages/re-enquiries'));
const DuplicatesPage = lazy(() => import('./pages/duplicates'));
const UserProfilePage = lazy(() => import('./pages/users/[id]'));
const ContactsPage = lazy(() => import('./pages/contacts'));
const ContactDetailPage = lazy(() => import('./pages/contacts/[id]'));
const AccountsPage = lazy(() => import('./pages/accounts'));
const AccountDetailPage = lazy(() => import('./pages/accounts/[id]'));
const OpportunitiesPage = lazy(() => import('./pages/opportunities'));
const MarketingPage = lazy(() => import('./pages/marketing'));
const AdsDashboard = lazy(() => import('./pages/marketing/ads'));
const AdsManager = lazy(() => import('./pages/marketing/AdsManager'));
const CreateCampaignPage = lazy(() => import('./pages/marketing/new-campaign'));
const CommunicationsPage = lazy(() => import('./pages/communications'));
const CalendarPage = lazy(() => import('./pages/calendar'));
const TasksPage = lazy(() => import('./pages/tasks'));
const CallsPage = lazy(() => import('./pages/calls'));
const SettingsPage = lazy(() => import('./pages/settings'));
const AutomationPage = lazy(() => import('./pages/automation'));
const ProductsPage = lazy(() => import('./pages/products'));
const QuotesPage = lazy(() => import('./pages/quotes'));
const FieldForcePage = lazy(() => import('./pages/field-force'));
const SupportPage = lazy(() => import('./pages/support'));
const GoalsPage = lazy(() => import('./pages/goals'));
const SalesTargetsPage = lazy(() => import('./pages/sales-targets'));
const CommissionsPage = lazy(() => import('./pages/sales/commissions'));
const ReportsPage = lazy(() => import('./pages/reports'));
const WhatsAppInbox = lazy(() => import('./pages/WhatsAppInbox'));
const SMSCampaignsPage = lazy(() => import('./pages/marketing/sms'));
const LandingPagesManager = lazy(() => import('./pages/marketing/landing-pages'));
const WebFormsPage = lazy(() => import('./pages/marketing/forms'));
const WhatsAppCampaignsPage = lazy(() => import('./pages/marketing/whatsapp'));
const EmailListsPage = lazy(() => import('./pages/marketing/lists'));

// Settings sub-pages
const ProfileSettingsPage = lazy(() => import('./pages/settings/profile'));
const TeamSettingsPage = lazy(() => import('./pages/settings/team'));
const BranchesSettingsPage = lazy(() => import('./pages/settings/organisation/Branches'));
const RolesSettingsPage = lazy(() => import('./pages/settings/roles'));
const CustomFieldsSettingsPage = lazy(() => import('./pages/settings/custom-fields'));
const TerritoriesSettingsPage = lazy(() => import('./pages/settings/territories'));
const SuperAdminDashboard = lazy(() => import('./pages/super-admin'));
const OrganisationDetailPage = lazy(() => import('./pages/super-admin/organisation/[id]'));
const SeoSettingsPage = lazy(() => import('./pages/super-admin/seo'));
const OrganisationSettingsPage = lazy(() => import('./pages/settings/organisation'));

const LeadScoringSettingsPage = lazy(() => import('./pages/settings/lead-scoring'));
const AssignmentRulesPage = lazy(() => import('./pages/settings/assignment-rules'));
const HierarchyPage = lazy(() => import('./pages/organisation/hierarchy'));
const AiWriterPage = lazy(() => import('./pages/marketing/ai-writer'));
const WorkflowsPage = lazy(() => import('./pages/automation/workflows'));
const CreateWorkflowPage = lazy(() => import('./pages/automation/new'));
const WorkflowDetailPage = lazy(() => import('./pages/automation/WorkflowDetail'));
const SalesBookPage = lazy(() => import('./pages/reports/SalesBook'));
const UserSalesPage = lazy(() => import('./pages/reports/UserSales'));
const AnalyticsPage = lazy(() => import('./pages/reports/analytics'));
const CampaignReportsPage = lazy(() => import('./pages/reports/campaigns'));
const FieldForceReportsPage = lazy(() => import('./pages/reports/field-force'));
const LeadReportsPage = lazy(() => import('./pages/reports/leads'));
const FollowUpReportsPage = lazy(() => import('./pages/reports/follow-ups'));

const IntegrationsSettingsPage = lazy(() => import('./pages/settings/Integrations'));
const PipelinesSettingsPage = lazy(() => import('./pages/settings/pipelines'));
const NotificationsSettingsPage = lazy(() => import('./pages/settings/notifications'));
const NotificationsPage = lazy(() => import('./pages/notifications'));
const CallRecordingSettingsPage = lazy(() => import('./pages/settings/call-recording'));
const ImportSettingsPage = lazy(() => import('./pages/settings/import'));
const BillingSettingsPage = lazy(() => import('./pages/settings/Billing'));
const AuditLogsPage = lazy(() => import('./pages/settings/audit-logs'));
const DeveloperSettingsPage = lazy(() => import('./pages/settings/developer'));



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

    // Silent Session Refresh
    const refreshUserSession = async () => {
      if (!userInfo) return;
      try {
        const { api } = await import('./services/api');
        const res = await api.get('/auth/me');
        if (res.data) {
          const updatedUser = { ...JSON.parse(userInfo), ...res.data };
          localStorage.setItem('userInfo', JSON.stringify(updatedUser));
          // Dispatch custom event for reactive components
          window.dispatchEvent(new CustomEvent('auth-refresh', { detail: updatedUser }));
        }
      } catch (err) {
        console.error('Session refresh failed:', err);
      }
    };
    refreshUserSession();
  }, []);

  return (
    <SocketProvider>
      <Router>
        <Suspense fallback={<PageLoader text="Loading PYPE..." />}>
          <Routes>
            {/* ... public routes ... */}
            <Route path="/login" element={<Login />} />
            <Route path="/sso-login" element={<Suspense fallback={<PageLoader text="Loading SSO" />}><SSOLogin /></Suspense>} />
            <Route path="/sso-callback" element={<SSOCallback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/leads/new" element={<CreateLeadPage />} />
              <Route path="/leads/:id" element={<LeadDetailPage />} />
              <Route path="/re-enquiries" element={<ReEnquiriesPage />} />
              <Route path="/duplicates" element={<DuplicatesPage />} />
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
              <Route path="/settings/branches" element={<BranchesSettingsPage />} />
              <Route path="/settings/roles" element={<RolesSettingsPage />} />
              <Route path="/settings/pipelines" element={<PipelinesSettingsPage />} />
              <Route path="/settings/custom-fields" element={<CustomFieldsSettingsPage />} />
              <Route path="/settings/territories" element={<TerritoriesSettingsPage />} />
              <Route path="/settings/call-recording" element={<CallRecordingSettingsPage />} />
              <Route path="/settings/import" element={<ImportSettingsPage />} />
              <Route path="/settings/billing" element={<BillingSettingsPage />} />
              <Route path="/settings/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings/developer" element={<DeveloperSettingsPage />} />
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
              <Route path="/reports/sales-book" element={<SalesBookPage />} />
              <Route path="/reports/user-sales" element={<UserSalesPage />} />
              <Route path="/reports/campaigns" element={<CampaignReportsPage />} />
              <Route path="/reports/field-force" element={<FieldForceReportsPage />} />
              <Route path="/reports/leads" element={<LeadReportsPage />} />
              <Route path="/reports/follow-ups" element={<FollowUpReportsPage />} />

              {/* Super Admin & Organisation Settings */}
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/organisation/:id" element={<OrganisationDetailPage />} />
              <Route path="/super-admin/seo" element={<SeoSettingsPage />} />

              <Route path="/settings/lead-scoring" element={<LeadScoringSettingsPage />} />
              <Route path="/settings/assignment-rules" element={<AssignmentRulesPage />} />
              <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
              <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
              <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

            </Route>

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/shared-product/:slug" element={<SharedProductPage />} />
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </Suspense>
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