"use client";

import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Calendar, AlertTriangle, CarFront, Users, Settings, UserCog, BellRing } from "lucide-react";

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[]; // If undefined, available to all
}

const items: NavItem[] = [
  { id: "dashboard",  icon: <LayoutDashboard size={24} />, label: "Dashboard" },
  { id: "scheduler",  icon: <Calendar size={24} />,        label: "Scheduler",  roles: ["ADMIN", "MANAGER"] },
  { id: "emergencies",icon: <AlertTriangle size={24} />,   label: "Emergencies" },
  { id: "shortage",   icon: <BellRing size={24} />,        label: "Shortage" },
  { id: "taxi",       icon: <CarFront size={24} />,        label: "Transport" },
  { id: "staff",      icon: <Users size={24} />,           label: "Staff",      roles: ["ADMIN", "MANAGER"] },
  { id: "users",      icon: <UserCog size={24} />,         label: "Users",      roles: ["ADMIN", "MANAGER"] },
  { id: "settings",   icon: <Settings size={24} />,        label: "Settings",   roles: ["ADMIN"] },
];

interface LumaBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
}

export function Navbar({ activeTab, setActiveTab, userRole }: LumaBarProps) {
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
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}