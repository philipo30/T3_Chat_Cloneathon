import React from "react";
import { PanelLeft, Search, Plus } from "lucide-react";

interface CompactButtonBarProps {
  onToggleSidebar: () => void;
}

export const CompactButtonBar: React.FC<CompactButtonBarProps> = ({
  onToggleSidebar,
}) => {
  return (
    <div
      className="fixed left-2 top-2 z-50 flex gap-0.5 p-1"
      style={{
        backgroundColor: "rgb(33, 20, 30)",
      }}
    >
      {/* Background blur effect */}
      <div
        className="absolute inset-0 backdrop-blur-sm rounded-md pointer-events-none -z-10 transition-all duration-150"
        style={{
          backgroundColor: "rgba(19, 19, 20, 0.5)",
          width: "108px",
        }}
      />

      {/* Toggle Sidebar Button */}
      <button
        onClick={onToggleSidebar}
        className="flex items-center justify-center w-8 h-8 bg-transparent border-0 text-[rgb(231,208,221)] rounded-md transition-all duration-150 z-10 hover:text-white hover:bg-gray-500/25 border-0 bg-transparent"
        style={{
          color: "rgb(231, 208, 221)",
          fontSize: "12px",
          fontWeight: "500",
          gap: "8px",
        }}
      >
        <PanelLeft className="w-4 h-4 flex-shrink-0" />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {/* Search Button */}
      <button
        className="flex items-center justify-center w-8 h-8 bg-transparent border-0 text-[rgb(231,208,221)] rounded-md transition-all duration-150 hover:text-white hover:bg-gray-500/25 border-0 bg-transparent"
        style={{
          color: "rgb(231, 208, 221)",
          fontSize: "14px",
          fontWeight: "500",
          animation: "0s ease 0.15s 1 normal none running none",
          animationDelay: "0.15s",
          transitionDelay: "0.15s",
          transitionProperty: "transform, opacity",
        }}
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="sr-only">Search</span>
      </button>

      {/* New Thread Button */}
      <a
        href="#"
        className="flex items-center justify-center w-8 h-8 text-[rgb(231,208,221)] rounded-md transition-all duration-150 "
        style={{
          color: "rgb(231, 208, 221)",
          fontSize: "14px",
          fontWeight: "500",
          animation: "0.15s ease 0.15s 1 normal none running none",
          animationDelay: "0.15s",
          transitionDelay: "0.15s",
          transitionProperty: "transform, opacity",
        }}
      >
        <Plus className="w-4 h-4 flex-shrink-0" />
        <span className="sr-only">New Thread</span>
      </a>
    </div>
  );
};
