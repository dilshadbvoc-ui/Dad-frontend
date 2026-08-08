import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Logo from "../shared/Logo";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md dark:border-gray-800 py-3"
          : "bg-transparent py-5"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="lg" />
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
            <Link
              to="/register"
              className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Get a Demo
            </Link>
            <Link to="/login">
              <Button size="sm" className="border-none bg-gray-200! text-black! shadow-none px-4 md:h-10 md:px-5">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="px-4 md:h-10 md:px-5">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
