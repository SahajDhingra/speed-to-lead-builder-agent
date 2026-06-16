"use client";
import { useState, type ReactNode } from "react";
import type { AgentRun } from "@/app/types";

const BUCKET_LABELS: Record<string, string> = {
  emergency:       "Emergency / Water Intrusion",
  insurance_storm: "Insurance / Storm Damage",
  high_value:      "High-Value Replacement",
  out_of_area:     "Out of Area",
  price_shopper:   "Price Shopper",
  vague:           "Vague / General Interest",
};

// ── Connector line ──────────────────────────────────────────────────────────

function Connector({ active = false }: { active?: boolean }) {
  return (
    <div className="flex justify-center my-0.5">
      <div
        className="w-0.5 h-5 transition-colors duration-500 rounded-full"
        style={{ background: active ? "#49de80" : "#e5e7eb" }}
      />
    </div>
  );
}

// ── Warning badge with hover tooltip ───────────────────────────────────────

function WarnBadge({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <span className="relative group inline-flex items-center ml-1 shrink-0">
      <span className="text-amber-400 text-[11px] cursor-default leading-none">⚠</span>
      <span className="absolute bottom-full left-0 mb-1 w-56 bg-gray-900 text-white text-xs rounded px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 leading-relaxed shadow-lg whitespace-normal">
        {warnings[0]}
        {warnings.length > 1 && (
          <span className="text-gray-400"> +{warnings.length - 1} more</span>
        )}
      </span>
    </span>
  );
}

// ── Node card ───────────────────────────────────────────────────────────────

function CanvasNode({
  icon,
  title,
  children,
  warnings = [],
  improved = false,
  active = false,
}: {
  icon: string;
  title: string;
  children: ReactNode;
  warnings?: string[];
  improved?: boolean;
  active?: boolean;
}) {
  const borderColor = active
    ? "border-[#49de80]/60"
    : improved
    ? "border-[#49de80]/40"
    : warnings.length > 0
    ? "border-amber-200"
    : "border-gray-200";

  const glow = active
    ? "shadow-[0_0_0_3px_rgba(73,222,128,0.12)] shadow-sm"
    : "shadow-sm";

  return (
    <div
      className={`rounded-lg border bg-white p-3 transition-all duration-300 ${borderColor} ${glow}`}
      style={{ animation: "fadeSlideIn 0.35s ease-out both" }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm leading-none">{icon}</span>
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex-1">
          {title}
        </h4>
        {warnings.length > 0 && !improved && <WarnBadge warnings={warnings} />}
        {improved && (
          <span className="text-[10px] font-medium text-[#49de80] shrink-0">
            ✓ updated
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Main canvas component ───────────────────────────────────────────────────

export function WorkflowCanvas({ run }: { run: AgentRun }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [openBucket, setOpenBucket] = useState<string | null>(null);

  const { profile, system, leads, simResults, critiques, approvals, updatedSystem } = run;

  const selectedSim = simResults?.find((s) => s.leadId === selectedLeadId) ?? null;
  const selectedLead = leads?.find((l) => l.id === selectedLeadId) ?? null;

  // v2 takes over from v1 when available
  const activeSystem = updatedSystem ?? system;

  // Approved improvements → green markers
  const approvedImps =
    critiques?.flatMap((c) =>
      c.improvements.filter((_, i) => approvals[`${c.leadId}-${i}`] === true)
    ) ?? [];

  // All proposed improvements → amber markers
  const allImps = critiques?.flatMap((c) => c.improvements) ?? [];

  function warningsFor(prefix: string) {
    return allImps
      .filter((imp) => imp.target.startsWith(prefix))
      .map((imp) => imp.change);
  }

  function improvedFor(prefix: string) {
    return !!updatedSystem && approvedImps.some((imp) => imp.target.startsWith(prefix));
  }

  const isTracing = !!selectedSim;

  // ── Empty state (before ingest) ────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px] text-center px-6 py-10">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-300">⬡</span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Run the agent to build the workflow
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Panel header */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Workflow Preview
        </h3>
        {updatedSystem && (
          <span className="px-1.5 py-0.5 bg-[#49de80]/20 text-green-800 rounded text-[10px] font-semibold">
            v{updatedSystem.version}
          </span>
        )}
      </div>

      {/* ── Node 1: Business Profile (visible after ingest) ── */}
      <CanvasNode icon="🏢" title="Business Profile">
        <p className="text-sm font-semibold text-gray-900">{profile.businessName}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {profile.serviceArea.locations.slice(0, 3).join(", ")}
          {profile.serviceArea.locations.length > 3 &&
            ` +${profile.serviceArea.locations.length - 3} more`}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {profile.brandVoice.tone.slice(0, 4).map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 bg-[#49de80]/10 text-green-800 rounded text-[10px]"
            >
              {t}
            </span>
          ))}
        </div>
      </CanvasNode>

      {/* ── Nodes 2–8: appear after generate ── */}
      {activeSystem && (
        <>
          <Connector active={isTracing} />

          {/* Node 2: Intake */}
          <CanvasNode icon="⬇" title="Inbound Lead / Intake" active={isTracing}>
            {selectedLead ? (
              <div>
                <p className="text-xs font-semibold text-[#49de80]">
                  {selectedLead.name}
                </p>
                <p className="text-xs text-gray-500">{selectedLead.source}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                  {selectedLead.message.slice(0, 90)}…
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Lead received via form / LSA / referral
              </p>
            )}
          </CanvasNode>

          <Connector active={isTracing} />

          {/* Node 3: Qualification & Scoring */}
          <CanvasNode
            icon="⚡"
            title="Qualification & Scoring"
            warnings={warningsFor("qualificationStrategy")}
            improved={improvedFor("qualificationStrategy")}
            active={isTracing}
          >
            {selectedSim ? (
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    selectedSim.qualificationScore >= 80
                      ? "text-green-600"
                      : selectedSim.qualificationScore >= 50
                      ? "text-yellow-600"
                      : "text-red-500"
                  }`}
                >
                  {selectedSim.qualificationScore}
                </span>
                <span className="text-xs text-gray-400">
                  / 100 ·{" "}
                  {selectedSim.qualificationScore >= 80
                    ? "Hot 🔥"
                    : selectedSim.qualificationScore >= 50
                    ? "Warm"
                    : "Cold"}
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 line-clamp-3">
                {activeSystem.qualificationStrategy.scoringApproach}
              </p>
            )}
          </CanvasNode>

          <Connector active={isTracing} />

          {/* Node 4: Routing */}
          <CanvasNode
            icon="⬡"
            title="Route Lead"
            warnings={warningsFor("routingLogic")}
            improved={improvedFor("routingLogic")}
          >
            {selectedSim ? (
              <p className="text-xs font-medium text-gray-800 bg-[#49de80]/10 rounded px-2 py-1.5 leading-relaxed">
                {selectedSim.routingAction}
              </p>
            ) : (
              <div className="space-y-1">
                {activeSystem.routingLogic.map((rule, i) => (
                  <div
                    key={i}
                    className="text-[10px] bg-gray-50 rounded px-2 py-1 text-gray-600"
                  >
                    <span className="font-semibold text-gray-700">
                      {rule.condition}
                    </span>
                    <span className="text-gray-300 mx-1">→</span>
                    {rule.action}
                  </div>
                ))}
              </div>
            )}
          </CanvasNode>

          <Connector active={isTracing} />

          {/* Node 5: First-Touch Email */}
          <CanvasNode
            icon="✉"
            title="First-Touch Email"
            warnings={warningsFor("firstTouchEmails")}
            improved={improvedFor("firstTouchEmails")}
            active={isTracing}
          >
            {selectedSim ? (
              /* Show this lead's actual email when tracing */
              <div>
                <p className="text-[10px] font-semibold text-[#49de80] mb-1.5">
                  {selectedSim.firstEmailSent.split("\n")[0]}
                </p>
                <pre className="text-[10px] text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded p-2 max-h-32 overflow-y-auto leading-relaxed">
                  {selectedSim.firstEmailSent.split("\n").slice(2).join("\n")}
                </pre>
              </div>
            ) : (
              /* Show expandable bucket list */
              <div className="space-y-0.5">
                {Object.entries(activeSystem.firstTouchEmails).map(
                  ([bucket, email]) => {
                    const isOpen = openBucket === bucket;
                    const bWarns = warningsFor(`firstTouchEmails.${bucket}`);
                    const bImproved = improvedFor(`firstTouchEmails.${bucket}`);
                    return (
                      <div
                        key={bucket}
                        className={`border rounded overflow-hidden ${
                          bImproved
                            ? "border-[#49de80]/40"
                            : bWarns.length > 0
                            ? "border-amber-200"
                            : "border-gray-100"
                        }`}
                      >
                        <button
                          className="w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-gray-50 transition-colors"
                          onClick={() =>
                            setOpenBucket(isOpen ? null : bucket)
                          }
                        >
                          <span className="flex items-center gap-1 text-[10px] font-medium text-gray-700 min-w-0">
                            {bImproved && (
                              <span className="text-[#49de80] shrink-0">✓</span>
                            )}
                            {bWarns.length > 0 && !bImproved && (
                              <WarnBadge warnings={bWarns} />
                            )}
                            <span className="truncate">
                              {BUCKET_LABELS[bucket] ?? bucket}
                            </span>
                          </span>
                          <span className="text-gray-300 text-[10px] shrink-0 ml-1">
                            {isOpen ? "▲" : "▼"}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-2 pb-2 border-t border-gray-100">
                            <p className="text-[10px] text-gray-500 mt-1">
                              Subject:{" "}
                              <span className="font-medium text-gray-700">
                                {email.subject}
                              </span>
                            </p>
                            <pre className="text-[10px] text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded p-1.5 mt-1 max-h-28 overflow-y-auto leading-relaxed">
                              {email.body}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CanvasNode>

          {/* Nodes 6-8: Follow-up sequence */}
          {activeSystem.emailFlow.map((step, i) => (
            <div key={step.stepName}>
              <Connector active={false} />
              <CanvasNode
                icon="📩"
                title={step.stepName}
                warnings={warningsFor(`emailFlow[${i}]`)}
                improved={improvedFor(`emailFlow[${i}]`)}
              >
                <p className="text-[10px] text-gray-400">{step.trigger}</p>
                <p className="text-xs text-gray-600 mt-0.5 font-medium line-clamp-1">
                  {step.subject}
                </p>
              </CanvasNode>
            </div>
          ))}
        </>
      )}

      {/* ── Lead tracer (appears after simulate) ── */}
      {simResults && leads && (
        <div
          className="mt-4 pt-3 border-t border-gray-100"
          style={{ animation: "fadeSlideIn 0.4s ease-out both" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Trace a Lead
          </p>
          <div className="flex flex-wrap gap-1.5">
            {leads.map((lead, i) => {
              const sim = simResults[i];
              const isSelected = selectedLeadId === lead.id;
              return (
                <button
                  key={lead.id}
                  onClick={() =>
                    setSelectedLeadId(isSelected ? null : lead.id)
                  }
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    isSelected
                      ? "bg-[#49de80] text-gray-950"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {lead.name.split(" ")[0]} · {sim.qualificationScore}
                </button>
              );
            })}
          </div>
          {selectedLeadId && (
            <p className="text-[10px] text-gray-400 mt-1.5">
              Click again to deselect
            </p>
          )}
        </div>
      )}

      {/* ── v2 change log (appears after apply) ── */}
      {updatedSystem && approvedImps.length > 0 && (
        <div
          className="mt-3 pt-3 border-t border-[#49de80]/20"
          style={{ animation: "fadeSlideIn 0.4s ease-out both" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700 mb-1.5">
            v{updatedSystem.version} Changes
          </p>
          <ul className="space-y-1">
            {approvedImps.map((imp, i) => (
              <li key={i} className="text-[10px] text-gray-600 flex gap-1">
                <span className="text-[#49de80] shrink-0 mt-0.5">✓</span>
                <span>
                  <span className="font-mono text-[#49de80]">{imp.target}</span>{" "}
                  — {imp.change}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
