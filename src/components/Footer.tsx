/**
 * Footer Component
 *
 * Site-wide footer with branding, navigation, and copyright information.
 * Design based on Figma specs: Footer Updates.svg
 */
'use client'

import React from 'react'
import Link from 'next/link'

export interface FooterProps {
  className?: string
}

export function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`site-footer ${className}`}>
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section">
            <h3 className="footer-heading">M.O.S.S.</h3>
            <p className="footer-description">Material Organization & Storage System</p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-subheading">Quick Links</h4>
            <nav className="footer-nav">
              <Link href="/" className="footer-link">
                Dashboard
              </Link>
              <Link href="/people" className="footer-link">
                People
              </Link>
              <Link href="/devices" className="footer-link">
                Devices
              </Link>
              <Link href="/networks" className="footer-link">
                Networks
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 className="footer-subheading">Resources</h4>
            <nav className="footer-nav">
              <Link href="/admin" className="footer-link">
                Admin
              </Link>
              <Link href="/import" className="footer-link">
                Import Data
              </Link>
              <a
                href="https://github.com/yourusername/moss"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Documentation
              </a>
            </nav>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h4 className="footer-subheading">Support</h4>
            <nav className="footer-nav">
              <a
                href="https://github.com/yourusername/moss/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Report Issue
              </a>
              <a
                href="https://github.com/yourusername/moss"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copyright">© {currentYear} M.O.S.S. All rights reserved.</p>
          <div className="footer-legal">
            <Link href="/privacy" className="footer-link-sm">
              Privacy Policy
            </Link>
            <span className="footer-separator">•</span>
            <Link href="/terms" className="footer-link-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          background-color: var(--color-black);
          color: var(--color-off-white);
          margin-top: auto;
          padding: 48px 0 24px;
        }

        .footer-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          margin-bottom: 32px;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-heading {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: var(--color-off-white);
        }

        .footer-description {
          font-size: 14px;
          color: rgba(250, 249, 245, 0.7);
          margin: 0;
          line-height: 1.5;
        }

        .footer-subheading {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--color-off-white);
        }

        .footer-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-link {
          color: rgba(250, 249, 245, 0.7);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: var(--color-off-white);
        }

        .footer-link:focus-visible {
          outline: 2px solid var(--color-off-white);
          outline-offset: 2px;
          border-radius: 2px;
        }

        .footer-divider {
          border-top: 1px solid rgba(250, 249, 245, 0.2);
          margin: 32px 0 24px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-copyright {
          font-size: 14px;
          color: rgba(250, 249, 245, 0.6);
          margin: 0;
        }

        .footer-legal {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-link-sm {
          color: rgba(250, 249, 245, 0.6);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-link-sm:hover {
          color: var(--color-off-white);
        }

        .footer-link-sm:focus-visible {
          outline: 2px solid var(--color-off-white);
          outline-offset: 2px;
          border-radius: 2px;
        }

        .footer-separator {
          color: rgba(250, 249, 245, 0.4);
          user-select: none;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .site-footer {
            padding: 32px 0 16px;
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </footer>
  )
}
