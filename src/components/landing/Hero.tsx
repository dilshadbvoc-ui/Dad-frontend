import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Star,
  Sparkles,
  Hash,
  KanbanSquare,
  BarChart3,
  Plus,
  LayoutDashboard,
  Users,
  GitBranch,
  Contact,
  FileBarChart,
  Workflow,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Leads" },
  { icon: GitBranch, label: "Pipeline" },
  { icon: Contact, label: "Contacts" },
  { icon: FileBarChart, label: "Reports" },
  { icon: Workflow, label: "Automation" },
];

const clientLogos = [
  "Learnuz",
  "Study Miles",
  "IITS",
  "Skillage",
  "Acadox",
  "Edufolio",
  "World Passport",
  "Edumentora",
  "Emtees",
  "Aptor Studies",
  "WiseHub",
];

const leadRows = [
  { name: "Priya Sharma", status: "Won", color: "bg-emerald-500", value: "w-14" },
  { name: "Arjun Mehta", status: "Interested", color: "bg-blue-500", value: "w-10" },
  { name: "Kavya Nair", status: "Qualified", color: "bg-amber-500", value: "w-16" },
  { name: "Rohit Verma", status: "New", color: "bg-indigo-500", value: "w-8" },
  { name: "Sneha Iyer", status: "Contacted", color: "bg-sky-500", value: "w-12" },
  { name: "Vikram Rao", status: "Interested", color: "bg-blue-500", value: "w-10" },
  { name: "Ananya Das", status: "Won", color: "bg-emerald-500", value: "w-16" },
  { name: "Karthik S.", status: "Qualified", color: "bg-amber-500", value: "w-9" },
];

export default function Hero() {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-white dark:bg-gray-950 selection:bg-blue-100 dark:selection:bg-blue-900">

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 relative z-10">
        <div className="max-w-3xl mb-24 md:mb-32 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 md:mb-6 leading-[1.1]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              The sales CRM
              <br />
              you won&apos;t outgrow
            </h1>

            <p className="text-lg md:text-lg text-gray-600 dark:text-gray-300 mb-8 md:mb-8 leading-relaxed">
              Track leads, manage your pipeline, and close more deals in one flexible workspace.
              Automation and AI that already understand your sales process, built in from day one.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Link to="/register">
                <Button size="lg" className="h-14 px-8 text-lg shadow-none transition-transform">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400 text-left leading-snug">
                No Credit Card Required.
                <br />
                14-Day Free Trial.
              </div>
            </div>

            <div className="mt-5 md:mt-2 md:ml-1 flex flex-row items-start gap-2">
              <div className="relative inline-flex">
                <div className="flex gap-0.5 text-gray-300 dark:text-gray-700">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <div
                  className="absolute inset-0 flex gap-0.5 text-amber-400 overflow-hidden"
                  style={{ width: "92%" }}
                >
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current shrink-0" />
                  ))}
                </div>
              </div>
              <p className="text-xs font-normal text-gray-600 dark:text-gray-400">
                Loved by growing sales teams
              </p>
            </div>
          </motion.div>
        </div>

        {/* Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-4 sm:mx-6 md:mx-8 lg:mx-20"
        >
          {/* Decorative gradient glow: a grainy vertical band sitting in the left margin,
              fading in from the top and fading out toward the bottom just like the panel above it */}
          <div
            className="pointer-events-none absolute -left-4 sm:-left-6 md:-left-8 lg:-left-20 top-0 h-full w-4 sm:w-6 md:w-8 lg:w-20 z-0 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#f0abfc] via-[#8b5cf6] via-90% to-[#4c1d95] blur-sm" />
            <div
              className="absolute inset-0 opacity-70 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMSAgMCAwIDAgMCAxICAwIDAgMCAwIDEgIDAgMCAwIDAuOSAwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+)",
                backgroundRepeat: "repeat",
                backgroundSize: "140px 140px",
              }}
            />
          </div>

          <div
            className="relative z-10 rounded-2xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl overflow-hidden"
            style={{
              maskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center gap-2 px-4 md:px-6 h-14 border-b border-gray-100 dark:border-gray-800">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Leads Pipeline</span>
              <Star className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700" />
            </div>

            {/* Tabs Row */}
            <div className="flex items-center gap-5 px-4 md:px-6 h-11 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap">
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Overview
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white border-b-2 border-primary h-11 -mb-px">
                <KanbanSquare className="h-3.5 w-3.5" /> Leads
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" /> Pipeline
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Reports
              </span>
              <span className="hidden md:flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> View
              </span>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="hidden md:block w-48 shrink-0 border-r border-gray-100 dark:border-gray-800 p-4 space-y-1">
                {sidebarItems.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      i === 1
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 md:px-6 h-10 items-center text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <span>Name</span>
                  <span className="hidden sm:block w-24">Status</span>
                  <span className="hidden md:block w-16">Owner</span>
                  <span className="w-16 text-right">Value</span>
                </div>
                {leadRows.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 md:px-6 h-14 items-center border-b border-gray-50 dark:border-gray-800/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{row.name}</span>
                    </div>
                    <span className="hidden sm:inline-flex w-24">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-full ${row.color}`}>
                        {row.status}
                      </span>
                    </span>
                    <span className="hidden md:block w-16">
                      <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </span>
                    <span className="w-16 flex justify-end">
                      <div className={`h-2.5 ${row.value} rounded bg-gray-200 dark:bg-gray-700`} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Fade the preview out toward the right edge */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 md:w-1/2 bg-gradient-to-r from-transparent to-white dark:to-gray-900" />
          </div>

          {/* Floating chip */}
          <div className="absolute z-20 top-24 -right-4 lg:-right-10 hidden lg:block">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-xl text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              AI Lead Scoring
            </motion.div>
          </div>
        </motion.div>

        {/* Trusted by */}
        <div className="mt-20 md:mt-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
          <p className="shrink-0 text-[13.5px] font-semibold mt-1 tracking-[0.2em] text-gray-500 dark:text-gray-600">
            TRUSTED BY THE BEST
          </p>
          <div className="relative flex-1 min-w-0 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 md:w-16 bg-linear-to-r from-white dark:from-gray-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-32 bg-linear-to-l from-white dark:from-gray-950 to-transparent" />
            <div className="flex w-max animate-marquee">
              {[...clientLogos, ...clientLogos].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 px-8 md:px-12 text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-600 grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:text-primary"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
