'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface VersionRow {
  version: number;
  created_at: string;
  description: string | null;
}

interface VersionsResponse {
  current_version: number | null;
  original_version: number;
  latest_version: number;
  update_available: boolean;
  versions: VersionRow[];
}

interface InstanceVersionControlProps {
  instanceId: string;
  currentVersion: number | null;
  latestVersion: number | null;
  updateAvailable: boolean;
}

/**
 * Per-instance version control shown on the dashboard card. Appears as either
 * an "Update available" badge (when the creator published a newer version) or
 * a subtle "v{n}" label. Clicking opens a modal that lists all versions from
 * the original clone point onward and lets the owner upgrade or revert.
 */
export function InstanceVersionControl({
  instanceId,
  currentVersion,
  latestVersion,
  updateAvailable,
}: InstanceVersionControlProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<VersionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVersion, setPendingVersion] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<VersionRow | null>(null);
  const [error, setError] = useState('');

  // Fetch fresh version list when the modal opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/instances/${instanceId}/versions`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, instanceId]);

  async function handleUpgrade(targetVersion: number) {
    setPendingVersion(targetVersion);
    setError('');
    const res = await fetch(`/api/instances/${instanceId}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: targetVersion }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || 'Failed to change version');
      setPendingVersion(null);
      return;
    }
    setConfirming(null);
    setPendingVersion(null);
    setOpen(false);
    // Reload so the dashboard + tenant URL reflect the new version
    window.location.reload();
  }

  // Stop propagation so clicking the trigger doesn't bubble up to the
  // enclosing Link on the card
  function handleTriggerClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      {updateAvailable ? (
        <button
          type="button"
          onClick={handleTriggerClick}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          title="The creator published a new version"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Update available
        </button>
      ) : currentVersion !== null ? (
        <button
          type="button"
          onClick={handleTriggerClick}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title="Version history"
        >
          v{currentVersion}
        </button>
      ) : null}

      {/* Versions modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {confirming ? (
              // Confirmation step before upgrading/reverting
              <div>
                <h3 className="text-lg font-bold">
                  {confirming.version > (currentVersion || 0)
                    ? `Upgrade to v${confirming.version}?`
                    : `Revert to v${confirming.version}?`}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Your app&apos;s data will be preserved, but it may not render correctly if this version
                  uses a different data structure than the current one.
                </p>
                {confirming.description && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                    <span className="font-semibold">What changed:</span> {confirming.description}
                  </div>
                )}
                {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setConfirming(null); setError(''); }}
                    disabled={pendingVersion !== null}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => handleUpgrade(confirming.version)}
                    loading={pendingVersion === confirming.version}
                  >
                    {confirming.version > (currentVersion || 0) ? 'Upgrade' : 'Revert'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Version history</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Upgrade to a newer version or revert back to an earlier one.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {loading ? (
                  <div className="mt-6 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                  </div>
                ) : !data || data.versions.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-gray-500">No version history yet.</p>
                ) : (
                  <div className="mt-6 space-y-2">
                    {data.versions.map((v) => {
                      const isCurrent = v.version === data.current_version;
                      const isOriginal = v.version === data.original_version;
                      return (
                        <div
                          key={v.version}
                          className={`rounded-lg border p-3 ${
                            isCurrent
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">v{v.version}</span>
                                {isCurrent && (
                                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white">
                                    Current
                                  </span>
                                )}
                                {isOriginal && !isCurrent && (
                                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                                    Original clone
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">
                                  {new Date(v.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {v.description && (
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{v.description}</p>
                              )}
                            </div>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => { setConfirming(v); setError(''); }}
                                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                {v.version > (data.current_version || 0) ? 'Upgrade' : 'Revert'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
