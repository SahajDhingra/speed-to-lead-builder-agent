"use client";
import { Btn, Spinner, StepSection } from "@/app/components/ui";
import { ProfileView, SystemView, SimTable, CritiquePanel, V2ComparisonPanel } from "@/app/components/AgentViews";
import { WorkflowCanvas } from "@/app/components/WorkflowCanvas";
import type { ClientRecord, AgentRun } from "@/app/types";

interface Props {
  selectedClient: ClientRecord | null;
  run: AgentRun;
  loading: string | null;
  onIngest: () => void;
  onGenerate: () => void;
  onSimulate: () => void;
  onCritique: () => void;
  onToggleApproval: (key: string, value: boolean) => void;
  onApply: () => void;
  onV2Simulate: () => void;
  onReset: () => void;
}

export function AgentTab({
  selectedClient,
  run,
  loading,
  onIngest,
  onGenerate,
  onSimulate,
  onCritique,
  onToggleApproval,
  onApply,
  onV2Simulate,
  onReset,
}: Props) {
  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Select a client from the Clients tab to begin.
      </div>
    );
  }

  const approvedCount = run.critiques
    ? run.critiques.flatMap((c) => c.improvements.filter((_, i) => run.approvals[`${c.leadId}-${i}`] === true)).length
    : 0;

  return (
    <div className="flex min-h-full">
      {/* ── Left: agent step controls ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 p-6 space-y-4 max-w-2xl">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Agent</h1>
            <p className="text-sm text-gray-500">Building custom speed-to-lead system for imported client <span className="font-medium text-gray-700">({selectedClient.name})</span></p>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 rounded px-2.5 py-1.5 transition-colors mt-0.5 shrink-0"
          >
            Reset / Clear run
          </button>
        </div>

      {/* Step 1 */}
      <StepSection step={1} title="Ingest Client Data" tooltip="Reads the client's raw business context and uses AI to extract a structured profile — services, pricing, coverage area, qualification signals, and brand voice.">
        <Btn onClick={onIngest} disabled={loading !== null}>
          {loading === "ingest" ? "Ingesting…" : run.profile ? "Re-ingest" : "Ingest Client Data"}
        </Btn>
        {loading === "ingest" && <Spinner label="Extracting ClientProfile via GPT-4o mini…" />}
        {run.profile && <ProfileView profile={run.profile} />}
      </StepSection>

      {/* Step 2 */}
      <StepSection step={2} title="Generate Custom Speed to Lead System" tooltip="Chains 3 AI calls to build a qualification strategy, 4-step email flow, and routing rules tailored to this specific client.">
        <Btn onClick={onGenerate} disabled={!run.profile || loading !== null}>
          {loading === "generate" ? "Generating…" : run.system ? "Re-generate" : "Generate System"}
        </Btn>
        {loading === "generate" && <Spinner label="Building qualification strategy, email flow, and routing rules…" />}
        {run.system && (
          <div>
            <p className="text-xs text-gray-400 mb-3">
              v{run.system.version} · {new Date(run.system.generatedAt).toLocaleTimeString()}
            </p>
            <SystemView system={run.system} />
          </div>
        )}
      </StepSection>

      {/* Step 3 */}
      <StepSection step={3} title="Run Test Leads" tooltip="Runs 6 varied test leads through the generated system, scoring each 0–100 and rendering the first email with all placeholders filled in.">
        <Btn onClick={onSimulate} disabled={!run.system || loading !== null}>
          {loading === "simulate" ? "Running…" : run.simResults ? "Re-run Simulation" : "Run Test Leads"}
        </Btn>
        {loading === "simulate" && <Spinner label="Running 6 test leads through the system in parallel…" />}
        {run.simResults && run.leads && <SimTable leads={run.leads} simResults={run.simResults} />}
      </StepSection>

      {/* Step 4 */}
      <StepSection step={4} title="Critique Results" tooltip="A hermes style AI Critic grades each lead's handling 1–10, explains its reasoning, and proposes targeted improvements with specific fields to change.">
        <div className="flex items-center gap-3">
          <Btn onClick={onCritique} disabled={!run.simResults || loading !== null}>
            {loading === "critique" ? "Grading…" : run.critiques ? "Re-run Critiques" : "Critique Results"}
          </Btn>
          {run.critiques && (
            <span className="text-sm text-gray-500">{approvedCount} improvement{approvedCount !== 1 ? "s" : ""} approved</span>
          )}
        </div>
        {loading === "critique" && <Spinner label="Grading each lead and proposing targeted improvements…" />}
        {run.critiques && run.leads && (
          <CritiquePanel
            leads={run.leads}
            critiques={run.critiques}
            approvals={run.approvals}
            onToggle={onToggleApproval}
          />
        )}
      </StepSection>

      {/* Step 5 */}
      <StepSection step={5} title="Apply Approved Improvements" tooltip="Applies your approved changes via a structured AI call to produce an updated version of the system with an incremented version number and full change log.">
        <Btn onClick={onApply} disabled={!run.critiques || approvedCount === 0 || loading !== null}>
          {loading === "apply"
            ? "Applying…"
            : run.updatedSystem
            ? "Re-apply"
            : `Apply ${approvedCount} Approved Change${approvedCount !== 1 ? "s" : ""}`}
        </Btn>
        {approvedCount === 0 && run.critiques && (
          <p className="text-xs text-gray-400">Approve at least one improvement above to enable this step.</p>
        )}
        {loading === "apply" && <Spinner label={`Applying ${approvedCount} improvements and generating v${(run.system?.version ?? 1) + 1}…`} />}
        {run.updatedSystem && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-[#49de80]/20 text-green-800 rounded text-xs font-semibold">
                v{run.updatedSystem.version}
              </span>
              <span className="text-xs text-gray-500">
                {approvedCount} change{approvedCount !== 1 ? "s" : ""} applied · {new Date(run.updatedSystem.generatedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="mb-4 rounded-lg border border-[#49de80]/30 bg-[#49de80]/5 px-4 py-3">
              <p className="text-xs font-semibold text-green-800 uppercase mb-2">Applied Changes</p>
              <ul className="space-y-1">
                {run.critiques?.flatMap((c) =>
                  c.improvements.filter((_, i) => run.approvals[`${c.leadId}-${i}`] === true)
                ).map((imp, i) => (
                  <li key={i} className="text-xs text-green-900">
                    <span className="font-mono text-[#49de80]">{imp.target}</span> — {imp.change}
                  </li>
                ))}
              </ul>
            </div>
            <SystemView system={run.updatedSystem} />
          </div>
        )}
      </StepSection>

      {/* Step 6 */}
      <StepSection step={6} title="Compare v1 vs v2 Performance" tooltip="Re-runs the exact same 6 test leads through the improved v2 system and shows a side-by-side score and grade comparison so you can see the concrete impact of your approved changes.">
        <Btn onClick={onV2Simulate} disabled={!run.updatedSystem || loading !== null}>
          {loading === "v2simulate" || loading === "v2critique"
            ? "Running…"
            : run.v2SimResults
            ? "Re-run v2 Comparison"
            : "Re-run Simulation on v2"}
        </Btn>
        {!run.updatedSystem && (
          <p className="text-xs text-gray-400">Apply approved improvements above to unlock v2 comparison.</p>
        )}
        {loading === "v2simulate" && <Spinner label="Re-running 6 leads through v2 system…" />}
        {loading === "v2critique" && <Spinner label="Grading v2 results…" />}
        {run.v2SimResults && run.leads && run.simResults && (
          <V2ComparisonPanel
            leads={run.leads}
            simResults={run.simResults}
            v2SimResults={run.v2SimResults}
            critiques={run.critiques}
            v2Critiques={run.v2Critiques}
          />
        )}
      </StepSection>
      </div>

      {/* ── Right: workflow canvas ───────────────────────────────────────── */}
      <div className="hidden lg:block w-[390px] shrink-0 sticky top-0 self-start max-h-screen overflow-y-auto border-l border-gray-100 bg-white">
        <div className="p-4">
          <WorkflowCanvas run={run} />
        </div>
      </div>
    </div>
  );
}
