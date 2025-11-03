import React from "react";
import { Notepad } from "@/components/ui/Notepad";
import {
  IconHome,
  IconMusic,
  IconNotebook,
  IconWorld,
  IconPaint,
  IconCalendarEvent,
} from "@tabler/icons-react";
import Calendar from "@/components/ui/Calendar";
import Globe from "@/components/ui/Globe";
import { FloatingDock } from "@/components/ui/floating-dock";
import { PhotoEditorChat } from "@/components/ui/PhotoEditorChat";

export type GlobeResult = {
  lat?: number;
  lng?: number;
  address?: string;
  routePolyline?: string;
};

export const ComputerDisplay: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  globeResult?: GlobeResult;
  children?: React.ReactNode;
}> = ({ activeTab, setActiveTab, globeResult, children }) => {
  // Keep Globe mounted, only show/hide via CSS and update lat/lng props
  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full">
        <div style={{ display: activeTab === "notepad" ? "block" : "none" }}>
          <Notepad />
        </div>
        <div style={{ display: activeTab === "globe" ? "block" : "none" }}>
          <Globe
            lat={globeResult?.lat}
            lng={globeResult?.lng}
            address={globeResult?.address}
            routePolyline={globeResult?.routePolyline}
          />
        </div>
        <div style={{ display: activeTab === "calendar" ? "block" : "none" }}>
          <Calendar />
        </div>

        {/* Render children for other tabs */}
        {activeTab !== "notepad" &&
        activeTab !== "globe" &&
        activeTab !== "dictionary" &&
        activeTab !== "calendar"
          ? children
          : null}
      </div>
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-50">
        <FloatingDock
          items={[
            {
              title: "Home",
              icon: (
                <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
              ),
              href: "#home",
              key: "home",
            },
            {
              title: "Photo Editor",
              icon: (
                <IconPaint className="h-full w-full text-neutral-500 dark:text-neutral-300" />
              ),
              href: "#photo",
              key: "photo",
            },
            {
              title: "Music Player",
              icon: (
                <IconMusic className="h-full w-full text-neutral-500 dark:text-neutral-300" />
              ),
              href: "#music",
              key: "music",
            },
            {
              title: "Notepad",
              icon: (
                <IconNotebook className="h-full w-full text-neutral-500 dark:text-neutral-300" />
              ),
              href: "#notepad",
              key: "notepad",
            },
            {
              title: "Maps",
              icon: (
                <IconWorld className="h-full w-full text-neutral-500 dark:text-neutral-300" />
              ),
              href: "#globe",
              key: "globe",
            },
            {
              title: "Calendar",
              icon: (
                <IconCalendarEvent className="h-full w-full text-neutral-500 dark:text-neutral-300" />
              ),
              href: "#calendar",
              key: "calendar",
            },
          ]}
          desktopClassName=""
          mobileClassName=""
          onSelect={setActiveTab}
        />
      </div>
    </div>
  );
};
