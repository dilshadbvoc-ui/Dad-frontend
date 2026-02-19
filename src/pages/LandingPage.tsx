import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import FeatureSection from "@/components/landing/FeatureSection";
import IntegrationSection from "@/components/landing/IntegrationSection";
import Testimonials from "@/components/landing/Testimonials";
import PricingTable from "@/components/landing/PricingTable";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <SEO
                title="Intelligent Lead Management & Sales Automation"
                description="Accelerate your sales with Pype CRM. The all-in-one platform for lead tracking, automated follow-ups, and pipeline management."
                keywords="Pype CRM, Lead Management, Sales Automation, CRM Software, Pipeline Tracking"
            />
            <LandingNavbar />
            <main>
                <Hero />
                <FeatureSection />
                <IntegrationSection />
                <Testimonials />
                <PricingTable />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
