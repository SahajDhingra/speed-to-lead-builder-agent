"use client";
import { useState } from "react";
import { Card, ScoreChip, GradeChip, Btn } from "./ui";
import type { ClientProfile, GeneratedSystem, SimResult, Lead, Critique } from "@/lib/schemas";

// ── ProfileView ────────────────────────────────────────────────────────────

export function ProfileView({ profile }: { profile: ClientProfile }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card title="Business">
          <p className="font-semibold text-gray-900">{profile.businessName}</p>
          <p className="text-sm text-gray-500 capitalize">{profile.trade}</p>
        </Card>
        <Card title="Service Area">
          <p className="text-sm text-gray-700">
            {profile.serviceArea.locations.slice(0, 5).join(", ")}
            {profile.serviceArea.locations.length > 5 && ` +${profile.serviceArea.locations.length - 5} more`}
          </p>
          {profile.serviceArea.notes && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{profile.serviceArea.notes}</p>
          )}
        </Card>
        <Card title="Hours">
          <p className="text-sm text-gray-700">{profile.hours.regular}</p>
          {profile.hours.emergencyAvailable && (
            <p className="text-xs text-[#49de80] mt-1 font-medium">24/7 emergency line</p>
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
                <span className="text-[#49de80] shrink-0">✓</span>{s}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Brand Voice">
          <div className="flex flex-wrap gap-1 mb-2">
            {profile.brandVoice.tone.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-[#49de80]/10 text-green-800 rounded text-xs">{t}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500">{profile.brandVoice.dos.length} dos · {profile.brandVoice.donts.length} don&apos;ts</p>
        </Card>
      </div>
    </div>
  );
}

const BUCKET_LABELS: Record<string, string> = {
  emergency:       "Emergency / Water Intrusion",
  insurance_storm: "Insurance / Storm Damage",
  high_value:      "High-Value Replacement",
  out_of_area:     "Out of Area",
  price_shopper:   "Price Shopper",
  vague:           "Vague / General Interest",
};

// ── SystemView ─────────────────────────────────────────────────────────────

export function SystemView({ system }: { system: GeneratedSystem }) {
  const [openEmail, setOpenEmail] = useState<number | null>(null);
  const [openBucket, setOpenBucket] = useState<string | null>(null);
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
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Scoring Approach</p>
            <p className="text-sm text-gray-700">{system.qualificationStrategy.scoringApproach}</p>
          </div>
        </div>
      </Card>

      <Card title="First-Touch Emails by Bucket (6)">
        <div className="space-y-1">
          {Object.entries(system.firstTouchEmails).map(([bucket, email]) => {
            const isOpen = openBucket === bucket;
            return (
              <div key={bucket} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenBucket(isOpen ? null : bucket)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-[#49de80]/10 text-green-800 rounded font-medium">{bucket}</span>
                    <span className="text-sm font-medium text-gray-800">{BUCKET_LABELS[bucket]}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mt-2">Subject: <span className="font-normal text-gray-700">{email.subject}</span></p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded p-2 max-h-48 overflow-y-auto">{email.body}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={`Follow-up Sequence (${system.emailFlow.length} steps)`}>
        <div className="space-y-1">
          {system.emailFlow.map((step, i) => (
            <div key={step.stepName} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenEmail(openEmail === i ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs w-5 h-5 flex items-center justify-center bg-[#49de80]/15 text-green-800 rounded-full font-semibold">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{step.stepName}</span>
                  <span className="text-xs text-gray-400">{step.trigger}</span>
                </div>
                <span className="text-gray-400 text-xs">{openEmail === i ? "▲" : "▼"}</span>
              </button>
              {openEmail === i && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mt-2">Subject: <span className="font-normal text-gray-700">{step.subject}</span></p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded p-2 max-h-48 overflow-y-auto">{step.body}</pre>
                  <p className="text-xs text-[#49de80] italic">{step.purpose}</p>
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
                <p className="text-gray-700 font-medium">{r.condition}</p>
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

// ── SimTable ───────────────────────────────────────────────────────────────

export function SimTable({ leads, simResults }: { leads: Lead[]; simResults: SimResult[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {["Lead", "Source", "Score", "Routing Action", "Email"].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead, i) => {
            const sim = simResults[i];
            return (
              <>
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{lead.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{lead.message.slice(0, 70)}…</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{lead.source}</td>
                  <td className="px-4 py-3"><ScoreChip n={sim.qualificationScore} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px]">{sim.routingAction}</td>
                  <td className="px-4 py-3">
                    <Btn variant="secondary" onClick={() => setExpanded((e) => ({ ...e, [lead.id]: !e[lead.id] }))}>
                      {expanded[lead.id] ? "Hide" : "View"}
                    </Btn>
                  </td>
                </tr>
                {expanded[lead.id] && (
                  <tr key={`${lead.id}-email`}>
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

// ── CritiquePanel ──────────────────────────────────────────────────────────

export function CritiquePanel({
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
              <span className="text-sm">Grade: <GradeChip n={c.grade} /></span>
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
                          state === true ? "border-[#49de80]/40 bg-[#49de80]/5"
                          : state === false ? "border-red-200 bg-red-50 opacity-60"
                          : "border-gray-200 bg-white"
                        }`}
                      >
                        <p className="font-mono text-xs text-[#49de80] mb-1">{imp.target}</p>
                        <p className="text-gray-800 mb-1">{imp.change}</p>
                        <p className="text-xs text-gray-500 mb-2">Why: {imp.why}</p>
                        <div className="flex gap-2">
                          <Btn variant="primary" onClick={() => onToggle(key, true)}>
                            {state === true ? "✓ Approved" : "Approve"}
                          </Btn>
                          <Btn variant="danger" onClick={() => onToggle(key, false)}>
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
