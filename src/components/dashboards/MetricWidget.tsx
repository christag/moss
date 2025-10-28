/**
 * Metric Widget Component
 *
 * Displays a single metric value with optional comparison and trend.
 */
'use client'

import React from 'react'

interface MetricWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number // Percentage change
    direction: 'up' | 'down'
  }
  color?: string
}

export function MetricWidget({
  title,
  value,
  subtitle,
  trend,
  color = '#1C7FF2',
}: MetricWidgetProps) {
  return (
    <div className="metric-widget">
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
      </div>
      <div className="widget-content">
        <div className="metric-value" style={{ color }}>
          {value}
        </div>
        {subtitle && <div className="metric-subtitle">{subtitle}</div>}
        {trend && (
          <div className={`metric-trend ${trend.direction}`}>
            <span className="trend-arrow">{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span className="trend-value">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .metric-widget {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .widget-header {
          margin-bottom: var(--spacing-md);
        }

        .widget-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-border-default);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .widget-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .metric-value {
          font-size: 48px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: var(--spacing-xs);
        }

        .metric-subtitle {
          font-size: 14px;
          color: var(--color-border-default);
          margin-bottom: var(--spacing-sm);
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
        }

        .metric-trend.up {
          color: var(--color-green);
        }

        .metric-trend.down {
          color: var(--color-error-border);
        }

        .trend-arrow {
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .metric-value {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  )
}
