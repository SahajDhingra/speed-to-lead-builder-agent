"use client";

// Replace with your real Loom URL before sharing
const LOOM_URL = "https://loom.com/share/placeholder";

const STEPS = [
  {
    n: 1,
    text: "Go to the Agent tab and run all 5 steps — watch the workflow build live on the right-side canvas.",
  },
  {
    n: 2,
    text: "Open Deployments to review the full generated system (v1, and the improved v2 after critiques are applied).",
  },
  {
    n: 3,
    text: "Return to Dashboard to see eval scores, critique grades, and the self-improvement summary.",
  },
];

interface Props {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: Props) {
  return (
    /* Backdrop — click outside the card to dismiss */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(10,10,10,0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "backdropIn 0.2s ease-out both",
      }}
      onClick={onClose}
    >
      {/* Card — stop click from bubbling to backdrop */}
      <div
        className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "modalIn 0.3s ease-out both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Green top accent bar */}
        <div className="h-1 w-full bg-[#49de80]" />

        <div className="px-8 pt-7 pb-8">
          {/* X close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none"
          >
            ✕
          </button>

          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#49de80] text-xl">⚡</span>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Speed-to-Lead Builder Agent
              </h2>
            </div>
            <p className="text-sm text-[#49de80] font-medium">
              AI-powered speed-to-lead systems — built, critiqued, and improved automatically.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-5" />

          {/* What it is */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              What it is
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              An AI agent that builds speed-to-lead systems for an agency's clients. When a
              new client comes in — say a home-services business — the agent ingests its raw
              context (services, pricing, brand voice, service area) and builds that client a
              fully custom speed-to-lead system: qualification scoring, lead routing logic,
              and a branched email cadence in the client's own voice. Then it critiques and
              improves its own output.
            </p>
          </div>

          {/* Who it's for */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Who it's for
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Agencies that onboard a steady flow of inbound clients and need to stand up
              automations for each one — fast, without rebuilding from scratch every time.
              Instead of an operator hand-building each client's system, the agent does it
              per client. The live demo runs on a roofing company.
            </p>
          </div>

          {/* How to explore */}
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              How to explore
            </p>
            <ol className="space-y-2.5">
              {STEPS.map(({ n, text }) => (
                <li key={n} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#49de80] text-gray-950 text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {n}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={LOOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="text-base">▶</span>
              Watch the 5-min walkthrough
            </a>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-[#49de80] text-gray-950 text-sm font-semibold hover:bg-[#3bcc73] transition-colors"
            >
              Explore the tool →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
