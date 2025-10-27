/**
 * QRCodeLabel Component
 *
 * Generates printable QR code labels for equipment with device info
 * Supports both single device and bulk generation
 */
'use client'

import React, { useRef } from 'react'
import { jsPDF } from 'jspdf'

interface QRCodeLabelProps {
  deviceId: string
  assetTag: string
  hostname: string
  model?: string
  qrCodeDataUrl: string
  onClose?: () => void
}

export default function QRCodeLabel({
  deviceId: _deviceId,
  assetTag,
  hostname,
  model,
  qrCodeDataUrl,
  onClose,
}: QRCodeLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [2.5, 2], // 2.5" x 2" label size
    })

    // Add QR code image
    pdf.addImage(qrCodeDataUrl, 'PNG', 0.25, 0.25, 1.5, 1.5)

    // Add asset tag text
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(assetTag, 1.25, 1.85, { align: 'center' })

    // Download
    pdf.save(`${assetTag}-qr-label.pdf`)
  }

  return (
    <div className="qr-label-modal">
      <div className="qr-label-overlay" onClick={onClose} />
      <div className="qr-label-content">
        <div className="qr-label-header">
          <h2>QR Code Label</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="qr-label-preview" ref={labelRef}>
          <div className="qr-label-inner">
            <img src={qrCodeDataUrl} alt={`QR code for ${assetTag}`} className="qr-code-image" />
            <div className="device-info">
              <div className="asset-tag">{assetTag}</div>
              <div className="hostname">{hostname}</div>
              {model && <div className="model">{model}</div>}
            </div>
          </div>
        </div>

        <div className="qr-label-actions">
          <button onClick={handlePrint} className="button-secondary">
            Print Label
          </button>
          <button onClick={handleDownloadPDF} className="button-primary">
            Download PDF
          </button>
        </div>
      </div>

      <style jsx>{`
        .qr-label-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-label-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(35, 31, 32, 0.5);
        }

        .qr-label-content {
          position: relative;
          background: var(--color-off-white);
          border-radius: 8px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .qr-label-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .qr-label-header h2 {
          font-size: 28.8px;
          font-weight: 600;
          color: var(--color-brew-black);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 36px;
          color: var(--color-brew-black);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          line-height: 1;
          transition: opacity 0.2s;
        }

        .close-button:hover {
          opacity: 0.6;
        }

        .qr-label-preview {
          background: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .qr-label-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .qr-code-image {
          width: 200px;
          height: 200px;
          image-rendering: crisp-edges;
        }

        .device-info {
          text-align: center;
        }

        .asset-tag {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-brew-black);
          margin-bottom: 8px;
        }

        .hostname {
          font-size: 14.4px;
          color: var(--color-brew-black);
          margin-bottom: 4px;
        }

        .model {
          font-size: 12px;
          color: rgba(35, 31, 32, 0.6);
        }

        .qr-label-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .button-primary,
        .button-secondary {
          height: 44px;
          padding: 0 24px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .button-primary {
          background: var(--color-brew-black);
          color: var(--color-off-white);
        }

        .button-primary:hover {
          opacity: 0.8;
        }

        .button-secondary {
          background: transparent;
          color: var(--color-brew-black);
          border: 1px solid var(--color-border-default);
        }

        .button-secondary:hover {
          background: rgba(35, 31, 32, 0.05);
        }

        @media print {
          .qr-label-modal {
            position: static;
          }

          .qr-label-overlay {
            display: none;
          }

          .qr-label-content {
            box-shadow: none;
            padding: 0;
            max-width: none;
            width: 2.5in;
          }

          .qr-label-header,
          .qr-label-actions {
            display: none;
          }

          .qr-label-preview {
            border: none;
            padding: 0.25in;
            margin: 0;
            width: 2.5in;
            height: 2in;
          }

          .qr-code-image {
            width: 1.5in;
            height: 1.5in;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Bulk QR Label Generator Component
 * Generates multiple labels on a single page (grid layout)
 */
interface BulkQRCodeLabelProps {
  devices: Array<{
    deviceId: string
    assetTag: string
    hostname: string
    model?: string
    qrCodeDataUrl: string
  }>
  onClose?: () => void
}

export function BulkQRCodeLabel({ devices, onClose }: BulkQRCodeLabelProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter', // 8.5" x 11"
    })

    const labelsPerRow = 3
    const labelWidth = 2.5
    const labelHeight = 2
    const marginX = (8.5 - labelsPerRow * labelWidth) / (labelsPerRow + 1)
    const marginY = 0.5

    devices.forEach((device, index) => {
      const row = Math.floor(index / labelsPerRow)
      const col = index % labelsPerRow

      // Add new page if needed
      if (index > 0 && index % (labelsPerRow * 5) === 0) {
        pdf.addPage()
      }

      const x = marginX + col * (labelWidth + marginX)
      const y = marginY + (row % 5) * (labelHeight + marginY)

      // Add QR code
      pdf.addImage(device.qrCodeDataUrl, 'PNG', x + 0.5, y + 0.25, 1.5, 1.5)

      // Add asset tag
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text(device.assetTag, x + 1.25, y + 1.85, { align: 'center' })
    })

    pdf.save('bulk-qr-labels.pdf')
  }

  return (
    <div className="qr-label-modal">
      <div className="qr-label-overlay" onClick={onClose} />
      <div className="bulk-qr-label-content">
        <div className="qr-label-header">
          <h2>Bulk QR Code Labels ({devices.length})</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="bulk-qr-label-grid">
          {devices.map((device) => (
            <div key={device.deviceId} className="bulk-qr-label-item">
              <img
                src={device.qrCodeDataUrl}
                alt={`QR code for ${device.assetTag}`}
                className="qr-code-image"
              />
              <div className="device-info">
                <div className="asset-tag">{device.assetTag}</div>
                <div className="hostname">{device.hostname}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="qr-label-actions">
          <button onClick={handlePrint} className="button-secondary">
            Print All
          </button>
          <button onClick={handleDownloadPDF} className="button-primary">
            Download PDF
          </button>
        </div>
      </div>

      <style jsx>{`
        .bulk-qr-label-content {
          position: relative;
          background: var(--color-off-white);
          border-radius: 8px;
          padding: 32px;
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .bulk-qr-label-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .bulk-qr-label-item {
          background: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        @media print {
          .bulk-qr-label-content {
            box-shadow: none;
            padding: 0;
            max-width: none;
            max-height: none;
          }

          .qr-label-header,
          .qr-label-actions {
            display: none;
          }

          .bulk-qr-label-grid {
            display: grid;
            grid-template-columns: repeat(3, 2.5in);
            gap: 0.25in;
            margin: 0.5in;
          }

          .bulk-qr-label-item {
            border: 1px solid #e0e0e0;
            padding: 0.25in;
            width: 2.5in;
            height: 2in;
            page-break-inside: avoid;
          }

          .qr-code-image {
            width: 1.5in;
            height: 1.5in;
          }
        }
      `}</style>
    </div>
  )
}
