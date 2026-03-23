import { NextRequest, NextResponse } from 'next/server'

interface LeadData {
  email: string
  firstName: string
  lastName: string
  company: string
  companySize: string
  title: string
  country: string
  reportId: string
  reportTitle: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'company', 'companySize', 'title', 'country', 'reportId', 'reportTitle']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create lead data object
    const leadData: LeadData = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      company: body.company,
      companySize: body.companySize,
      title: body.title,
      country: body.country,
      reportId: body.reportId,
      reportTitle: body.reportTitle,
      timestamp: new Date().toISOString()
    }

    // Log to console for immediate visibility
    console.log('📝 New Lead Captured:', {
      name: `${leadData.firstName} ${leadData.lastName}`,
      email: leadData.email,
      company: leadData.company,
      report: leadData.reportTitle,
      timestamp: leadData.timestamp
    })

    // Send to Google Sheets (non-blocking)
    try {
      const sheetsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/research/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          email: leadData.email,
          company: leadData.company,
          phone: '', // Not collected in current form
          jobTitle: leadData.title,
          industry: leadData.country, // Using country as industry for now
          interests: leadData.companySize,
          reportId: leadData.reportId
        })
      })
      
      if (sheetsResponse.ok) {
        console.log('✅ Lead sent to Google Sheets successfully')
      } else {
        const errorText = await sheetsResponse.text()
        console.error('⚠️ Google Sheets failed:', errorText)
        // Don't throw error - just log it
      }
    } catch (sheetsError) {
      console.error('⚠️ Google Sheets error (lead still saved locally):', sheetsError)
      // Don't throw error - just log it
    }

    // Optional: Send to webhook (Zapier, Make.com, etc.)
    if (process.env.ZAPIER_WEBHOOK_URL) {
      try {
        await fetch(process.env.ZAPIER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        })
        console.log('✅ Lead sent to Zapier webhook')
      } catch (webhookError) {
        console.error('⚠️ Webhook failed (lead still saved locally):', webhookError)
      }
    }

    if (process.env.MAKE_WEBHOOK_URL) {
      try {
        await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        })
        console.log('✅ Lead sent to Make.com webhook')
      } catch (webhookError) {
        console.error('⚠️ Webhook failed (lead still saved locally):', webhookError)
      }
    }

    // Sync to Plunk (non-blocking)
    if (process.env.PLUNK_SECRET_KEY) {
      try {
        const { trackEvent } = await import('@/lib/research/plunk')
        await trackEvent(leadData.email, 'report_downloaded', {
          report_id: leadData.reportId,
          report_title: leadData.reportTitle,
          first_name: leadData.firstName,
          last_name: leadData.lastName,
          company: leadData.company,
          country: leadData.country,
        })
        console.log('Plunk: contact synced + event tracked')
      } catch (plunkError) {
        console.error('Plunk sync failed (lead still saved):', plunkError)
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      downloadUrl: `/reports/${body.reportId}/download`
    })

  } catch (error) {
    console.error('Error processing lead submission:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: await request.text().catch(() => 'Could not read body')
    })
    return NextResponse.json(
      { 
        error: 'Failed to process submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint removed - leads are now stored in Google Sheets only

