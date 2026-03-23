import { NextRequest, NextResponse } from 'next/server'
import { generateResearchEmail } from '@/lib/research/email-templates'

/**
 * POST /api/emails/preview — Generate and preview an email from report data.
 * Does NOT send — just returns the HTML for preview.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    reportTitle,
    reportUrl,
    reportCategory = 'Business',
    headlineStat,
    headlineStatContext,
    keyFindings = [],
    bridgeText,
    recipientFirstName,
  } = body

  if (!reportTitle || !reportUrl || !headlineStat) {
    return NextResponse.json(
      { error: 'reportTitle, reportUrl, and headlineStat are required' },
      { status: 400 }
    )
  }

  const html = generateResearchEmail({
    reportTitle,
    reportUrl,
    reportCategory,
    headlineStat,
    headlineStatContext: headlineStatContext || '',
    keyFindings,
    bridgeText: bridgeText || 'Read the full report for detailed analysis and actionable recommendations.',
    recipientFirstName,
  })

  return NextResponse.json({ html, subject: `New Research: ${reportTitle}` })
}
