import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const rowGroupClass =
  "grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 bg-gray-200 md:divide-x divide-gray-200 dark:divide-gray-800";
const textCellClass = "flex flex-col bg-white justify-center rounded-[6px] gap-4 py-10 md:py-16 md:px-12 lg:px-16";
const imageCellClass = "flex items-center ";

export default function FeatureSpotlight() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950 px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
      <div className="container mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 mb-16 md:mb-20"
        >
          Bring clarity to every deal, fast
        </motion.h2>

        <div className="relative overflow-hidden divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
          {/* Fade the grid out at both edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 md:w-28 bg-linear-to-r from-white dark:from-gray-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 md:w-28 bg-linear-to-l from-white dark:from-gray-950 to-transparent" />

          <div className={rowGroupClass}>
            <div className={textCellClass}>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
                Turn any lead into a clear next step in minutes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Create follow-ups with owners, due dates, and priorities in seconds. PypeCRM AI
                fills in the details so your team can skip the setup and get straight to selling.
              </p>
              <div>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    Get started <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className={imageCellClass}>
              <img
                src="/AI-Powered%20CRM%20Lead%20Insights.png"
                alt="AI-powered CRM lead insights"
                className="w-full rounded-[6px] object-cover"
              />
            </div>
          </div>

          <div className={rowGroupClass}>
            <div className={imageCellClass}>
              <img
                src="/Collaborative%20CRM.png"
                alt="Collaborative CRM activity feed"
                className="w-full rounded-[6px] object-cover"
              />
            </div>

            <div className={textCellClass}>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
                Know who&apos;s doing what, without asking
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Notes, @mentions, and real-time updates keep your sales team aligned without
                another status meeting. PypeCRM AI flags leads at risk of going cold so nothing
                slips through.
              </p>
              <div>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    Get started <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
