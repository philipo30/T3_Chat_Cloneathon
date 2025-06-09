import React from "react";
import { Settings2, SunMoon } from "lucide-react";
import { Button } from "./ui/button";

export const TopBar: React.FC = () => {
  return (
    <div className="fixed right-2 top-2 z-30">
      <div className="flex items-center rounded-lg gap-0.5 p-1 transition-all duration-150">
        <Button
          aria-label="Go to settings"
          className="w-8 h-8 text-[rgb(231,208,221)] hover:bg-transparent transition-colors duration-150 rounded-md"
        >
          <Settings2 className="w-6 h-6" />
        </Button>
        <Button
          tabIndex={-1}
          className="w-8 h-8 text-[rgb(231,208,221)] hover:bg-transparent transition-colors duration-150 rounded-md relative"
        >
          <SunMoon className="w-6 h-6 absolute" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
};
