'use client';

interface DesignPickerProps {
  selected: string | null;
  onSelect: (presetId: string | null) => void;
}

interface PresetCard {
  id: string;
  name: string;
  subtitle: string;
  bg: string;
  navBg: string;
  navText: string;
  sidebarBg: string | null;
  sidebarBorder: string | null;
  cardBg: string;
  cardBorder: string;
  cardRadius: number;
  cardShadow: string;
  accentBar: string | null;
}

const PRESET_CARDS: PresetCard[] = [
  {
    id: 'linear-minimal',
    name: 'Linear Minimal',
    subtitle: 'Productivity & tools',
    bg: '#ffffff',
    navBg: '#ffffff',
    navText: '#9ca3af',
    sidebarBg: null,
    sidebarBorder: '#e5e7eb',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    cardRadius: 8,
    cardShadow: 'none',
    accentBar: null,
  },
  {
    id: 'stripe-professional',
    name: 'Stripe Professional',
    subtitle: 'Business & dashboards',
    bg: '#f9fafb',
    navBg: '#ffffff',
    navText: '#6b7280',
    sidebarBg: null,
    sidebarBorder: null,
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    cardRadius: 12,
    cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
    accentBar: null,
  },
  {
    id: 'apple-clean',
    name: 'Apple Clean',
    subtitle: 'Consumer & personal',
    bg: '#ffffff',
    navBg: '#ffffff',
    navText: '#9ca3af',
    sidebarBg: null,
    sidebarBorder: null,
    cardBg: '#ffffff',
    cardBorder: 'rgba(229,231,235,0.6)',
    cardRadius: 16,
    cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
    accentBar: null,
  },
  {
    id: 'notion-soft',
    name: 'Notion Soft',
    subtitle: 'Content & notes',
    bg: '#ffffff',
    navBg: '#ffffff',
    navText: '#9ca3af',
    sidebarBg: '#fafaf9',
    sidebarBorder: '#e5e7eb',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    cardRadius: 8,
    cardShadow: 'none',
    accentBar: null,
  },
  {
    id: 'gaming-neon',
    name: 'Gaming Neon',
    subtitle: 'Games & entertainment',
    bg: '#111827',
    navBg: '#1f2937',
    navText: '#9ca3af',
    sidebarBg: null,
    sidebarBorder: '#374151',
    cardBg: '#1f2937',
    cardBorder: '#374151',
    cardRadius: 12,
    cardShadow: 'none',
    accentBar: '#818cf8',
  },
  {
    id: 'marketplace-modern',
    name: 'Marketplace Modern',
    subtitle: 'E-commerce & catalogs',
    bg: '#f9fafb',
    navBg: '#ffffff',
    navText: '#6b7280',
    sidebarBg: null,
    sidebarBorder: null,
    cardBg: '#ffffff',
    cardBorder: '#f3f4f6',
    cardRadius: 12,
    cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
    accentBar: null,
  },
];

function MiniMockup({ preset }: { preset: PresetCard }) {
  const hasSidebar = preset.sidebarBg || preset.sidebarBorder;
  const isDark = preset.id === 'gaming-neon';
  const isMarketplace = preset.id === 'marketplace-modern';

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '4 / 3',
        background: preset.bg,
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Nav bar */}
      <div
        style={{
          height: 10,
          background: preset.navBg,
          borderBottom: isDark ? `1px solid ${preset.cardBorder}` : '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
          gap: 3,
          flexShrink: 0,
        }}
      >
        {preset.accentBar && (
          <div style={{ width: 8, height: 4, borderRadius: 1, background: preset.accentBar }} />
        )}
        <div style={{ width: 12, height: 3, borderRadius: 1, background: preset.navText, opacity: 0.5 }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 8, height: 3, borderRadius: 1, background: preset.navText, opacity: 0.3 }} />
        <div style={{ width: 8, height: 3, borderRadius: 1, background: preset.navText, opacity: 0.3 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        {hasSidebar && (
          <div
            style={{
              width: 20,
              background: preset.sidebarBg || preset.bg,
              borderRight: preset.sidebarBorder ? `1px solid ${preset.sidebarBorder}` : undefined,
              padding: '4px 3px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flexShrink: 0,
            }}
          >
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: '100%',
                  height: 3,
                  borderRadius: 1,
                  background: preset.navText,
                  opacity: i === 1 ? 0.4 : 0.2,
                }}
              />
            ))}
          </div>
        )}

        {/* Content area with cards */}
        <div style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {isMarketplace ? (
            /* Marketplace: taller image cards */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, flex: 1 }}>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  style={{
                    background: preset.cardBg,
                    border: `1px solid ${preset.cardBorder}`,
                    borderRadius: preset.cardRadius / 2,
                    boxShadow: preset.cardShadow,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ height: '55%', background: isDark ? '#374151' : '#e5e7eb', opacity: 0.5 }} />
                  <div style={{ padding: 3 }}>
                    <div style={{ width: '70%', height: 2, borderRadius: 1, background: preset.navText, opacity: 0.4 }} />
                    <div style={{ width: '40%', height: 2, borderRadius: 1, background: preset.navText, opacity: 0.25, marginTop: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Standard: 2x2 card grid */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, flex: 1 }}>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  style={{
                    background: preset.cardBg,
                    border: `1px solid ${preset.cardBorder}`,
                    borderRadius: preset.cardRadius / 2,
                    boxShadow: preset.cardShadow,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div style={{ width: '60%', height: 2, borderRadius: 1, background: preset.navText, opacity: 0.4 }} />
                  <div style={{ width: '80%', height: 2, borderRadius: 1, background: preset.navText, opacity: 0.2 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DesignPicker({ selected, onSelect }: DesignPickerProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">Design direction</p>
      <div className="grid grid-cols-2 gap-2">
        {/* Auto option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-xl border p-2 text-left transition-all ${
            selected === null
              ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-white'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: 6,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.81 18.02L10 15.27L5.19 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="#a5b4fc" stroke="#818cf8" strokeWidth="1" />
            </svg>
          </div>
          <p className="mt-1.5 text-xs font-medium text-gray-900">Auto</p>
          <p className="text-[10px] text-gray-500">AI chooses</p>
        </button>

        {/* Preset cards */}
        {PRESET_CARDS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`rounded-xl border p-2 text-left transition-all ${
              selected === preset.id
                ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-white'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <MiniMockup preset={preset} />
            <p className="mt-1.5 text-xs font-medium text-gray-900">{preset.name}</p>
            <p className="text-[10px] text-gray-500">{preset.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
