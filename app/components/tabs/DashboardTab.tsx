"use client";
import { Card, EmptyState } from "@/app/components/ui";
import type { ClientRecord, AgentRun, TabId } from "@/app/types";
import type { GeneratedSystem } from "@/lib/schemas";

interface Props {
  clients: ClientRecord[];
  runs: Record<string, AgentRun>;
  deployments: Record<string, GeneratedSystem[]>;
  onNavigate: (tab: TabId) => void;
}

export function DashboardTab({ clients, runs, deployments, onNavigate }: Props) {
  // Aggregate across all runs
  const allRuns = Object.values(runs);
  const lastRun = allRuns.filter((r) => r.runAt).sort((a, b) =>
    (b.runAt ?? "").localeCompare(a.runAt ?? "")
  )[0] ?? null;

  const totalDeployments = Object.values(deployments).flat().length;

  // Evals computed from the most recent run that has critiques
  const evalRun = allRuns.find((r) => r.critiques && r.simResults) ?? null;
  const avgGrade = evalRun?.critiques
    ? (evalRun.critiques.reduce((s, c) => s + c.grade, 0) / evalRun.critiques.length).toFixed(1)
    : null;
  const totalImprovements = evalRun?.critiques?.reduce((s, c) => s + c.improvements.length, 0) ?? 0;
  const approvedCount = evalRun
    ? Object.values(evalRun.approvals).filter(Boolean).length
    : 0;

  // Score distribution
  const scores = evalRun?.simResults?.map((s) => s.qualificationScore) ?? [];
  const hot = scores.filter((s) => s >= 80).length;
  const warm = scores.filter((s) => s >= 50 && s < 80).length;
  const cold = scores.filter((s) => s < 50).length;

  // v2 delta
  const v2Count = Object.values(deployments).filter((d) => d.length >= 2).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your speed-to-lead pipeline</p>
      </div>

      {/* Top stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Clients"
          value={String(clients.length)}
          sub="active"
          onClick={() => onNavigate("clients")}
        />
        <StatTile
          label="Agent Runs"
          value={String(allRuns.filter((r) => r.runAt).length)}
          sub={lastRun?.runAt ? `last ${relTime(lastRun.runAt)}` : "none yet"}
          onClick={() => onNavigate("agent")}
        />
        <StatTile
          label="Deployments"
          value={String(totalDeployments)}
          sub={`${v2Count} client${v2Count !== 1 ? "s" : ""} at v2+`}
          onClick={() => onNavigate("deployments")}
        />
        <StatTile
          label="Avg Grade"
          value={avgGrade ? `${avgGrade}/10` : "—"}
          sub={avgGrade ? "latest critique run" : "run critiques first"}
          accent={avgGrade ? Number(avgGrade) >= 7 : false}
        />
      </div>

      {/* Evals tile */}
      <Card title="Latest Eval Run">
        {!evalRun ? (
          <EmptyState message="Run the Agent → Simulate → Critique to see eval results here." />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <EvalStat label="Score Distribution">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#49de80] font-medium">Hot (≥80)</span>
                  <span className="font-semibold">{hot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600 font-medium">Warm (50–79)</span>
                  <span className="font-semibold">{warm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500 font-medium">Cold (&lt;50)</span>
                  <span className="font-semibold">{cold}</span>
                </div>
              </div>
            </EvalStat>
            <EvalStat label="Avg Critique Grade">
              <p className={`text-3xl font-bold ${Number(avgGrade) >= 7 ? "text-green-700" : Number(avgGrade) >= 5 ? "text-yellow-600" : "text-red-600"}`}>
                {avgGrade ?? "—"}
              </p>
              <p className="text-xs text-gray-400">out of 10</p>
            </EvalStat>
            <EvalStat label="Improvements">
              <p className="text-3xl font-bold text-gray-900">{approvedCount}<span className="text-lg text-gray-400">/{totalImprovements}</span></p>
              <p className="text-xs text-gray-400">approved of proposed</p>
            </EvalStat>
            <EvalStat label="v2 Status">
              {evalRun.updatedSystem ? (
                <>
                  <p className="text-sm font-semibold text-[#49de80]">v{evalRun.updatedSystem.version} generated</p>
                  <p className="text-xs text-gray-400 mt-0.5">{approvedCount} change{approvedCount !== 1 ? "s" : ""} applied</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Not yet applied</p>
              )}
            </EvalStat>
          </div>
        )}
      </Card>

      {/* Clients summary */}
      <Card title="Clients">
        {clients.length === 0 ? (
          <EmptyState message="No clients yet." />
        ) : (
          <div className="divide-y divide-gray-100">
            {clients.map((c) => {
              const run = runs[c.id];
              const hasSystem = !!run?.system;
              const hasV2 = !!run?.updatedSystem;
              return (
                <div key={c.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">Added {new Date(c.addedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasV2 && <span className="px-2 py-0.5 bg-[#49de80]/15 text-green-800 rounded text-xs font-semibold">v2</span>}
                    {hasSystem && !hasV2 && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">v1</span>}
                    {!hasSystem && <span className="text-xs text-gray-400">No run</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({ label, value, sub, onClick, accent }: {
  label: string; value: string; sub: string; onClick?: () => void; accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-[#49de80]/50 transition-colors disabled:cursor-default"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-green-700" : "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </button>
  );
}

function EvalStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
      {children}
    </div>
  );
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
