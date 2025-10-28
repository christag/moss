/**
 * Dashboard View Component
 *
 * Renders a read-only dashboard with widgets positioned in a responsive grid.
 * Uses react-grid-layout for positioning.
 */
'use client'

import React from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { MetricWidget } from './MetricWidget'
import { ChartWidget } from './ChartWidget'
import type { CustomDashboard, WidgetConfig } from '@/lib/schemas/reports'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardViewProps {
  dashboard: CustomDashboard
}

export function DashboardView({ dashboard }: DashboardViewProps) {
  // Render individual widget based on type
  const renderWidget = (widget: WidgetConfig) => {
    const config = widget.configuration as Record<string, unknown>

    // For MVP, we support stat and chart widgets only
    if (
      widget.widget_name.toLowerCase().includes('metric') ||
      widget.widget_name.toLowerCase().includes('stat')
    ) {
      return (
        <MetricWidget
          title={widget.widget_name}
          value={config.value as string | number}
          subtitle={config.subtitle as string | undefined}
          trend={config.trend as { value: number; direction: 'up' | 'down' } | undefined}
          color={config.color as string | undefined}
        />
      )
    }

    if (widget.widget_name.toLowerCase().includes('chart')) {
      return (
        <ChartWidget
          title={widget.widget_name}
          data={(config.data as Array<{ name: string; value: number }>) || []}
          color={config.color as string | undefined}
          height={config.height as number | undefined}
        />
      )
    }

    // Fallback for unknown widget types
    return (
      <div className="widget-placeholder">
        <p>Widget type not supported: {widget.widget_name}</p>
      </div>
    )
  }

  // Convert layout to react-grid-layout format
  const layouts = {
    lg: dashboard.layout,
    md: dashboard.layout.map((item) => ({ ...item, w: Math.min(item.w, 8) })),
    sm: dashboard.layout.map((item) => ({ ...item, w: Math.min(item.w, 4) })),
    xs: dashboard.layout.map((item) => ({ ...item, w: 2, x: 0 })),
  }

  return (
    <div className="dashboard-view">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 2 }}
        rowHeight={100}
        isDraggable={false}
        isResizable={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {dashboard.widgets.map((widget) => (
          <div key={widget.id}>{renderWidget(widget)}</div>
        ))}
      </ResponsiveGridLayout>

      <style jsx global>{`
        .dashboard-view {
          width: 100%;
        }

        .widget-placeholder {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-border-default);
          text-align: center;
        }

        /* Override react-grid-layout styles */
        .react-grid-layout {
          position: relative;
          transition: height 200ms ease;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }

        .react-grid-item.react-grid-placeholder {
          background: rgba(28, 127, 242, 0.1);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
