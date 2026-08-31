import { useEffect, useState } from "react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Wrench, Download, Loader2 } from "lucide-react";
import { getLatestRelease, getDownloadUrl, type AppRelease, type AppReleasePlatform } from "@/services/appReleaseService";

interface AppEntry {
  platform: AppReleasePlatform;
  title: string;
  description: string;
  icon: typeof Smartphone;
}

const APPS: AppEntry[] = [
  {
    platform: "mobile",
    title: "PypeCRM",
    description: "The main CRM app for leads, follow-ups, reports, and field sales.",
    icon: Smartphone,
  },
  {
    platform: "helper",
    title: "PypeCRM Helper",
    description: "Companion app for call recording and WhatsApp reply sync.",
    icon: Wrench,
  },
];

export default function DownloadApp() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title="Download the App | Pype CRM"
        description="Download the PypeCRM mobile app and PypeCRM Helper companion app."
        canonical="https://pypecrm.com/download"
      />
      <LandingNavbar />
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Download PypeCRM
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Get the latest Android build directly — no Play Store needed.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {APPS.map((app) => (
              <AppDownloadCard key={app.platform} app={app} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AppDownloadCard({ app }: { app: AppEntry }) {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const Icon = app.icon;

  useEffect(() => {
    let cancelled = false;
    getLatestRelease(app.platform).then((data) => {
      if (!cancelled) {
        setRelease(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [app.platform]);

  return (
    <Card className="rounded-3xl border-none shadow-sm bg-gray-50 dark:bg-gray-900">
      <CardHeader>
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 mb-4 w-fit">
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">{app.title}</CardTitle>
        <p className="text-gray-500 dark:text-gray-400">{app.description}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking latest version…
          </div>
        ) : release ? (
          <>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Version {release.versionName}
            </div>
            {release.releaseNotes && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{release.releaseNotes}</p>
            )}
            <a href={getDownloadUrl(app.platform)} className="inline-block">
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Download APK
              </Button>
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">No release published yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
