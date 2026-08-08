import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ImageIcon } from "lucide-react";
// import logoDark from "@/assets/logo-dark.png";
import Logo from "../shared/Logo01";
export default function GetStartedBanner() {
  return (
    <section className="py-12 md:py-20 px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gray-950">
          {/* Purple glow matching our logo's indigo/violet, in place of ClickUp's pink */}
          <div className="pointer-events-none absolute -right-1/4 -bottom-1/2 w-[70%] aspect-square rounded-full bg-gradient-to-br from-violet-600 via-indigo-600 to-transparent blur-3xl opacity-70" />
          <div className="pointer-events-none absolute right-0 top-0 w-1/2 h-full bg-gradient-to-bl from-indigo-500/40 via-violet-600/10 to-transparent blur-2xl" />

          <div className="relative flex flex-col lg:py-9 md:flex-row md:min-h-[250px]">
            {/* Text */}
            <div className="relative z-10 w-full md:w-1/2 lg:w-[60%] px-8 py-8 md:px-12 md:py-8 lg:px-16 flex flex-col justify-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
            <Logo size="lg" />
          </Link>

              <h2
                className="text-3xl md:text-4xl font-[550] mt-2 text-white tracking-tighter leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Start simple. Sell smarter.
              </h2>
              <p className="text-white text-lg leading-snug lg:mb-10 max-w-lg">
                Set up your first pipeline in minutes, then customize fields, statuses, and
                automations as your sales team grows.
              </p>
              <div>
                <Link to="/register">
                  <Button variant="secondary" size="lg">
                    Get started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* CRM screenshot — mobile: normal flow, contained */}
            <div className="md:hidden relative z-10 w-full px-8 pb-8">
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
                {/* TODO: replace with a real CRM dashboard screenshot */}
                <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 bg-white/5 p-8 text-center">
                  <ImageIcon className="h-8 w-8 text-white/30" />
                  <p className="text-sm text-white/40 max-w-[220px]">
                    Add a screenshot of the CRM dashboard here
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CRM screenshot — desktop: oversized and anchored bottom-right, so only
              its top-left corner sits inside the banner and the rest bleeds off the
              right/bottom edges, clipped by the banner's own rounded overflow-hidden */}
          <div className="hidden md:block absolute z-10 top-[22%] right-[-6%] p-3 w-[45%] aspect-[16/10] rounded-tl-[34px] overflow-hidden shadow-2xl bg-white/40 border border-white">
            {/* TODO: replace with a real CRM dashboard screenshot */}
            <div className="flex h-full min-h-0 w-full flex-col items-center border border-white rounded-tl-[25px] justify-center gap-3 bg-white/5 p-8 text-center">
              <ImageIcon className="h-8 w-8 text-white/30" />
              <p className="text-sm text-white/40 max-w-55">
                Add a screenshot of the CRM dashboard here
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
