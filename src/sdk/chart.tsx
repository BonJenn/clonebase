'use client';

import { useEffect, useRef } from 'react';

// React wrapper around ApexCharts' imperative API. ApexCharts is loaded from
// CDN at runtime (see tenant layout / sandbox preview); this component waits
// for it to become available, instantiates the chart into a ref'd div, and
// tears it down on unmount.

type ChartType =
  | 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar'
  | 'scatter' | 'heatmap' | 'radar' | 'polarArea' | 'treemap';

// Series shape differs per chart type:
// - line/area/bar/scatter/radar: [{ name, data: number[] }]
// - pie/donut/radialBar/polarArea: number[]
// - heatmap: [{ name, data: [{ x, y }] }]
// We accept `unknown` here and trust the caller — ApexCharts validates.
type ChartSeries =
  | number[]
  | Array<{ name: string; data: number[] | Array<{ x: string | number; y: number }> }>;

interface ChartProps {
  type: ChartType;
  series: ChartSeries;
  /** X-axis labels for line/bar/area/scatter/radar. */
  categories?: Array<string | number>;
  /** Segment labels for pie/donut/radialBar/polarArea. */
  labels?: string[];
  /** Height in px. Default 300. */
  height?: number;
  /** Color palette. Single color for monochrome charts. Default matches design lock. */
  colors?: string[];
  /** Optional title shown above the chart. */
  title?: string;
  /** For bar/area charts — stack series on top of each other. */
  stacked?: boolean;
  /** For line charts — smoothed or straight lines. Default 'smooth'. */
  curve?: 'smooth' | 'straight' | 'stepline';
  /** Horizontal bar chart. Default false. */
  horizontal?: boolean;
  /**
   * Passthrough for any ApexCharts option not covered by the props above.
   * See https://apexcharts.com/docs/options/ for the full reference.
   */
  options?: Record<string, unknown>;
}

// Default config that matches the design system lock: no toolbar, clean grid,
// inherited font, muted axis labels.
function buildConfig(props: ChartProps): Record<string, unknown> {
  const {
    type,
    series,
    categories,
    labels,
    height = 300,
    colors,
    title,
    stacked,
    curve = 'smooth',
    horizontal,
    options = {},
  } = props;

  const defaults: Record<string, unknown> = {
    chart: {
      type,
      height,
      stacked: !!stacked,
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 400 },
      background: 'transparent',
    },
    series,
    colors: colors || ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'],
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 3,
      padding: { top: 0, right: 0, bottom: 0, left: 8 },
    },
    stroke: {
      curve,
      width: type === 'line' ? 2.5 : type === 'area' ? 2 : 0,
    },
    fill: type === 'area' ? { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.5, opacityTo: 0.05 } } : undefined,
    dataLabels: { enabled: false },
    legend: {
      position: type === 'pie' || type === 'donut' || type === 'radialBar' || type === 'polarArea' ? 'bottom' : 'top',
      horizontalAlign: 'left',
      fontFamily: 'inherit',
      fontSize: '12px',
      markers: { size: 6 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: {
      theme: 'light',
      style: { fontFamily: 'inherit', fontSize: '12px' },
    },
    xaxis: categories
      ? {
          categories,
          labels: { style: { colors: '#6B7280', fontSize: '11px', fontFamily: 'inherit' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        }
      : undefined,
    yaxis: {
      labels: { style: { colors: '#6B7280', fontSize: '11px', fontFamily: 'inherit' } },
    },
    plotOptions: horizontal
      ? { bar: { horizontal: true, borderRadius: 4 } }
      : { bar: { borderRadius: 4, columnWidth: '60%' } },
  };

  if (labels) defaults.labels = labels;
  if (title) defaults.title = { text: title, style: { fontFamily: 'inherit', fontSize: '14px', fontWeight: 500 } };

  // Shallow merge: passthrough options override defaults at the top level.
  // For nested keys users need to include the full nested object.
  return { ...defaults, ...options };
}

export function Chart(props: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);
  // Serialize the props we care about for the effect dep list. ApexCharts
  // series mutation in place would otherwise be invisible to React.
  const serializedProps = JSON.stringify({
    type: props.type,
    series: props.series,
    categories: props.categories,
    labels: props.labels,
    height: props.height,
    colors: props.colors,
    title: props.title,
    stacked: props.stacked,
    curve: props.curve,
    horizontal: props.horizontal,
    options: props.options,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    function init() {
      if (cancelled) return;
      const ApexCharts = (window as unknown as { ApexCharts?: new (el: Element, opts: unknown) => { render: () => void; destroy: () => void } }).ApexCharts;
      if (!ApexCharts) {
        // CDN script hasn't loaded yet — poll briefly
        interval = setInterval(() => {
          if (cancelled) return;
          const ApexChartsReady = (window as unknown as { ApexCharts?: unknown }).ApexCharts;
          if (ApexChartsReady) {
            if (interval) clearInterval(interval);
            interval = null;
            init();
          }
        }, 100);
        return;
      }

      try {
        // Destroy any previous chart instance before creating a new one
        if (chartRef.current) {
          (chartRef.current as { destroy: () => void }).destroy();
          chartRef.current = null;
        }
        if (!containerRef.current) return;
        const config = buildConfig(props);
        const chart = new ApexCharts(containerRef.current, config);
        chart.render();
        chartRef.current = chart;
      } catch (err) {
        console.error('[chart] render failed', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (chartRef.current) {
        try { (chartRef.current as { destroy: () => void }).destroy(); } catch {}
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedProps]);

  return <div ref={containerRef} className="w-full" />;
}
