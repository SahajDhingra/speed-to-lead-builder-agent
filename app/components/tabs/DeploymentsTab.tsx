"use client";
import { useState } from "react";
import { EmptyState } from "@/app/components/ui";
import { SystemView } from "@/app/components/AgentViews";
import type { ClientRecord } from "@/app/types";
import type { GeneratedSystem } from "@/lib/schemas";

interface Props {
  clients: ClientRecord[];
  deployments: Record<string, GeneratedSystem[]>;
}

export function DeploymentsTab({ clients, deployments }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const allDeployments = clients.flatMap((c) =>
    (deployments[c.id] ?? []).map((sys) => ({ client: c, system: sys }))
  ).sort((a, b) => b.system.generatedAt.localeCompare(a.system.generatedAt));

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Deployments</h1>
        <p className="text-sm text-gray-500">Version history across all clients</p>
      </div>

      {allDeployments.length === 0 ? (
        <EmptyState message="No deployments yet. Run the Agent to generate and apply a system. Note: Deployment history disappears upon page refresh." />
      ) : (
        <div className="space-y-3">
          {allDeployments.map(({ client, system }) => {
            const key = `${client.id}-v${system.version}`;
            const isOpen = expanded === key;
            return (
              <div key={key} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      system.version >= 2
                        ? "bg-[#49de80]/20 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      v{system.version}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(system.generatedAt).toLocaleString()} ·{" "}
                        {system.emailFlow.length} emails · {system.routingLogic.length} routing rules
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs shrink-0">{isOpen ? "▲ Collapse" : "▼ Expand"}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3">
                      <SystemView system={system} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
