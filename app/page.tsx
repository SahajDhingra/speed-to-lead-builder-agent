"use client";

import { useState, useCallback, useEffect } from "react";
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

// ── localStorage persistence ────────────────────────────────────────────────

const STORAGE_KEY = "stl-agent-v1";

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
  const [isHydrated, setIsHydrated] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const run = runs[selectedClientId] ?? EMPTY_RUN;

  // ── localStorage: rehydrate on mount ───────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.version === 1) {
          if (Array.isArray(saved.clients) && saved.clients.length > 0)
            setClients(saved.clients);
          if (saved.selectedClientId)
            setSelectedClientId(saved.selectedClientId);
          if (saved.runs && typeof saved.runs === "object")
            setRuns(saved.runs);
          if (saved.deployments && typeof saved.deployments === "object")
            setDeployments(saved.deployments);
        }
      }
    } catch {
      // corrupted storage — start fresh
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // ── localStorage: persist on change (only after hydration) ─────────────

  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, clients, selectedClientId, runs, deployments })
      );
    } catch {
      // quota exceeded or private browsing — silently ignore
    }
  }, [isHydrated, clients, selectedClientId, runs, deployments]);

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
    const client = clients.find((c) => c.id === selectedClientId);
    const isCustomClient = !!client?.rawContext;

    // For custom clients, generate vertical-matched leads first so the pipeline
    // is client-agnostic. For the default roofing client (rawContext === null),
    // omit leads and let the route read the hardcoded test-leads.json.
    let generatedLeads: Lead[] | undefined;
    if (isCustomClient && run.profile) {
      const leadsData = await call<{ leads: Lead[] }>(
        "simulate", "/api/generate-leads", { profile: run.profile }
      );
      if (!leadsData) return;
      generatedLeads = leadsData.leads;
    }

    const data = await call<{ leads: Lead[]; simResults: SimResult[] }>(
      "simulate", "/api/simulate",
      generatedLeads
        ? { system: run.system, leads: generatedLeads }
        : { system: run.system }
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

  async function runV2Simulate() {
    const data = await call<{ leads: Lead[]; simResults: SimResult[] }>(
      "v2simulate", "/api/simulate", { system: run.updatedSystem, leads: run.leads }
    );
    if (!data) return;
    updateRun(setRuns, selectedClientId, { v2SimResults: data.simResults });

    const critiqueData = await call<{ critiques: Critique[] }>(
      "v2critique", "/api/critique",
      { system: run.updatedSystem, leads: run.leads, simResults: data.simResults }
    );
    if (critiqueData) {
      updateRun(setRuns, selectedClientId, { v2Critiques: critiqueData.critiques });
    }
  }

  // ── reset ──────────────────────────────────────────────────────────────

  function clearRun() {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
    setClients([DEFAULT_CLIENT]);
    setSelectedClientId(DEFAULT_CLIENT.id);
    setRuns({});
    setDeployments({});
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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Full-width top header */}
      <header className="shrink-0 bg-gray-900 px-6 py-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold tracking-tight text-[#49de80]">Speed-To-Lead Builder Agent</h1>
        <p className="text-[#49de80]/60 text-sm mt-0.5">GenAIPI Roofing · AI harness</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeTab} onChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
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
            <DashboardTab clients={clients} runs={runs} deployments={deployments} onNavigate={setActiveTab} onReset={clearRun} />
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
              onV2Simulate={runV2Simulate}
            />
          )}
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "deployments" && (
            <DeploymentsTab clients={clients} deployments={deployments} />
          )}
        </main>
        </div>
      </div>
    </div>
  );
}
