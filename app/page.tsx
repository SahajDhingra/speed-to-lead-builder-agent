"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/app/components/Sidebar";
import { AgentTab } from "@/app/components/tabs/AgentTab";
import { DashboardTab } from "@/app/components/tabs/DashboardTab";
import { ClientsTab } from "@/app/components/tabs/ClientsTab";
import { IntegrationsTab } from "@/app/components/tabs/IntegrationsTab";
import { DeploymentsTab } from "@/app/components/tabs/DeploymentsTab";
import {
  DEFAULT_CLIENT, EMPTY_RUN,
  type TabId, type ClientRecord, type AgentRun,
} from "@/app/types";
import type { ClientProfile, GeneratedSystem, SimResult, Lead, Critique } from "@/lib/schemas";

// ── state helpers ──────────────────────────────────────────────────────────

function updateRun(
  setRuns: React.Dispatch<React.SetStateAction<Record<string, AgentRun>>>,
  clientId: string,
  patch: Partial<AgentRun>
) {
  setRuns((prev) => ({
    ...prev,
    [clientId]: { ...(prev[clientId] ?? EMPTY_RUN), ...patch },
  }));
}

// ── shell ──────────────────────────────────────────────────────────────────

export default function Shell() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [clients, setClients] = useState<ClientRecord[]>([DEFAULT_CLIENT]);
  const [selectedClientId, setSelectedClientId] = useState<string>(DEFAULT_CLIENT.id);
  const [runs, setRuns] = useState<Record<string, AgentRun>>({});
  const [deployments, setDeployments] = useState<Record<string, GeneratedSystem[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const run = runs[selectedClientId] ?? EMPTY_RUN;

  // ── generic fetch wrapper ──────────────────────────────────────────────

  async function call<T>(step: string, url: string, body?: object): Promise<T | null> {
    setLoading(step);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      return data as T;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(null);
    }
  }

  // ── agent handlers ─────────────────────────────────────────────────────

  async function runIngest() {
    const client = clients.find((c) => c.id === selectedClientId);
    const body = client?.rawContext ? { rawText: client.rawContext } : {};
    const profile = await call<ClientProfile>("ingest", "/api/ingest", body);
    if (profile) {
      updateRun(setRuns, selectedClientId, {
        profile, system: null, leads: null, simResults: null,
        critiques: null, approvals: {}, updatedSystem: null, runAt: new Date().toISOString(),
      });
    }
  }

  async function runGenerate() {
    const system = await call<GeneratedSystem>("generate", "/api/generate", run.profile!);
    if (system) {
      updateRun(setRuns, selectedClientId, {
        system, leads: null, simResults: null, critiques: null,
        approvals: {}, updatedSystem: null,
      });
      // Record v1 deployment
      setDeployments((prev) => ({
        ...prev,
        [selectedClientId]: [system],
      }));
    }
  }

  async function runSimulate() {
    const data = await call<{ leads: Lead[]; simResults: SimResult[] }>(
      "simulate", "/api/simulate", { system: run.system }
    );
    if (data) {
      updateRun(setRuns, selectedClientId, {
        leads: data.leads, simResults: data.simResults,
        critiques: null, approvals: {}, updatedSystem: null,
      });
    }
  }

  async function runCritique() {
    const data = await call<{ critiques: Critique[] }>(
      "critique", "/api/critique",
      { system: run.system, leads: run.leads, simResults: run.simResults }
    );
    if (data) {
      updateRun(setRuns, selectedClientId, {
        critiques: data.critiques, approvals: {}, updatedSystem: null,
      });
    }
  }

  function toggleApproval(key: string, value: boolean) {
    setRuns((prev) => {
      const r = prev[selectedClientId] ?? EMPTY_RUN;
      const next = r.approvals[key] === value
        ? Object.fromEntries(Object.entries(r.approvals).filter(([k]) => k !== key))
        : { ...r.approvals, [key]: value };
      return { ...prev, [selectedClientId]: { ...r, approvals: next } };
    });
  }

  async function runApply() {
    const approvedImprovements = (run.critiques ?? []).flatMap((c) =>
      c.improvements.filter((_, i) => run.approvals[`${c.leadId}-${i}`] === true)
    );
    const updated = await call<GeneratedSystem>(
      "apply", "/api/apply", { system: run.system, approvedImprovements }
    );
    if (updated) {
      updateRun(setRuns, selectedClientId, { updatedSystem: updated });
      // Append v2+ deployment
      setDeployments((prev) => ({
        ...prev,
        [selectedClientId]: [...(prev[selectedClientId] ?? []), updated],
      }));
    }
  }

  // ── client handlers ────────────────────────────────────────────────────

  const handleSelectClient = useCallback((id: string) => {
    setSelectedClientId(id);
    setActiveTab("agent");
  }, []);

  async function handleAddClient(name: string, rawContext: string) {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawContext }),
      });
      const profile: ClientProfile = await res.json();
      if (!res.ok) throw new Error((profile as unknown as { error: string }).error);

      const id = `client-${Date.now()}`;
      const record: ClientRecord = { id, name, rawContext, addedAt: new Date().toISOString() };
      setClients((prev) => [...prev, record]);
      setSelectedClientId(id);
      updateRun(setRuns, id, { profile, runAt: new Date().toISOString() });
      setActiveTab("agent");
    } catch (e) {
      setError(String(e));
    } finally {
      setAdding(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="shrink-0 bg-gray-900 text-white px-6 py-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold tracking-tight">Speed-To-Lead Builder Agent</h1>
          <p className="text-gray-400 text-sm mt-0.5">GenAIPI Roofing · AI harness</p>
        </header>

        {/* Error banner */}
        {error && (
          <div className="shrink-0 bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700 flex items-center justify-between">
            {error}
            <button className="text-red-400 hover:text-red-600" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && (
            <DashboardTab clients={clients} runs={runs} deployments={deployments} onNavigate={setActiveTab} />
          )}
          {activeTab === "clients" && (
            <ClientsTab
              clients={clients}
              selectedClientId={selectedClientId}
              adding={adding}
              onSelect={handleSelectClient}
              onAdd={handleAddClient}
              onNavigateToAgent={() => setActiveTab("agent")}
            />
          )}
          {activeTab === "agent" && (
            <AgentTab
              selectedClient={selectedClient}
              run={run}
              loading={loading}
              onIngest={runIngest}
              onGenerate={runGenerate}
              onSimulate={runSimulate}
              onCritique={runCritique}
              onToggleApproval={toggleApproval}
              onApply={runApply}
            />
          )}
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "deployments" && (
            <DeploymentsTab clients={clients} deployments={deployments} />
          )}
        </main>
      </div>
    </div>
  );
}
