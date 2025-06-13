"use client"

import React, { useEffect, useState } from "react";
import { Settings2, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";

interface TopBarProps {
  isSidebarVisible: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ isSidebarVisible }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div
      className={`fixed right-4 z-30 transition-all duration-150 ${
        isSidebarVisible ? "top-6" : "top-2"
      }`}
    >
      <div className="flex items-center rounded-xl gap-0.5 p-1 transition-all duration-150 bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to border border-primary-button-border shadow-md">
        <Button
          aria-label="Go to settings"
          className="w-8 h-8 text-top-bar-icon-color bg-transparent hover:bg-sidebar-component-button-hover-background transition-colors duration-150 rounded-md"
        >
          <Settings2 className="w-6 h-6" />
        </Button>
        <Button
          onClick={toggleTheme}
          tabIndex={-1}
          className="w-8 h-8 text-top-bar-icon-color bg-transparent hover:bg-sidebar-component-button-hover-background transition-colors duration-150 rounded-md relative"
        >
          {mounted ? (
            <>
              <Sun className="w-6 h-6 absolute transition-all rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
              <Moon className="w-6 h-6 absolute transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
            </>
          ) : (
            <Sun className="w-6 h-6" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
};
