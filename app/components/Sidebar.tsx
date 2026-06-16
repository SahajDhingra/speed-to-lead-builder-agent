"use client";
import type { TabId } from "@/app/types";

const NAV: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: "▣" },
  { id: "clients",      label: "Clients",      icon: "◉" },
  { id: "agent",        label: "Agent",        icon: "⚡" },
  { id: "integrations", label: "Integrations", icon: "⬡" },
  { id: "deployments",  label: "Deployments",  icon: "⬤" },
];

export function Sidebar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <aside className="w-52 shrink-0 bg-gray-950 flex flex-col h-screen sticky top-0">
      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ id, label, icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                isActive
                  ? "bg-[#49de80]/10 text-[#49de80] font-medium border-l-2 border-[#49de80]"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-l-2 border-transparent"
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-gray-600 text-xs">GenAIPI Challenge</p>
      </div>
    </aside>
  );
}
