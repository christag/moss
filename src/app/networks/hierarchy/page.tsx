/**
 * Network Hierarchy Page
 *
 * Tree view of all networks showing subnet relationships and utilization
 */
'use client'

import React from 'react'
import { SubnetHierarchyTree } from '@/components/SubnetHierarchyTree'
import { useRouter } from 'next/navigation'

export default function NetworkHierarchyPage() {
  const router = useRouter()

  const handleNetworkClick = (networkId: string) => {
    router.push(`/networks/${networkId}`)
  }

  return (
    <div className="hierarchy-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Network Hierarchy</h1>
          <p className="page-description">
            View and manage subnet relationships with utilization tracking
          </p>
        </div>
        <button
          onClick={() => router.push('/networks')}
          className="back-button"
          aria-label="Back to Networks"
        >
          Back to Networks
        </button>
      </div>

      <div className="hierarchy-info">
        <div className="info-card">
          <h3>Drag and Drop</h3>
          <p>Drag networks to reorganize the hierarchy and set parent-child relationships</p>
        </div>
        <div className="info-card">
          <h3>Utilization Colors</h3>
          <ul>
            <li>
              <span className="color-dot green"></span> 0-49% (Healthy)
            </li>
            <li>
              <span className="color-dot blue"></span> 50-79% (Moderate)
            </li>
            <li>
              <span className="color-dot tangerine"></span> 80-89% (Warning)
            </li>
            <li>
              <span className="color-dot orange"></span> 90-100% (Critical)
            </li>
          </ul>
        </div>
        <div className="info-card">
          <h3>Navigation</h3>
          <p>Click on any network to view details and manage IP allocations</p>
        </div>
      </div>

      <SubnetHierarchyTree onNetworkClick={handleNetworkClick} />

      <style jsx>{`
        .hierarchy-page {
          min-height: 100vh;
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .page-title {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .page-description {
          margin: 0;
          font-size: 1rem;
          color: var(--color-brew-black-60);
        }

        .back-button {
          padding: 0.5rem 1rem;
          background: var(--color-brew-black-10);
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .back-button:hover {
          background: var(--color-brew-black-20);
        }

        .hierarchy-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .info-card {
          background: white;
          border-radius: 8px;
          padding: 1.25rem;
          border: 1px solid var(--color-brew-black-10);
        }

        .info-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .info-card p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--color-brew-black-60);
        }

        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-card li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-size: 0.9rem;
          color: var(--color-brew-black-60);
        }

        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .color-dot.green {
          background: var(--color-green);
        }

        .color-dot.blue {
          background: var(--color-morning-blue);
        }

        .color-dot.tangerine {
          background: var(--color-tangerine);
        }

        .color-dot.orange {
          background: var(--color-orange);
        }
      `}</style>
    </div>
  )
}
