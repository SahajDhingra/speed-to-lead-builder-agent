"use client";

interface Integration {
  name: string;
  description: string;
  status: "connected" | "available";
  category: string;
}

const INTEGRATIONS: Integration[] = [
  {
    name: "OpenAI",
    description: "Powers all agent stages — ingestion, generation, simulation, critique, and apply. GPT-4o mini.",
    status: "connected",
    category: "AI",
  },
  {
    name: "Resend",
    description: "Transactional email delivery for the speed-to-lead email sequences.",
    status: "connected",
    category: "Email",
  },
  {
    name: "GoHighLevel (GHL)",
    description: "CRM and pipeline management. Connect to automatically log inbound leads and trigger workflows.",
    status: "available",
    category: "CRM",
  },
  {
    name: "Housecall Pro",
    description: "Field service management. Sync booked inspections and job status back into the pipeline.",
    status: "available",
    category: "Field ops",
  },
  {
    name: "Twilio",
    description: "SMS fallback for leads who don't respond to email within the first 24 h window.",
    status: "available",
    category: "Messaging",
  },
];

export function IntegrationsTab() {
  const connected = INTEGRATIONS.filter((i) => i.status === "connected");
  const available = INTEGRATIONS.filter((i) => i.status === "available");

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500">{connected.length} connected · {available.length} available</p>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Connected</h2>
        <div className="space-y-3">
          {connected.map((intg) => (
            <IntegrationCard key={intg.name} intg={intg} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Available</h2>
        <div className="space-y-3">
          {available.map((intg) => (
            <IntegrationCard key={intg.name} intg={intg} />
          ))}
        </div>
      </section>
    </div>
  );
}

function IntegrationCard({ intg }: { intg: Integration }) {
  const isConnected = intg.status === "connected";
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{intg.category}</span>
        </div>
        <p className="text-sm text-gray-500">{intg.description}</p>
      </div>
      <div className="shrink-0 pt-0.5">
        {isConnected ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#49de80]/15 text-green-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#49de80] inline-block" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
            Not connected
          </span>
        )}
      </div>
    </div>
  );
}
