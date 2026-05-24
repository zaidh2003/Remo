"use client";

import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Calendar, AlertTriangle, CarFront, Users, Settings, UserCog, BellRing, Building2, ArrowRightLeft, Package, ClipboardList } from "lucide-react";
import { useLang } from "@/components/providers/language-provider";

interface NavItem {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  roles?: string[]; // If undefined, available to all
}

interface LumaBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
}

export function Navbar({ activeTab, setActiveTab, userRole }: LumaBarProps) {
  const { t } = useLang();

  const items: NavItem[] = [
    { id: "dashboard",  icon: <LayoutDashboard size={24} />, labelKey: "dashboard" },
    { id: "scheduler",  icon: <Calendar size={24} />,        labelKey: "scheduler",  roles: ["ADMIN", "MANAGER"] },
    { id: "tasks",      icon: <ClipboardList size={24} />,   labelKey: "tasks" },
    { id: "emergencies",icon: <AlertTriangle size={24} />,   labelKey: "emergencies" },
    { id: "swaps",      icon: <ArrowRightLeft size={24} />,  labelKey: "swapRequests" },
    { id: "shortage",   icon: <BellRing size={24} />,        labelKey: "shortage" },
    { id: "taxi",       icon: <CarFront size={24} />,        labelKey: "taxi" },
    { id: "inventory",  icon: <Package size={24} />,         labelKey: "inventory" },
    { id: "staff",      icon: <Users size={24} />,           labelKey: "staff" },
    { id: "users",      icon: <UserCog size={24} />,         labelKey: "users",      roles: ["ADMIN"] },
    { id: "branches",   icon: <Building2 size={24} />,       labelKey: "branches",   roles: ["ADMIN"] },
    { id: "settings",   icon: <Settings size={24} />,        labelKey: "settings",   roles: ["ADMIN"] },
  ];
  
  const visibleItems = items.filter(item => !item.roles || (userRole && item.roles.includes(userRole)));
  
  const activeIndex = visibleItems.findIndex(item => item.id === activeTab);
  const active = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-max max-w-[95vw]">
      <div className="relative flex items-center justify-center gap-2 sm:gap-6 bg-background/80 dark:bg-black/60 backdrop-blur-2xl rounded-full px-4 sm:px-6 py-3 shadow-2xl border border-border/50 overflow-hidden">
        
        {/* Active Indicator Glow */}
        <motion.div
          layoutId="active-indicator"
          className="absolute w-16 h-16 bg-gradient-to-r from-primary/80 to-blue-500/80 rounded-full blur-xl -z-10"
          animate={{
            left: `calc(${(active) * (100 / visibleItems.length)}% + ${100 / visibleItems.length / 2}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />

        {visibleItems.map((item, index) => {
          const isActive = index === active;
          return (
            <motion.div key={item.id} className="relative flex flex-col items-center group">
              {/* Button */}
              <motion.button
                aria-label={t[item.labelKey as keyof typeof t] as string || item.labelKey}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ scale: 1.15 }}
                animate={{ scale: isActive ? 1.25 : 1 }}
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 relative z-10 transition-colors ${
                  isActive 
                    ? 'text-primary dark:text-white drop-shadow-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
              </motion.button>

              {/* Tooltip */}
              <span className="absolute bottom-full mb-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-foreground text-background opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                {t[item.labelKey as keyof typeof t] || item.labelKey}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}