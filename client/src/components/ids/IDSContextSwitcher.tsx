/**
 * IDS Context Switcher Component
 * Provides Company (OpCo) and Funding Account filtering across IDS pages
 * 
 * Usage:
 * <IDSContextSwitcher
 *   opcoId={selectedOpco}
 *   brokerAccountId={selectedBrokerAccount}
 *   onOpcoChange={setSelectedOpco}
 *   onBrokerAccountChange={setSelectedBrokerAccount}
 * />
 */

import React from "react";

// OpCo and Broker Account options
export const OPCO_OPTIONS = [
  { value: "SAHRAWI", label: "Sahrawi" },
  { value: "METRIX", label: "Metrix" },
] as const;

export const BROKER_ACCOUNT_OPTIONS = [
  { value: "MODIVCARE_SAHRAWI", label: "Modivcare – Sahrawi", opcoId: "SAHRAWI", brokerId: "MODIVCARE" },
  { value: "MODIVCARE_METRIX", label: "Modivcare – Metrix", opcoId: "METRIX", brokerId: "MODIVCARE" },
  { value: "MTM_MAIN", label: "MTM", opcoId: "SAHRAWI", brokerId: "MTM" },
  { value: "A2C_MAIN", label: "Access2Care", opcoId: "SAHRAWI", brokerId: "ACCESS2CARE" },
] as const;

export type OpcoId = "SAHRAWI" | "METRIX" | null;
export type BrokerAccountId = "MODIVCARE_SAHRAWI" | "MODIVCARE_METRIX" | "MTM_MAIN" | "A2C_MAIN" | null;

interface IDSContextSwitcherProps {
  opcoId: OpcoId;
  brokerAccountId: BrokerAccountId;
  onOpcoChange: (opcoId: OpcoId) => void;
  onBrokerAccountChange: (brokerAccountId: BrokerAccountId) => void;
  showAll?: boolean; // Whether to show "All" option
  compact?: boolean; // Compact mode for top bar
}

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "green" | "amber" | "red" | "purple" | "blue";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export default function IDSContextSwitcher({
  opcoId,
  brokerAccountId,
  onOpcoChange,
  onBrokerAccountChange,
  showAll = true,
  compact = false,
}: IDSContextSwitcherProps) {
  // Get valid broker accounts for selected OpCo
  const validBrokerAccounts = BROKER_ACCOUNT_OPTIONS.filter(
    (opt) => !opcoId || opt.opcoId === opcoId
  );

  // Auto-select OpCo when broker account is selected
  const handleBrokerAccountChange = (value: BrokerAccountId) => {
    onBrokerAccountChange(value);
    if (value) {
      const account = BROKER_ACCOUNT_OPTIONS.find((opt) => opt.value === value);
      if (account) {
        onOpcoChange(account.opcoId as OpcoId);
      }
    }
  };

  // Handle OpCo change - reset broker account if it doesn't match
  const handleOpcoChange = (value: OpcoId) => {
    onOpcoChange(value);
    if (brokerAccountId) {
      const account = BROKER_ACCOUNT_OPTIONS.find((opt) => opt.value === brokerAccountId);
      if (account && value && account.opcoId !== value) {
        onBrokerAccountChange(null);
      }
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 border">
        {/* OpCo Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Company:</span>
          <select
            value={opcoId || ""}
            onChange={(e) => handleOpcoChange(e.target.value as OpcoId || null)}
            className="text-sm border-0 bg-transparent focus:ring-0 py-0 pr-6 text-slate-700 font-medium"
          >
            {showAll && <option value="">All</option>}
            {OPCO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-4 bg-slate-300" />

        {/* Funding Account Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Funding:</span>
          <select
            value={brokerAccountId || ""}
            onChange={(e) => handleBrokerAccountChange(e.target.value as BrokerAccountId || null)}
            className="text-sm border-0 bg-transparent focus:ring-0 py-0 pr-6 text-slate-700 font-medium"
          >
            {showAll && <option value="">All</option>}
            {validBrokerAccounts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Current Selection Pills */}
        {(opcoId || brokerAccountId) && (
          <>
            <div className="w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-1">
              {opcoId && <Pill tone="green">{opcoId}</Pill>}
              {brokerAccountId && (
                <Pill tone="blue">
                  {BROKER_ACCOUNT_OPTIONS.find((opt) => opt.value === brokerAccountId)?.label}
                </Pill>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-medium text-blue-800 mb-3">Filter by Company & Funding Account</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* OpCo Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company (OpCo)</label>
          <select
            value={opcoId || ""}
            onChange={(e) => handleOpcoChange(e.target.value as OpcoId || null)}
            className="w-full px-3 py-2 border rounded-lg text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {showAll && <option value="">All Companies</option>}
            {OPCO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Funding Account Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Funding Account</label>
          <select
            value={brokerAccountId || ""}
            onChange={(e) => handleBrokerAccountChange(e.target.value as BrokerAccountId || null)}
            className="w-full px-3 py-2 border rounded-lg text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {showAll && <option value="">All Accounts</option>}
            {validBrokerAccounts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Summary */}
      {(opcoId || brokerAccountId) && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-slate-500">Filtering:</span>
          {opcoId && <Pill tone="green">{opcoId}</Pill>}
          {brokerAccountId && (
            <>
              <span className="text-slate-400">→</span>
              <Pill tone="blue">
                {BROKER_ACCOUNT_OPTIONS.find((opt) => opt.value === brokerAccountId)?.label}
              </Pill>
            </>
          )}
          <button
            onClick={() => {
              onOpcoChange(null);
              onBrokerAccountChange(null);
            }}
            className="ml-2 text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
