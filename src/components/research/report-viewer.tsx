'use client'

import { useEffect, useRef } from 'react'

interface ReportViewerProps {
  html: string
  title: string
  slug?: string
}

/**
 * Renders a self-contained interactive HTML report in an iframe.
 * The report takes over the full viewport — no header, no chrome.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ReportViewer({ html, title, slug }: ReportViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }, [html])

  return (
    <>
      {/* Minimal floating back button */}
      <a
        href="/research"
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 9999,
          padding: '6px 14px',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          color: '#f0ece4',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          textDecoration: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        ZAVIS Research
      </a>

      <iframe
        ref={iframeRef}
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
        sandbox="allow-scripts allow-same-origin"
        title={title}
      />
    </>
  )
}
