import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export const PageWrapper = ({ children, className = "" }: PageWrapperProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
    className={`min-h-screen pt-16 relative z-10 ${className}`}
  >
    {children}
  </motion.div>
);
