'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Integration {
  id: string;
  status: string;
  definition: {
    id: string;
    name: string;
    description: string;
    service_key: string;
    required_fields: string[];
    integration_type: string;
  };
}

export default function IntegrationsPage() {
  const params = useParams();
  const templateId = params.id as string;
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Find the tenant associated with this template
    fetch(`/api/integrations?template_id=${templateId}`)
      .then(r => r.json())
      .then(data => {
        if (data.tenant_id) setTenantId(data.tenant_id);
        setIntegrations(data.integrations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [templateId]);

  async function handleSave(integrationId: string) {
    setSaving(true);
    setMessage('');

    const res = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_integration_id: integrationId,
        secrets,
      }),
    });

    if (res.ok) {
      setMessage('Connected successfully');
      setConfiguring(null);
      setSecrets({});
      // Refresh integrations
      const updated = await fetch(`/api/integrations?template_id=${templateId}`).then(r => r.json());
      setIntegrations(updated.integrations || []);
    } else {
      const data = await res.json();
      setMessage(data.error || 'Failed to connect');
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 flex flex-wrap items-center">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/apps/${templateId}`} className="hover:text-gray-700">App</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Integrations</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold">Integrations & API Keys</h1>
      <p className="mt-1 text-sm sm:text-base text-gray-600">Manage external service connections for your app.</p>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : integrations.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-4xl">🔌</p>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No integrations</h3>
          <p className="mt-1 text-sm text-gray-500">This app doesn&apos;t require any external API connections.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${
                    integration.status === 'connected' ? 'bg-green-500' :
                    integration.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <div className="min-w-0">
                    <h3 className="font-semibold">{integration.definition?.name}</h3>
                    {integration.definition?.description && (
                      <p className="text-sm text-gray-500">{integration.definition.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  <span className={`text-xs font-medium ${
                    integration.status === 'connected' ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {integration.status === 'connected' ? 'Connected' : 'Not connected'}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setConfiguring(configuring === integration.id ? null : integration.id);
                      setSecrets({});
                      setMessage('');
                    }}
                  >
                    {integration.status === 'connected' ? 'Update' : 'Connect'}
                  </Button>
                </div>
              </div>

              {configuring === integration.id && (
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                  {(integration.definition?.required_fields || ['api_key']).map((field) => (
                    <Input
                      key={field}
                      label={field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      type="password"
                      value={secrets[field] || ''}
                      onChange={(e) => setSecrets({ ...secrets, [field]: e.target.value })}
                      placeholder={`Enter your ${field.replace(/_/g, ' ')}`}
                      autoComplete="off"
                    />
                  ))}
                  <p className="text-xs text-gray-400">Keys are encrypted and stored securely. Never exposed to the browser.</p>
                  <Button onClick={() => handleSave(integration.id)} loading={saving} className="w-full sm:w-auto">
                    Save & Connect
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
