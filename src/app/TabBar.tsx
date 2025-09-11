"use client";
import React from "react";
import { Home, Image, Music } from "lucide-react";

export function TabBar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabList = [
    { key: "home", icon: <Home size={28} />, label: "Home" },
    { key: "photo", icon: <Image size={28} />, label: "Photo Editor" },
    { key: "music", icon: <Music size={28} />, label: "Music Player" },
  ];
  return (
    <div className="flex items-center justify-center">
      <div className="flex gap-6 px-4 py-2">
        {tabList.map(tab => (
          <button
            key={tab.key}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-full font-semibold focus:outline-none text-base
              ${activeTab === tab.key ? "bg-white/80 dark:bg-gray-900/80 text-primary shadow-lg" : "bg-white/60 dark:bg-gray-800/60 text-gray-500 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-700/80"}
            `}
            style={{
              transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
              transform: activeTab === tab.key ? "scale(1.18)" : "scale(1)",
              boxShadow: activeTab === tab.key ? "0 4px 24px 0 rgba(31, 38, 135, 0.25)" : "0 2px 8px 0 rgba(31, 38, 135, 0.10)",
              border: "none"
            }}
            onClick={e => {
              setActiveTab(tab.key);
              // Bounce animation
              const icon = e.currentTarget.querySelector("span");
              if (icon) {
                icon.animate([
                  { transform: "scale(1.18)" },
                  { transform: "scale(1.35)" },
                  { transform: "scale(1.18)" }
                ], {
                  duration: 350,
                  easing: "cubic-bezier(.4,0,.2,1)"
                });
              }
            }}
            aria-label={tab.label}
            title={tab.label}
          >
            <span
              className={`transition-transform duration-300 ${activeTab === tab.key ? "scale-125" : "scale-100"}`}
              style={{
                color: activeTab === tab.key ? "#3b82f6" : undefined,
                transition: "color 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1)"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.22)"}
              onMouseLeave={e => e.currentTarget.style.transform = activeTab === tab.key ? "scale(1.25)" : "scale(1)"}
            >
              {tab.icon}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}