import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  User,
  Target,
  Megaphone,
  Zap,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  PlayCircle,
  CheckCircle2,
  GitBranch,
  Search,
  PhoneCall,
  BarChart3,
  MapPin,
  Shuffle,
  KeyRound,
  ChevronDown,
  Rocket,
  Wallet,
  Lock,
  AlertTriangle,
  LayoutGrid,
  GraduationCap,
  Clock3,
  Award,
  Flame,
  Play,
  Circle,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { cn, getUserInfo, isAdmin, isSuperAdmin } from '@/lib/utils';
import { getYoutubeThumbnail } from '@/lib/youtube';
import { TrainingAssistantWidget } from '@/components/training/TrainingAssistantWidget';

interface ApiTrainingVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category?: string;
  duration?: string;
}

interface Topic {
  title: string;
  content: string;
  role?: string;
  docSlug?: string;
}

interface Module {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  topics: Topic[];
  role?: string;
}

type ActiveTab = 'modules' | 'videos' | 'advanced' | 'faq';

const notComingYet = () =>
  toast.info("Not wired up yet — this is a placeholder for now, coming soon.");

const TrainingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('modules');
  const user = getUserInfo();
  const userIsAdmin = isAdmin(user);
  const userIsSuperAdmin = isSuperAdmin(user);

  // Client-side only "progress" — nothing is persisted to the backend yet.
  // This exists purely so the module-completion UI has something real to
  // interact with; wire it to an actual progress-tracking endpoint later
  // and this local state can be swapped for a query/mutation pair.
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());
  const toggleModuleComplete = (id: string) => {
    setCompletedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const modules = useMemo<Module[]>(() => [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      description: 'New to the CRM? Start here to understand the core workflow.',
      topics: [
        {
          title: 'Dashboard Overview',
          content: 'The Dashboard shows Expected Revenue, Pipeline, Follow-ups, Won/Lost deals, and Revenue for the selected Branch and date range (This Month / Last Month / Custom). Every stat tile is clickable and drills into the underlying filtered list.',
        },
        {
          title: 'Global Search & Command Center',
          content: 'Press Cmd+K (or Ctrl+K) anywhere to open the Command Center — instantly jump to any lead, contact, account, or page without touching the mouse.',
        },
        {
          title: 'Profile & Notifications',
          content: 'Settings > Profile controls your personal details and password. The bell icon shows real-time in-app notifications for assignments, mentions, and follow-up reminders, pushed live over the socket connection.',
        },
        {
          title: 'Mobile / Android App',
          content: 'The native Android app mirrors your leads and lets field reps make/receive calls with automatic call recording and logging, sync while offline, and get push notifications — all synced back to the same account.',
        }
      ]
    },
    {
      id: 'leads',
      title: 'Lead Management',
      icon: User,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      description: 'Capture, qualify, and route every incoming lead.',
      topics: [
        {
          title: 'Creating & Importing Leads',
          content: "Add leads manually, or bulk-import via CSV/Excel (Settings > Import) with column mapping. Leads also arrive automatically from Meta/Facebook Lead Ads, WhatsApp messages, and web forms.",
        },
        {
          title: 'Lead Statuses',
          content: 'Each organisation configures its own status list (Settings > Lead Statuses) — e.g. New, Contacted, Interested, Follow-up, Not Responding, Invalid. "Won"/"Lost" are set automatically only when a deal is actually closed, not manually picked.',
        },
        {
          title: 'Duplicate Detection & Re-Enquiries',
          content: 'New leads are checked for existing matches (by phone/email). A closed lead that comes back is tracked separately as a Re-Enquiry so its full history isn\'t lost.',
        },
        {
          title: 'Lead Scoring & Hot Leads',
          content: 'Leads accumulate an engagement/quality score from activity (calls, replies, link clicks). High scorers are flagged as Hot Leads for priority follow-up.',
        },
        {
          title: 'Lead Distribution & Round-Robin',
          content: 'New leads are auto-assigned to reps via configurable Assignment Rules (round-robin, territory-based, or rotation pools) — see Settings > Assignment Rules.',
          role: 'admin'
        },
        {
          title: 'Lead Shuffler',
          content: 'A separate tool from assignment rules — the Shuffler periodically re-distributes existing, aging leads (e.g. stuck in "Not Responding") across the active team on a schedule you configure, or on demand via "Shuffle Now".',
          role: 'admin'
        }
      ]
    },
    {
      id: 'sales',
      title: 'Sales Pipeline',
      icon: Target,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      description: 'Manage the full sales lifecycle from Contacts to closed deals.',
      topics: [
        {
          title: 'Opportunities & Kanban Pipeline',
          content: 'Converting a lead creates an Account, Contact, and Opportunity together. Track deals on the Kanban board or list view; drag a card to move it through your pipeline stages.',
        },
        {
          title: 'Closing Won or Lost',
          content: 'Use the dedicated "Closed Won" / "Closed Lost" actions (not a generic status field) — these correctly capture payment details on a win or a required reason on a loss, and are the only actions that should ever close a deal.',
        },
        {
          title: 'Quotes & Products',
          content: 'Build a product catalog once, then generate professional quotes directly from an Opportunity with line items pulled from that catalog.',
        },
        {
          title: 'EMI & Payment Schedules',
          content: 'For deals paid in installments, set up an EMI schedule with due dates and amounts; track each installment\'s paid/pending/overdue status and record partial or full payments as they come in.',
        },
        {
          title: 'Sales Targets & Commissions',
          content: 'Admins set individual or team sales targets; the Commissions module tracks payout amounts tied to closed deals for each rep.',
          role: 'admin'
        }
      ]
    },
    {
      id: 'engagement',
      title: 'Calls, WhatsApp & Follow-ups',
      icon: PhoneCall,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      description: 'Every touchpoint with a lead or customer, logged and actionable.',
      topics: [
        {
          title: 'Call Tracking & Recording',
          content: 'Calls made from the Android app are automatically logged and recorded (subject to your org\'s Call Settings), with the recording attached to the lead\'s timeline for playback.',
        },
        {
          title: 'WhatsApp Inbox',
          content: 'A live, threaded WhatsApp conversation view per lead/contact, connected through Meta\'s WhatsApp Cloud API (or Gallabox, if configured) — incoming messages from unrecognized numbers can even auto-create a new lead.',
          docSlug: 'whatsapp-integration-overview',
        },
        {
          title: 'WhatsApp & SMS Campaigns',
          content: 'Send templated bulk WhatsApp or SMS messages to a filtered segment of leads/contacts for announcements or promotions. Connect multiple numbers, assign agents, build keyword automations, or design full multi-step Flows with buttons and branching.',
          docSlug: 'whatsapp-campaigns',
        },
        {
          title: 'Follow-ups, Tasks & Calendar',
          content: 'Set follow-up reminders and tasks tied to any lead, and schedule meetings on the shared Calendar. Overdue and due-today items surface automatically on the Follow-ups page and Dashboard.',
        },
        {
          title: 'Notes & Activity Timeline',
          content: 'Every call, note, email, WhatsApp message, and status change appears in one chronological timeline per lead — the single source of truth for "what happened with this person."',
        }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing Suite',
      icon: Megaphone,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      description: 'Run multichannel campaigns and track real ad ROI.',
      role: 'admin',
      topics: [
        {
          title: 'Meta (Facebook/Instagram) Ads Manager',
          content: 'Connect a Meta ad account to see live campaign performance (spend, leads, delivery status) inside the CRM, and choose exactly which campaigns are allowed to sync leads in.',
        },
        {
          title: 'Web Forms & Landing Pages',
          content: 'Build embeddable lead-capture forms and standalone landing pages without a developer — submissions flow straight into Leads.',
        },
        {
          title: 'Email Campaigns & Lists',
          content: 'Segment contacts into Email Lists and send tracked campaigns (opens/clicks) to them.',
        }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: BarChart3,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      description: 'Turn activity into decisions with a dedicated report for every angle.',
      topics: [
        {
          title: 'Sales & Revenue Reports',
          content: 'Sales Book (every closed transaction), Expected Revenue (open pipeline, including deals carried forward from prior months), User Sales, and User Total performance leaderboards.',
        },
        {
          title: 'Activity Reports',
          content: 'Call Analytics, Daily Report (per-user call/lead summary), Lead Reports, Follow-up Reports, and Lead Distribution — who\'s getting leads and how they\'re converting.',
        },
        {
          title: 'Field Force & Audit Reports',
          content: 'Field Force Activity tracks rep location/visit check-ins; Audit Logs give a full trail of who changed what, for compliance and troubleshooting.',
          role: 'admin'
        },
        {
          title: 'Automated Daily Reports',
          content: 'Configure a daily report time (Settings > Organisation) to have call/lead summaries sent automatically to admins via WhatsApp and/or email every day.',
          role: 'admin'
        }
      ]
    },
    {
      id: 'field-ops',
      title: 'Field Operations',
      icon: MapPin,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10',
      description: 'For teams that meet customers in person.',
      topics: [
        {
          title: 'Field Force Tracking',
          content: 'Field reps check in with their live location when visiting a lead/customer, building a verifiable visit history on the map.',
        },
        {
          title: 'Territories & Branches',
          content: 'Organise your team by physical Branch, and optionally by sales Territory, so leads and reporting stay geographically scoped.',
          role: 'admin'
        }
      ]
    },
    {
      id: 'power-user',
      title: 'Power User Tips',
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      description: 'Navigate like a pro with shortcuts and advanced tools.',
      topics: [
        {
          title: 'Command Center (Cmd + K)',
          content: 'Press Cmd + K (or Ctrl + K) anywhere to open Global Search. Find any lead, contact, account, or settings page instantly.',
        },
        {
          title: 'Real-time Collaboration',
          content: 'Lead assignments, status changes, and new leads push to your screen live via WebSocket — no manual refresh needed.',
        },
        {
          title: 'Trash & Recovery',
          content: 'Deleted records aren\'t gone immediately — they sit in Settings > Trash for 7 days and can be restored, after which they\'re permanently purged.',
        }
      ]
    }
  ].filter(m => !m.role || (m.role === 'admin' && userIsAdmin)), [userIsAdmin]);

  const adminWorkflowSections = useMemo(() => [
    {
      title: 'System Hierarchy & Roles',
      icon: GitBranch,
      color: 'text-amber-500',
      items: [
        {
          title: 'Custom Roles & Permissions',
          content: 'Create roles with granular, per-module permissions (view/edit/delete/export). Users report up a management chain (reportsTo), which drives what data a manager can see versus a rep.'
        },
        {
          title: 'Branches & Teams',
          content: 'Group users into Branches (physical locations) and Teams (functional groups) for scoped visibility, reporting, and lead routing.'
        },
        {
          title: 'Custom Fields',
          content: 'Add org-specific fields to Leads, Contacts, Accounts, and Opportunities from Settings > Custom Fields — no developer needed.'
        }
      ]
    },
    {
      title: 'Lead Routing & Automation',
      icon: Shuffle,
      color: 'text-[hsl(var(--chart-5))]',
      items: [
        {
          title: 'Assignment Rules',
          content: 'Route brand-new incoming leads automatically — round-robin across selected users, by territory, or via a rotation pool — configured in Settings > Assignment Rules.'
        },
        {
          title: 'Lead Shuffler',
          content: 'Separately, periodically re-distribute EXISTING aging leads (e.g. gone cold in "Not Responding") on a schedule or on-demand, so no lead sits with one rep forever. Configure in Settings > Shuffler.'
        },
        {
          title: 'Workflow Builder',
          content: 'Build "If This, Then That" automations — e.g. auto-create a task when a lead hits a status, or send a notification on assignment. Workflow steps can be delayed and run in the background.'
        }
      ]
    },
    {
      title: 'Automation & APIs',
      icon: Zap,
      color: 'text-[hsl(var(--chart-5))]',
      items: [
        {
          title: 'Developer API Keys',
          content: 'Generate API keys in Settings > Developer to push leads into the CRM from an external website, app, or Zapier/Make integration via the public API.'
        },
        {
          title: 'Webhooks',
          content: 'Configure outbound webhooks to notify external systems whenever key events happen (new lead, status change, deal won).'
        }
      ]
    },
    {
      title: 'Data Governance',
      icon: ShieldCheck,
      color: 'text-emerald-500',
      items: [
        {
          title: 'Audit Logs',
          content: 'Every significant change (status updates, reassignments, deletions) is logged with who did it and when — reviewable in Reports > Audit Logs.'
        },
        {
          title: 'Trash & Soft-Delete',
          content: 'Nothing is deleted instantly — records go to Trash for a 7-day recovery window before permanent purge, protecting against accidental deletion.'
        }
      ]
    }
  ], []);

  const faqCategories = useMemo(() => [
    { id: 'getting-started', label: 'Getting Started', icon: Rocket, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'leads', label: 'Leads & Distribution', icon: User, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'sales', label: 'Sales & Payments', icon: Wallet, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'communication', label: 'Calls & Messaging', icon: PhoneCall, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'reports', label: 'Reports & Dashboard', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'automation', label: 'Automation & Admin', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'roles', label: 'Roles & Data Access', icon: Lock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ], []);

  const faqs = useMemo(() => [
    // Getting Started
    {
      category: 'getting-started',
      q: 'What is the fastest way to find a specific lead, contact, or page?',
      a: 'Press Cmd+K (Mac) or Ctrl+K (Windows) anywhere in the app to open the Command Center — a global search that jumps straight to any lead, contact, account, opportunity, or settings page without touching the mouse.'
    },
    {
      category: 'getting-started',
      q: 'How do I change my profile details, password, or notification preferences?',
      a: 'Go to Settings > Profile. Password changes also sign you out of every other device/session as a security measure — you\'ll need to log back in there afterward.'
    },
    {
      category: 'getting-started',
      q: 'What does the mobile Android app do that the web app can\'t?',
      a: 'It records and auto-logs calls made from the phone, works with local sync when offline, sends native push notifications, and can capture the field rep\'s live location — none of which a browser can do on its own.'
    },
    {
      category: 'getting-started',
      q: 'Why did I get logged out of the app on all my devices?',
      a: 'Any password change — by you, an admin resetting it, or via "Forgot Password" — immediately invalidates every other active session as a security measure. Just log back in with the new password.'
    },

    // Leads & Distribution
    {
      category: 'leads',
      q: 'Where do leads come from besides manual entry?',
      a: 'Leads flow in automatically from Meta/Facebook Lead Ads, inbound WhatsApp messages from unrecognized numbers, public web forms, and bulk CSV/Excel import — all landing in the same Leads list.'
    },
    {
      category: 'leads',
      q: 'What\'s the difference between Assignment Rules and the Shuffler?',
      a: 'Assignment Rules route brand-new incoming leads the moment they arrive (round-robin, territory-based, or a rotation pool). The Shuffler is separate — it periodically re-distributes leads that already exist and have gone cold, so no single rep ends up permanently hoarding stale leads.'
    },
    {
      category: 'leads',
      q: 'Why is my lead score low?',
      a: 'Lead/engagement scores rise from real activity — calls connected, replies received, links clicked. Logging every interaction (not just dialing) is what moves the score.'
    },
    {
      category: 'leads',
      q: 'A lead came back after being closed — do I edit the old record?',
      a: 'No — mark it as a Re-Enquiry instead. This keeps the original lead\'s full history intact while tracking the new engagement separately, rather than overwriting what happened before.'
    },
    {
      category: 'leads',
      q: 'How does duplicate lead detection work?',
      a: 'New leads are automatically checked against existing ones by phone number and email. A likely duplicate is flagged for review rather than silently created as a second copy.'
    },
    {
      category: 'leads',
      q: 'Can I bulk-update or bulk-assign many leads at once?',
      a: 'Yes — select multiple leads in the list and use Bulk Status Change or Bulk Assign. Note this bypasses the usual per-lead audit trail, so use it deliberately.'
    },

    // Sales & Payments
    {
      category: 'sales',
      q: 'Why is a deal I closed still showing under "Expected"?',
      a: 'This happens when a lead was accidentally converted to a pipeline deal twice — once as an open deal, once directly to Closed Won/Lost. Report the duplicate to your admin for cleanup; going forward, always close an existing deal via its own "Closed Won"/"Closed Lost" action rather than converting the lead again.'
    },
    {
      category: 'sales',
      q: 'Why don\'t I see "Won"/"Lost" as options in the status dropdown anymore?',
      a: 'By design — those outcomes are only ever set through the real "Closed Won"/"Closed Lost" actions, which correctly capture payment details or a required loss reason. Picking them from a plain dropdown used to create misleading records with no real deal behind them.'
    },
    {
      category: 'sales',
      q: 'How do EMI / installment payments work?',
      a: 'When closing a deal as an installment sale, set up an EMI schedule with due dates and amounts per installment. Each installment tracks paid/pending/overdue independently, and partial payments are recorded against the running total.'
    },
    {
      category: 'sales',
      q: 'Where do Quotes and the Product catalog fit in?',
      a: 'Build your Product catalog once (Products page); then generate a Quote directly from any Opportunity, pulling line items straight from that catalog instead of retyping them each time.'
    },
    {
      category: 'sales',
      q: 'How are sales commissions calculated?',
      a: 'Each closed-won deal can be linked to a Commission record tracking the payout owed to the rep who closed it — reviewable per user in the Commissions module.'
    },

    // Calls & Messaging
    {
      category: 'communication',
      q: 'Can I use WhatsApp for marketing messages?',
      a: 'Yes — use an approved WhatsApp template message for bulk sends once your WhatsApp Business number is connected in Settings > Integrations. Business-initiated messages always require an approved template; free-form replies only work within 24 hours of the customer\'s last message.'
    },
    {
      category: 'communication',
      q: 'Are my calls automatically recorded?',
      a: 'Calls made through the Android app are recorded and logged automatically if your organisation\'s Call Settings have recording enabled — the recording attaches directly to that lead\'s activity timeline.'
    },
    {
      category: 'communication',
      q: 'What happens if someone messages a number that isn\'t linked to any lead yet?',
      a: 'An incoming WhatsApp message from an unrecognized number can automatically create a brand-new lead, so first contact never gets lost even before anyone manually adds it.'
    },
    {
      category: 'communication',
      q: 'Where can I see every interaction with a customer in one place?',
      a: 'Every call, note, email, WhatsApp message, and status change appears in a single chronological Activity Timeline on that lead/contact\'s page.'
    },

    // Marketing
    {
      category: 'marketing',
      q: 'How does the Meta Ads integration decide which leads sync into the CRM?',
      a: 'You choose exactly which campaigns are allowed to sync in per connected ad account (Ads Manager > per-campaign toggle) — a connected account doesn\'t mean every campaign automatically feeds leads in.'
    },
    {
      category: 'marketing',
      q: 'Can I build a lead-capture form or landing page without a developer?',
      a: 'Yes — Web Forms and Landing Pages are both built visually inside the CRM; submissions flow directly into Leads with no code required.'
    },
    {
      category: 'marketing',
      q: 'How do I track whether an email campaign actually worked?',
      a: 'Email Campaigns report opens and clicks per recipient, scoped to whichever Email List segment you sent to.'
    },

    // Reports & Dashboard
    {
      category: 'reports',
      q: 'Why does the Dashboard\'s "Won" count differ from the filtered Opportunities list?',
      a: 'The Dashboard counts deals by their actual close date. Make sure any list you\'re comparing it to is also filtered by close date, not creation date — the two can differ for a deal created one month and closed the next.'
    },
    {
      category: 'reports',
      q: 'What does "Carried Forward" mean on the Expected Revenue report?',
      a: 'It flags an open deal whose expected close date has already passed into an earlier month but is still sitting open — visibility into pipeline that would otherwise silently blend into one number.'
    },
    {
      category: 'reports',
      q: 'Can I filter the Dashboard by branch and see it apply everywhere?',
      a: 'Yes — the Branch and Date Range filters at the top of the Dashboard are global: they scope every widget on the page (Quick Stats, Leads by Stage, Call Activity, User Rankings, and more), not just one card.'
    },
    {
      category: 'reports',
      q: 'Where do I get automated daily performance summaries?',
      a: 'Settings > Organisation lets you set a daily report time; call and lead summaries are then sent automatically to admins via WhatsApp and/or email every day.'
    },
    {
      category: 'reports',
      q: 'Which report shows individual rep performance vs. team totals?',
      a: 'User Sales and User Total give per-rep leaderboards; Sales Book lists every closed transaction individually for full traceability.'
    },

    // Automation & Admin
    {
      category: 'automation',
      q: 'What can the Workflow Builder actually automate?',
      a: '"If This, Then That" rules — e.g. auto-create a task when a lead reaches a certain status, or fire a notification the moment a lead is assigned. Steps can run immediately or after a configured delay.'
    },
    {
      category: 'automation',
      q: 'How do I connect an external tool like Zapier or a custom website to push leads in?',
      a: 'Generate an API key in Settings > Developer, then use the public API (or a Zapier/Make integration) to create leads programmatically from any external system.'
    },
    {
      category: 'automation',
      q: 'Can I add fields specific to my business that aren\'t built in?',
      a: 'Yes — Settings > Custom Fields lets you add org-specific fields to Leads, Contacts, Accounts, or Opportunities without any developer work.'
    },
    {
      category: 'automation',
      q: 'How do I recover a deleted lead, contact, or deal?',
      a: 'Deletion is never instant — go to Settings > Trash within 7 days to restore it. After 7 days it\'s permanently purged and cannot be recovered, so check Trash promptly.'
    },

    // Roles & Data Access
    {
      category: 'roles',
      q: 'Can a manager see their whole team\'s data, or just their own?',
      a: 'A manager sees their own records plus everyone who reports to them (directly or through the full chain), plus anyone in a team or branch they manage. Admins and Super Admins see the entire organisation.'
    },
    {
      category: 'roles',
      q: 'How granular are permissions — can I stop a role from deleting or exporting data?',
      a: 'Yes — custom roles set permissions per module and per action (view/edit/delete/export independently), not just a single "admin vs. rep" toggle.'
    },
    {
      category: 'roles',
      q: 'What\'s the difference between an org Admin and the Super Admin console?',
      a: 'An Admin manages one organisation. Super Admin is platform-level and cross-tenant — it can suspend/restore any organisation, assign licenses, and broadcast notifications platform-wide. Regular org admins never see it.'
    },

    // Troubleshooting
    {
      category: 'troubleshooting',
      q: 'I made more calls today than the app is showing — why?',
      a: 'First compare against your phone\'s own native call log to confirm the gap is real. The most common cause is the mobile app\'s background sync failing silently (often after a password change invalidates its session) — fully closing and reopening the app forces a fresh sync.'
    },
    {
      category: 'troubleshooting',
      q: 'Leads are showing up in my CRM from a campaign I don\'t recognize — is that a bug?',
      a: 'Usually not a bug: Meta routes leads by which Facebook Page an ad runs on, not by which ad account is connected in the CRM. If another advertiser has permission to run ads on your connected Page, their leads can land in your CRM too — check your Page\'s ad-permission list on Meta\'s side.'
    },
    {
      category: 'troubleshooting',
      q: 'A lead\'s status jumped between owners without anyone reassigning it — what happened?',
      a: 'Check whether Auto-Shuffle is on for your org (Settings > Shuffler) — even leads that look untouched can be periodically redistributed on schedule. A one-time manual "Shuffle Now" can also move leads even while the automatic schedule is off.'
    },
  ], []);

  const [activeFaqCategory, setActiveFaqCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  const visibleFaqs = useMemo(() => {
    return faqs
      .map((f, originalIndex) => ({ ...f, originalIndex }))
      .filter(f => activeFaqCategory === 'all' || f.category === activeFaqCategory)
      .filter(f =>
        !faqSearch ||
        f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.a.toLowerCase().includes(faqSearch.toLowerCase())
      );
  }, [faqs, activeFaqCategory, faqSearch]);

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Video guides added by a Super Admin (Super Admin > Training tab) — these
  // actually open the configured video URL.
  const { data: realVideoGuides } = useQuery<ApiTrainingVideo[]>({
    queryKey: ['public-training-videos'],
    queryFn: async () => (await api.get('/public/training-videos')).data.videos,
  });
  const hasRealVideoGuides = !!realVideoGuides && realVideoGuides.length > 0;

  const completedCount = completedModuleIds.size;
  const totalModules = modules.length;
  const progressStats = [
    { label: 'Modules Completed', value: `${completedCount}/${totalModules}`, icon: CheckCircle2, accent: 'bg-[hsl(var(--chart-5))]' },
    { label: 'Time Spent', value: '0h 0m', icon: Clock3, accent: 'bg-[hsl(var(--chart-2))]' },
    { label: 'Certificates Earned', value: 0, icon: Award, accent: 'bg-amber-500' },
    { label: 'Learning Streak', value: '0 days', icon: Flame, accent: 'bg-orange-500' },
  ];

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'modules', label: 'Core Modules' },
    { id: 'videos', label: 'Video Guides' },
    ...(userIsAdmin ? [{ id: 'advanced' as ActiveTab, label: 'Admin Workflow' }] : []),
    { id: 'faq', label: 'FAQs' },
  ];

  return (
    <div className="flex flex-col gap-5 p-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight">Training &amp; Learning Center</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Guides, FAQs, and tutorials for every feature — plus a training assistant to ask along the way.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search modules and topics..."
          className="pl-10 h-11 rounded-[10px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Learning progress — client-side only for now, nothing persisted yet */}
      <div className="rounded-[10px] bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-border">
          {progressStats.map((tile) => (
            <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1.5 px-4 py-4">
              <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
              <tile.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl sm:text-2xl font-medium font-poppins text-black">{tile.value}</span>
              <span className="text-[11px] font-poppins text-muted-foreground text-center">{tile.label}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-center">
          <p className="text-[11px] text-muted-foreground">
            Progress tracking is a preview — nothing above is saved yet. Real tracking is coming soon.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-muted/60 p-1 rounded-[10px] shrink-0 overflow-x-auto max-w-full">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-[8px] h-8 px-3 text-xs font-semibold transition-all shrink-0',
                activeTab === tab.id ? 'bg-white text-[hsl(var(--chart-5))] shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="hidden md:flex gap-2">
          <Button variant="outline" className="rounded-[10px] gap-2 h-9 text-xs sm:text-sm font-medium" onClick={() => setActiveTab('videos')}>
            <PlayCircle className="h-3.5 w-3.5" /> Video Guides
          </Button>
          <Button
            className="rounded-[10px] gap-2 h-9 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90"
            onClick={notComingYet}
          >
            <HelpCircle className="h-3.5 w-3.5" /> Contact Support
          </Button>
        </div>
      </div>

      {/* ============ CORE MODULES ============ */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module) => {
            const isComplete = completedModuleIds.has(module.id);
            return (
              <Card key={module.id} className="rounded-[10px] hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`${module.bg} p-2.5 rounded-[10px] w-fit`}>
                      <module.icon className={`h-5 w-5 ${module.color}`} />
                    </div>
                    {isComplete && (
                      <Badge className="bg-[hsl(var(--chart-5))] text-white text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">{module.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{module.description}</p>

                  <div className="space-y-2 mb-4">
                    {module.topics
                      .filter(t => !t.role || (t.role === 'admin' && userIsAdmin))
                      .map((topic, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2 rounded-[8px] hover:bg-muted/50 transition-colors">
                        <Circle className="h-3 w-3 text-[hsl(var(--chart-5))] shrink-0 mt-1 fill-current" />
                        <div className="min-w-0">
                          <span className="text-xs text-foreground font-semibold block">{topic.title}</span>
                          <span className="text-[11px] text-muted-foreground leading-relaxed">{topic.content}</span>
                          {topic.docSlug && (
                            <Link
                              to={`/docs/${topic.docSlug}`}
                              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Read full guide <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={isComplete ? 'outline' : 'default'}
                    size="sm"
                    className={cn(
                      'w-full rounded-[8px] h-8 text-xs font-semibold',
                      !isComplete && 'bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(var(--chart-5))]/90'
                    )}
                    onClick={() => toggleModuleComplete(module.id)}
                  >
                    {isComplete ? 'Mark as Not Started' : 'Mark as Complete'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ============ VIDEO GUIDES ============ */}
      {activeTab === 'videos' && (
        hasRealVideoGuides ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realVideoGuides!.map((video) => {
              // Fall back to YouTube's own thumbnail when the admin didn't set one
              // explicitly — computed at render time so it stays correct even if
              // the video URL is edited later.
              const thumbnail = video.thumbnailUrl || getYoutubeThumbnail(video.videoUrl);
              return (
              <Card
                key={video.id}
                className="rounded-[10px] overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                onClick={() => window.open(video.videoUrl, '_blank', 'noopener,noreferrer')}
              >
                <div
                  className="relative aspect-video bg-[hsl(var(--chart-5))]/10 flex items-center justify-center bg-cover bg-center"
                  style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined}
                >
                  <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 text-[hsl(var(--chart-5))] fill-current ml-0.5" />
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  )}
                </div>
                <CardContent className="p-3.5">
                  <h3 className="text-sm font-semibold text-foreground truncate">{video.title}</h3>
                  {(video.category || video.description) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{video.category || video.description}</p>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Play className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No video guides yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Check back soon, or use the FAQ tab and Training Assistant in the meantime.
            </p>
          </div>
        )
      )}

      {/* ============ ADMIN WORKFLOW ============ */}
      {activeTab === 'advanced' && userIsAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminWorkflowSections.map((section) => (
            <Card key={section.title} className="rounded-[10px]">
              <CardContent className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
                  <section.icon className={`h-4 w-4 ${section.color}`} /> {section.title}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.title} className="p-3 rounded-[8px] bg-muted/40 border border-border">
                      <h4 className="text-xs font-bold text-foreground mb-1">{item.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {userIsSuperAdmin && (
            <Card className="rounded-[10px] md:col-span-2">
              <CardContent className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                  <KeyRound className="h-4 w-4 text-rose-500" /> Super Admin Console
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Platform-level, cross-tenant administration — separate from any single organisation's settings.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-[8px] bg-muted/40 border border-border">
                    <h4 className="text-xs font-bold text-foreground mb-1">Organisation Management</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      View, suspend, restore, or permanently manage every organisation on the platform, and assign subscription plans/licenses.
                    </p>
                  </div>
                  <div className="p-3 rounded-[8px] bg-muted/40 border border-border">
                    <h4 className="text-xs font-bold text-foreground mb-1">Broadcasts &amp; Platform Content</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Push a broadcast notification to every organisation, and manage the public marketing site's FAQs and SEO settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============ FAQ ============ */}
      {activeTab === 'faq' && (
        <div className="max-w-4xl mx-auto w-full space-y-5">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              className="pl-10 h-10 rounded-[10px]"
              value={faqSearch}
              onChange={(e) => { setFaqSearch(e.target.value); setOpenFaqIndex(null); }}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => { setActiveFaqCategory('all'); setOpenFaqIndex(null); }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                activeFaqCategory === 'all'
                  ? 'bg-[hsl(var(--chart-5))] text-white border-[hsl(var(--chart-5))]'
                  : 'bg-card text-muted-foreground border-border hover:border-[hsl(var(--chart-5))]/40 hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> All ({faqs.length})
            </button>
            {faqCategories.map((cat) => {
              const count = faqs.filter(f => f.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveFaqCategory(cat.id); setOpenFaqIndex(null); }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                    activeFaqCategory === cat.id
                      ? 'bg-[hsl(var(--chart-5))] text-white border-[hsl(var(--chart-5))]'
                      : 'bg-card text-muted-foreground border-border hover:border-[hsl(var(--chart-5))]/40 hover:text-foreground'
                  )}
                >
                  <cat.icon className="h-3.5 w-3.5" /> {cat.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {visibleFaqs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No FAQs match "{faqSearch}". Try a different search or category.
              </div>
            ) : (
              visibleFaqs.map((item) => {
                const cat = faqCategories.find(c => c.id === item.category)!;
                const isOpen = openFaqIndex === item.originalIndex;
                return (
                  <div
                    key={item.originalIndex}
                    className="rounded-[10px] bg-card border border-border overflow-hidden transition-colors hover:border-[hsl(var(--chart-5))]/30"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : item.originalIndex)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <div className={cn('h-8 w-8 rounded-[8px] flex items-center justify-center shrink-0', cat.bg)}>
                        <cat.icon className={cn('h-4 w-4', cat.color)} />
                      </div>
                      <h3 className="flex-1 text-sm font-semibold text-foreground">{item.q}</h3>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-15">
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Support Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-[10px] bg-card border border-border mt-4 gap-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[hsl(var(--chart-5))]/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6 text-[hsl(var(--chart-5))]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Still have questions?</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">Ask the Training Assistant (bottom-right), or reach our team directly.</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            className="rounded-[10px] px-5 h-10 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(var(--chart-5))]/90"
            onClick={notComingYet}
          >
            Visit Community
          </Button>
          <Button variant="outline" className="rounded-[10px] px-5 h-10 text-xs sm:text-sm font-medium" onClick={notComingYet}>
            Submit Ticket
          </Button>
        </div>
      </div>

      {/* Floating dummy training assistant — canned replies for now */}
      <TrainingAssistantWidget />
    </div>
  );
};

export default TrainingPage;
