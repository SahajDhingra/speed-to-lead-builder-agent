"use client";
import { useState } from "react";
import { Btn, Spinner, EmptyState } from "@/app/components/ui";
import type { ClientRecord } from "@/app/types";

interface Props {
  clients: ClientRecord[];
  selectedClientId: string | null;
  adding: boolean;
  onSelect: (id: string) => void;
  onAdd: (name: string, rawContext: string) => void;
  onNavigateToAgent: () => void;
}

export function ClientsTab({ clients, selectedClientId, adding, onSelect, onAdd, onNavigateToAgent }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rawContext, setRawContext] = useState("");

  function handleAdd() {
    if (!name.trim() || !rawContext.trim()) return;
    onAdd(name.trim(), rawContext.trim());
    setName("");
    setRawContext("");
    setShowForm(false);
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative group">
            <button
              disabled
              className="px-3 py-1.5 rounded text-sm border border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
            >
              Import from Housecall Pro
            </button>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center leading-relaxed">
              Requires Housecall Pro connection
            </span>
          </span>
          <Btn onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add Client"}
          </Btn>
        </div>
      </div>

      {/* Add client form */}
      {showForm && (
        <div className="border border-[#49de80]/30 bg-[#49de80]/5 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">New Client</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Client name</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49de80]/40"
              placeholder="e.g. Apex HVAC"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Raw business context — paste website copy, services sheet, FAQs, operational notes
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#49de80]/40 h-48 resize-y"
              placeholder="Paste the client's business context here and example inbound leads…"
              value={rawContext}
              onChange={(e) => setRawContext(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Btn onClick={handleAdd} disabled={!name.trim() || !rawContext.trim() || adding}>
              {adding ? "Ingesting…" : "Ingest & Add Client"}
            </Btn>
            {adding && <Spinner label="Extracting ClientProfile…" />}
          </div>
        </div>
      )}

      {/* Client list */}
      {clients.length === 0 ? (
        <EmptyState message="No clients yet. Add one above." />
      ) : (
        <div className="space-y-2">
          {clients.map((c) => {
            const isSelected = c.id === selectedClientId;
            return (
              <div
                key={c.id}
                className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${
                  isSelected
                    ? "border-[#49de80]/50 bg-[#49de80]/5"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 bg-[#49de80] text-gray-950 text-xs rounded font-medium">
                        Selected
                      </span>
                    )}
                    {c.rawContext === null && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Added {new Date(c.addedAt).toLocaleDateString()}</p>
                  {c.rawContext === null && (
                    <a
                      href="/api/download-context"
                      download="roofing-client.md"
                      className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 mt-1 inline-block"
                    >
                      Download Business Knowledge Base
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <Btn variant="secondary" onClick={() => onSelect(c.id)}>Select</Btn>
                  )}
                  <Btn variant="ghost" onClick={onNavigateToAgent}>
                    Open in Agent →
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
