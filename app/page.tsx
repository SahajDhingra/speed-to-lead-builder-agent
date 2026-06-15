"use client";

import { useState } from "react";
import type {
  ClientProfile,
  GeneratedSystem,
  SimResult,
  Lead,
  Critique,
} from "@/lib/schemas";

// ── helpers ────────────────────────────────────────────────────────────────

function scoreChip(n: number) {
  const cls =
    n >= 80
      ? "bg-green-100 text-green-800"
      : n >= 50
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {n}/100
    </span>
  );
}

function gradeChip(n: number) {
  const cls =
    n >= 8
      ? "text-green-700 font-bold"
      : n >= 5
      ? "text-yellow-700 font-bold"
      : "text-red-700 font-bold";
  return <span className={cls}>{n}/10</span>;
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
      <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      {label}
    </div>
  );
}

function Btn({
  onClick,
  disabled,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "green" | "red";
}) {
  const base = "px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-gray-900 text-white hover:bg-gray-700",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    green: "bg-green-600 text-white hover:bg-green-700",
    red: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function StepSection({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-900 text-white text-sm font-semibold shrink-0">
          {step}
        </span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ── profile view ───────────────────────────────────────────────────────────

function ProfileView({ profile }: { profile: ClientProfile }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card title="Business">
          <p className="font-semibold text-gray-900">{profile.businessName}</p>
          <p className="text-sm text-gray-500 capitalize">{profile.trade}</p>
        </Card>
        <Card title="Service Area">
          <p className="text-sm text-gray-700">{profile.serviceArea.locations.slice(0, 5).join(", ")}{profile.serviceArea.locations.length > 5 ? ` +${profile.serviceArea.locations.length - 5} more` : ""}</p>
          {profile.serviceArea.notes && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{profile.serviceArea.notes}</p>
          )}
        </Card>
        <Card title="Hours">
          <p className="text-sm text-gray-700">{profile.hours.regular}</p>
          {profile.hours.emergencyAvailable && (
            <p className="text-xs text-green-700 mt-1 font-medium">24/7 emergency line</p>
          )}
        </Card>
      </div>

      <Card title={`Services (${profile.services.length})`}>
        <div className="divide-y divide-gray-100">
          {profile.services.map((s) => (
            <div key={s.name} className="py-2 grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-800">{s.name}</span>
              <span className="text-gray-600">{s.priceRange}</span>
              <span className="text-gray-500">{s.typicalDuration ?? "—"}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="Ideal Lead">
          <p className="text-sm text-gray-700">{profile.qualification.idealLead}</p>
        </Card>
        <Card title="Disqualifiers">
          <ul className="space-y-1">
            {profile.qualification.disqualifiers.map((d) => (
              <li key={d} className="text-sm text-gray-700 flex gap-1.5">
                <span className="text-red-400 shrink-0">✕</span>{d}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="High-Intent Signals">
          <ul className="space-y-1">
            {profile.qualification.signals.map((s) => (
              <li key={s} className="text-sm text-gray-700 flex gap-1.5">
                <span className="text-green-500 shrink-0">✓</span>{s}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Brand Voice">
          <div className="flex flex-wrap gap-1 mb-2">
            {profile.brandVoice.tone.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{t}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500">{profile.brandVoice.dos.length} dos · {profile.brandVoice.donts.length} don&apos;ts</p>
        </Card>
      </div>
    </div>
  );
}

// ── system view ────────────────────────────────────────────────────────────

function SystemView({ system }: { system: GeneratedSystem }) {
  const [openEmail, setOpenEmail] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <Card title="Qualification Strategy">
        <p className="text-sm text-gray-700 mb-3">{system.qualificationStrategy.goal}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Questions to Ask</p>
            <ol className="list-decimal list-inside space-y-1">
              {system.qualificationStrategy.questionsToAsk.map((q) => (
                <li key={q} className="text-sm text-gray-700">{q}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Scoring</p>
            <p className="text-sm text-gray-700">{system.qualificationStrategy.scoringApproach}</p>
          </div>
        </div>
      </Card>

      <Card title={`Email Flow (${system.emailFlow.length} steps)`}>
        <div className="space-y-1">
          {system.emailFlow.map((step, i) => (
            <div key={step.stepName} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenEmail(openEmail === i ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs w-5 h-5 flex items-center justify-center bg-gray-100 rounded-full font-semibold text-gray-600">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{step.stepName}</span>
                  <span className="text-xs text-gray-400">{step.trigger}</span>
                </div>
                <span className="text-gray-400 text-xs">{openEmail === i ? "▲" : "▼"}</span>
              </button>
              {openEmail === i && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mt-2">Subject: <span className="font-normal text-gray-700">{step.subject}</span></p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded p-2 max-h-48 overflow-y-auto">{step.body}</pre>
                  <p className="text-xs text-blue-600 italic">{step.purpose}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="Routing Logic">
          <div className="space-y-2">
            {system.routingLogic.map((r) => (
              <div key={r.condition} className="text-sm">
                <p className="text-gray-600 font-medium">{r.condition}</p>
                <p className="text-gray-500 text-xs mt-0.5">→ {r.action}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-3">
          <Card title="Booking CTA">
            <p className="text-sm text-gray-700 italic">{system.bookingCTA}</p>
          </Card>
          <Card title="Human Handoff Rules">
            <ul className="space-y-1">
              {system.humanHandoffRules.map((r) => (
                <li key={r} className="text-sm text-gray-700 flex gap-1.5">
                  <span className="text-orange-400 shrink-0">⚑</span>{r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── simulation table ───────────────────────────────────────────────────────

function SimTable({
  leads,
  simResults,
}: {
  leads: Lead[];
  simResults: SimResult[];
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Lead</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Routing Action</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead, i) => {
            const sim = simResults[i];
            const key = lead.id;
            return (
              <>
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{lead.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{lead.message.slice(0, 70)}…</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{lead.source}</td>
                  <td className="px-4 py-3">{scoreChip(sim.qualificationScore)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px]">{sim.routingAction}</td>
                  <td className="px-4 py-3">
                    <Btn
                      variant="secondary"
                      onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
                    >
                      {expanded[key] ? "Hide" : "View"}
                    </Btn>
                  </td>
                </tr>
                {expanded[key] && (
                  <tr key={`${key}-email`}>
                    <td colSpan={5} className="px-4 pb-3">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded p-3 max-h-60 overflow-y-auto border border-gray-100">
                        {sim.firstEmailSent}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── critique panel ─────────────────────────────────────────────────────────

function CritiquePanel({
  leads,
  critiques,
  approvals,
  onToggle,
}: {
  leads: Lead[];
  critiques: Critique[];
  approvals: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      {critiques.map((c, ci) => {
        const lead = leads.find((l) => l.id === c.leadId) ?? leads[ci];
        return (
          <div key={c.leadId} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-800">{lead?.name ?? c.leadId}</span>
              <span className="text-sm">Grade: {gradeChip(c.grade)}</span>
            </div>
            <div className="px-4 py-3 space-y-3">
              <p className="text-sm text-gray-600 italic">{c.reasoning}</p>
              {c.improvements.length === 0 ? (
                <p className="text-xs text-gray-400">No improvements proposed.</p>
              ) : (
                <div className="space-y-2">
                  {c.improvements.map((imp, ii) => {
                    const key = `${c.leadId}-${ii}`;
                    const state = approvals[key];
                    return (
                      <div
                        key={key}
                        className={`rounded border p-3 text-sm transition-colors ${
                          state === true
                            ? "border-green-300 bg-green-50"
                            : state === false
                            ? "border-red-200 bg-red-50 opacity-60"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <p className="font-mono text-xs text-blue-600 mb-1">{imp.target}</p>
                        <p className="text-gray-800 mb-1">{imp.change}</p>
                        <p className="text-xs text-gray-500 mb-2">Why: {imp.why}</p>
                        <div className="flex gap-2">
                          <Btn
                            variant="green"
                            onClick={() => onToggle(key, true)}
                          >
                            {state === true ? "✓ Approved" : "Approve"}
                          </Btn>
                          <Btn
                            variant="red"
                            onClick={() => onToggle(key, false)}
                          >
                            {state === false ? "✕ Denied" : "Deny"}
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── main dashboard ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [system, setSystem] = useState<GeneratedSystem | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [simResults, setSimResults] = useState<SimResult[] | null>(null);
  const [critiques, setCritiques] = useState<Critique[] | null>(null);
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [updatedSystem, setUpdatedSystem] = useState<GeneratedSystem | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleApproval(key: string, value: boolean) {
    setApprovals((prev) => ({
      ...prev,
      [key]: prev[key] === value ? (undefined as unknown as boolean) : value,
    }));
  }

  function getApproved() {
    if (!critiques) return [];
    return critiques.flatMap((c) =>
      c.improvements.filter((_, i) => approvals[`${c.leadId}-${i}`] === true)
    );
  }

  async function call<T>(
    step: string,
    url: string,
    body?: object
  ): Promise<T | null> {
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

  async function runIngest() {
    const data = await call<ClientProfile>("ingest", "/api/ingest");
    if (data) { setProfile(data); setSystem(null); setLeads(null); setSimResults(null); setCritiques(null); setUpdatedSystem(null); }
  }

  async function runGenerate() {
    const data = await call<GeneratedSystem>("generate", "/api/generate", profile!);
    if (data) { setSystem(data); setLeads(null); setSimResults(null); setCritiques(null); setUpdatedSystem(null); }
  }

  async function runSimulate() {
    const data = await call<{ leads: Lead[]; simResults: SimResult[] }>("simulate", "/api/simulate", { system });
    if (data) { setLeads(data.leads); setSimResults(data.simResults); setCritiques(null); setUpdatedSystem(null); }
  }

  async function runCritique() {
    const data = await call<{ critiques: Critique[] }>("critique", "/api/critique", { system, leads, simResults });
    if (data) { setCritiques(data.critiques); setApprovals({}); setUpdatedSystem(null); }
  }

  async function runApply() {
    const approved = getApproved();
    const data = await call<GeneratedSystem>("apply", "/api/apply", { system, approvedImprovements: approved });
    if (data) setUpdatedSystem(data);
  }

  const approvedCount = getApproved().length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-6 py-4">
        <h1 className="text-lg font-semibold">Speed-to-Lead Builder</h1>
        <p className="text-gray-400 text-sm">Redhawk Roofing &amp; Exteriors · AI harness</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1 — Ingest */}
        <StepSection step={1} title="Ingest Client Data">
          <Btn onClick={runIngest} disabled={loading !== null}>
            {loading === "ingest" ? "Ingesting…" : profile ? "Re-ingest" : "Ingest Client Data"}
          </Btn>
          {loading === "ingest" && <Spinner label="Reading roofing-client.md and extracting ClientProfile via GPT-4o mini…" />}
          {profile && <ProfileView profile={profile} />}
        </StepSection>

        {/* Step 2 — Generate */}
        <StepSection step={2} title="Generate System">
          <Btn onClick={runGenerate} disabled={!profile || loading !== null}>
            {loading === "generate" ? "Generating…" : system ? "Re-generate" : "Generate System"}
          </Btn>
          {loading === "generate" && <Spinner label="Building qualification strategy, email flow, and routing rules (3 chained calls)…" />}
          {system && (
            <div>
              <p className="text-xs text-gray-400 mb-3">v{system.version} · generated {new Date(system.generatedAt).toLocaleTimeString()}</p>
              <SystemView system={system} />
            </div>
          )}
        </StepSection>

        {/* Step 3 — Simulate */}
        <StepSection step={3} title="Run Test Leads">
          <Btn onClick={runSimulate} disabled={!system || loading !== null}>
            {loading === "simulate" ? "Running…" : simResults ? "Re-run Simulation" : "Run Test Leads"}
          </Btn>
          {loading === "simulate" && <Spinner label="Running 6 test leads through the system in parallel…" />}
          {simResults && leads && <SimTable leads={leads} simResults={simResults} />}
        </StepSection>

        {/* Step 4 — Critique */}
        <StepSection step={4} title="Critique Results">
          <div className="flex items-center gap-3">
            <Btn onClick={runCritique} disabled={!simResults || loading !== null}>
              {loading === "critique" ? "Grading…" : critiques ? "Re-run Critiques" : "Critique Results"}
            </Btn>
            {critiques && (
              <span className="text-sm text-gray-500">
                {approvedCount} improvement{approvedCount !== 1 ? "s" : ""} approved
              </span>
            )}
          </div>
          {loading === "critique" && <Spinner label="Grading each lead's handling and proposing targeted improvements…" />}
          {critiques && leads && (
            <CritiquePanel
              leads={leads}
              critiques={critiques}
              approvals={approvals}
              onToggle={toggleApproval}
            />
          )}
        </StepSection>

        {/* Step 5 — Apply */}
        <StepSection step={5} title="Apply Approved Improvements">
          <Btn
            onClick={runApply}
            disabled={!critiques || approvedCount === 0 || loading !== null}
          >
            {loading === "apply"
              ? "Applying…"
              : updatedSystem
              ? "Re-apply"
              : `Apply ${approvedCount} Approved Change${approvedCount !== 1 ? "s" : ""}`}
          </Btn>
          {approvedCount === 0 && critiques && (
            <p className="text-xs text-gray-400">Approve at least one improvement above to enable this step.</p>
          )}
          {loading === "apply" && <Spinner label={`Applying ${approvedCount} improvements and generating v${(system?.version ?? 1) + 1}…`} />}
          {updatedSystem && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                  v{updatedSystem.version}
                </span>
                <span className="text-xs text-gray-500">
                  {approvedCount} improvement{approvedCount !== 1 ? "s" : ""} applied · generated {new Date(updatedSystem.generatedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Applied Changes</p>
                <ul className="space-y-1">
                  {getApproved().map((imp, i) => (
                    <li key={i} className="text-xs text-blue-800">
                      <span className="font-mono text-blue-600">{imp.target}</span> — {imp.change}
                    </li>
                  ))}
                </ul>
              </div>
              <SystemView system={updatedSystem} />
            </div>
          )}
        </StepSection>
      </main>
    </div>
  );
}
