import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import FeatureSection from "@/components/landing/FeatureSection";
import PricingTable from "@/components/landing/PricingTable";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <LandingNavbar />
            <main>
                <Hero />
                <FeatureSection />
                <PricingTable />

                {/* CTA Section */}
                <section className="py-20 bg-blue-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600 opacity-20 brightness-100 contrast-150"></div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Ready to transform your sales?
                        </h2>
                        <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                            Join thousands of teams who are closing more deals with less effort. Start your 14-day free trial today.
                        </p>
                        <a href="/register" className="inline-flex items-center justify-center bg-white text-blue-600 font-bold py-4 px-8 rounded-full shadow-xl hover:bg-gray-50 transition-transform hover:scale-105">
                            Get Started Now
                        </a>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
