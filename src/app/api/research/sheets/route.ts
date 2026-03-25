/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, company, phone, jobTitle, industry, interests, reportId } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize Google Sheets API
    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SHEET_ID environment variable is not set')
      throw new Error('GOOGLE_SHEET_ID environment variable is not set')
    }

    const tabName = process.env.GOOGLE_SHEET_TAB_NAME
    if (!tabName) {
      console.error('❌ GOOGLE_SHEET_TAB_NAME environment variable is not set')
      throw new Error('GOOGLE_SHEET_TAB_NAME environment variable is not set')
    }

    console.log('🔧 Environment variables check:', {
      hasCredentialsPath: !!process.env.GOOGLE_SHEETS_CREDENTIALS_PATH,
      hasCredentials: !!process.env.GOOGLE_SHEETS_CREDENTIALS,
      spreadsheetId,
      tabName
    })

    // Support multiple credential approaches
    let auth
    if (process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      // Option 1: Individual credentials (recommended)
      auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
    } else if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      // Option 2: JSON string in environment variable
      auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
    } else if (process.env.GOOGLE_SHEETS_CREDENTIALS_PATH) {
      // Option 3: File path
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SHEETS_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
    } else {
      console.error('❌ No Google Sheets credentials configured')
      throw new Error('Google Sheets credentials not configured')
    }

    const sheets = google.sheets({ version: 'v4', auth })
    const range = `${tabName}!A:I`

    // Prepare data for the sheet - mapping to match existing headers
    const timestamp = new Date().toISOString()
    const values = [
      [
        email,           // A: Business email
        firstName,        // B: First Name  
        lastName,         // C: Last Name
        company || '',    // D: Company
        interests || '',  // E: Company Size (using interests/companySize)
        jobTitle || '',   // F: Title
        industry || '',   // G: Country (using industry/country)
        reportId || '',   // H: Report ID
        timestamp         // I: Timestamp
      ]
    ]

    // Append data to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    })

    console.log('✅ Data successfully added to Google Sheets:', response.data)

    return NextResponse.json({
      success: true,
      message: 'Data added to Google Sheets successfully',
      updatedRows: response.data.updates?.updatedRows || 1
    })

  } catch (error) {
    console.error('❌ Google Sheets API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add data to Google Sheets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
