/**
 * Chart Widget Component
 *
 * Displays a simple bar chart using Recharts.
 */
'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartWidgetProps {
  title: string
  data: Array<{ name: string; value: number }>
  color?: string
  height?: number
}

export function ChartWidget({ title, data, color = '#1C7FF2', height = 300 }: ChartWidgetProps) {
  return (
    <div className="chart-widget">
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
      </div>
      <div className="widget-content">
        {data.length === 0 ? (
          <div className="no-data">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7885' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7885' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #6B7885',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <style jsx>{`
        .chart-widget {
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
        }

        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--color-border-default);
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}
