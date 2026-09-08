import React, { useState, useMemo } from 'react';
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
  KeyRound
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserInfo, isAdmin, isSuperAdmin } from '@/lib/utils';

interface Topic {
  title: string;
  content: string;
  role?: string;
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

const TrainingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const user = getUserInfo();
  const userIsAdmin = isAdmin(user);
  const userIsSuperAdmin = isSuperAdmin(user);

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
        },
        {
          title: 'WhatsApp & SMS Campaigns',
          content: 'Send templated bulk WhatsApp or SMS messages to a filtered segment of leads/contacts for announcements or promotions.',
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
      color: 'text-primary',
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
      color: 'text-primary',
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

  const faqs = useMemo(() => [
    {
      q: 'How do I recover a deleted lead, contact, or deal?',
      a: 'Deletion is not immediate — go to Settings > Trash within 7 days of deleting to restore it. After 7 days it is permanently purged and cannot be recovered.'
    },
    {
      q: 'Why is a deal I closed still showing under "Expected"?',
      a: 'This happens when a lead was converted to a pipeline deal twice by mistake (once to an open deal, once directly to Closed Won/Lost). Report the duplicate to your admin — closing a deal should always be done via the "Closed Won"/"Closed Lost" action on the existing deal, not by converting the lead again.'
    },
    {
      q: 'Why don\'t I see "Won"/"Lost" as options in the status dropdown anymore?',
      a: 'By design — those outcomes should only ever be set through the actual "Closed Won"/"Closed Lost" actions, which correctly capture payment or loss-reason details. Picking them from a plain dropdown used to create misleading records with no real deal behind them.'
    },
    {
      q: 'Can I use WhatsApp for marketing messages?',
      a: 'Yes — use an approved WhatsApp template message for bulk sends once your WhatsApp Business number is connected in Settings > Integrations. Business-initiated messages require an approved template; free-form replies only work within 24 hours of the customer\'s last message.'
    },
    {
      q: 'Why is my lead score low?',
      a: 'Lead scores rise with real engagement — calls connected, replies received, links clicked. Logging every interaction (not just calling) helps the score reflect reality.'
    },
    {
      q: 'What\'s the difference between Assignment Rules and the Shuffler?',
      a: 'Assignment Rules route brand-new incoming leads the moment they arrive (round-robin/territory-based). The Shuffler is separate — it periodically re-distributes leads that already exist and have gone cold, so no single rep ends up hoarding stale leads.',
    },
    {
      q: 'Why does the Dashboard\'s "Won" count differ from the filtered Opportunities list?',
      a: 'The Dashboard counts deals by their actual close date; make sure any list you\'re comparing it to is also filtered by close date and not creation date — the two can differ for a deal created one month and closed the next.'
    },
    {
      q: 'How do EMI payments work?',
      a: 'When closing a deal as an installment sale, set up an EMI schedule with due dates and amounts per installment. Each installment is marked paid/pending/overdue independently, and partial payments are tracked against the total.'
    },
    {
      q: 'Can a manager see their whole team\'s data, or just their own?',
      a: 'A manager sees their own records plus everyone who reports to them (directly or through the chain), plus anyone in a team/branch they manage. Admins and Super Admins see the entire organisation.'
    },
    {
      q: 'How do I get notified about follow-ups and assignments?',
      a: 'The notification bell shows real-time in-app alerts. Daily WhatsApp/email summary reports can also be scheduled from Settings > Organisation.'
    }
  ], []);

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -m-12 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -m-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary-foreground/80 px-4 py-1.5 uppercase tracking-widest text-[10px] font-bold">
            Learning Hub
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Sales DNA.</span>
          </h1>
          <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
            Explore comprehensive guides and tutorials for every feature. Transform leads into loyalty with expert knowledge.
          </p>

          <div className="relative group max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search for tutorials..."
              className="bg-neutral-800/50 border-neutral-700 pl-10 h-12 rounded-xl focus-visible:ring-primary/50 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="modules" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <TabsTrigger value="modules" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white rounded-lg px-6 py-2">
              Core Modules
            </TabsTrigger>
            {userIsAdmin && (
              <TabsTrigger value="advanced" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white rounded-lg px-6 py-2">
                Admin Workflow
              </TabsTrigger>
            )}
            <TabsTrigger value="faq" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white rounded-lg px-6 py-2">
              FAQs
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex gap-4">
            <Button variant="outline" className="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 rounded-xl gap-2 h-10">
              <PlayCircle className="h-4 w-4" /> Video Guides
            </Button>
            <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-10">
              <HelpCircle className="h-4 w-4" /> Contact Support
            </Button>
          </div>
        </div>

        <TabsContent value="modules" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-all duration-300 group overflow-hidden">
                <CardHeader>
                  <div className={`${module.bg} p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <module.icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors">{module.title}</CardTitle>
                  <CardDescription className="text-neutral-400 line-clamp-2">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {module.topics
                      .filter(t => !t.role || (t.role === 'admin' && userIsAdmin))
                      .map((topic, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-neutral-800/50 transition-colors group/item">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm text-neutral-200 font-semibold group-hover/item:text-white block">{topic.title}</span>
                          <span className="text-xs text-neutral-500 leading-relaxed">{topic.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {userIsAdmin && (
          <TabsContent value="advanced" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {adminWorkflowSections.map((section) => (
              <Card key={section.title} className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <section.icon className={`h-5 w-5 ${section.color}`} /> {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div key={item.title} className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50">
                        <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {userIsSuperAdmin && (
              <Card className="bg-neutral-900 border-neutral-800 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <KeyRound className="h-5 w-5 text-rose-500" /> Super Admin Console
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-neutral-400">
                    Platform-level, cross-tenant administration — separate from any single organisation's settings.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50">
                      <h4 className="text-sm font-bold text-white mb-2">Organisation Management</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        View, suspend, restore, or permanently manage every organisation on the platform, and assign subscription plans/licenses.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50">
                      <h4 className="text-sm font-bold text-white mb-2">Broadcasts & Platform Content</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Push a broadcast notification to every organisation, and manage the public marketing site's FAQs and SEO settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value="faq" className="max-w-3xl mx-auto py-8">
          <div className="space-y-6">
            {faqs.map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">Q</Badge> {item.q}
                </h3>
                <p className="text-neutral-400 text-sm pl-11 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Support Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 mt-12 gap-6">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Still have questions?</h3>
            <p className="text-neutral-400 text-sm">Join our weekly training webinars or contact our success team.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button className="rounded-xl px-8 h-12">Visit Community</Button>
          <Button variant="outline" className="rounded-xl border-neutral-700 bg-transparent hover:bg-neutral-800 text-white px-8 h-12">Submit Ticket</Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
