import type { ClientProfile, GeneratedSystem, SimResult, Lead, Critique } from "@/lib/schemas";

export interface ClientRecord {
  id: string;
  name: string;
  rawContext: string | null; // null = read from data/roofing-client.md
  addedAt: string;
}

export interface AgentRun {
  profile: ClientProfile | null;
  system: GeneratedSystem | null;
  leads: Lead[] | null;
  simResults: SimResult[] | null;
  critiques: Critique[] | null;
  approvals: Record<string, boolean>;
  updatedSystem: GeneratedSystem | null;
  v2SimResults: SimResult[] | null;
  v2Critiques: Critique[] | null;
  runAt: string | null;
}

export const EMPTY_RUN: AgentRun = {
  profile: null,
  system: null,
  leads: null,
  simResults: null,
  critiques: null,
  approvals: {},
  updatedSystem: null,
  v2SimResults: null,
  v2Critiques: null,
  runAt: null,
};

export const DEFAULT_CLIENT: ClientRecord = {
  id: "genaipi-roofing",
  name: "GenAIPI Roofing",
  rawContext: null,
  addedAt: new Date().toISOString(),
};

export type TabId = "dashboard" | "clients" | "agent" | "integrations" | "deployments";
