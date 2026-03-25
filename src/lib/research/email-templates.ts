/**
 * Zavis Research Email Templates
 *
 * These generate the HTML that gets:
 * 1. Stored in email_blasts.body_html (NeonDB)
 * 2. Previewed in the dashboard
 * 3. Pushed to Plunk as a template (once domain is verified)
 * 4. Sent to recipients via Plunk transactional API
 *
 * Variables use Handlebars syntax: {{variable}} for Plunk compatibility.
 * When sending via API, we replace variables before sending.
 */

export interface ResearchEmailData {
  reportTitle: string
  reportUrl: string
  reportCategory: string
  headlineStat: string
  headlineStatContext: string
  keyFindings: string[] // 3 max
  bridgeText: string
  recipientFirstName?: string
}

/**
 * Generate the research report email HTML.
 * Branded Zavis template — table-based for email client compatibility.
 */
export function generateResearchEmail(data: ResearchEmailData): string {
  const findings = data.keyFindings.slice(0, 3)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${data.reportTitle} — Zavis Research</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;">
<tr><td align="center" style="padding:32px 16px;">

<!-- Inner container -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e8e8e6;">

  <!-- Header bar -->
  <tr>
    <td style="padding:24px 32px;border-bottom:2px solid #006828;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:20px;font-weight:700;color:#1c1c1c;letter-spacing:0.5px;">ZAVIS</span>
            <span style="font-size:13px;font-weight:400;color:#999;margin-left:6px;">RESEARCH</span>
          </td>
          <td align="right">
            <span style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#006828;background:#00682812;padding:4px 10px;border-radius:12px;">${data.reportCategory}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Headline stat -->
  <tr>
    <td style="padding:40px 32px 16px;">
      <div style="font-size:48px;font-weight:800;color:#006828;line-height:1;font-family:'Georgia',serif;">${data.headlineStat}</div>
      <div style="font-size:14px;color:#888;margin-top:6px;">${data.headlineStatContext}</div>
    </td>
  </tr>

  <!-- Greeting + hook -->
  <tr>
    <td style="padding:8px 32px 16px;">
      <p style="font-size:16px;line-height:1.6;color:#1c1c1c;margin:0;">
        Hi${data.recipientFirstName ? ' ' + data.recipientFirstName : ''},
      </p>
      <p style="font-size:15px;line-height:1.7;color:#444;margin:12px 0 0;">
        Our latest research is out: <strong style="color:#1c1c1c;">${data.reportTitle}</strong>
      </p>
    </td>
  </tr>

  <!-- Key findings -->
  <tr>
    <td style="padding:8px 32px 8px;">
      <p style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin:0 0 12px;">Key Findings</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${findings.map((finding, i) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #f0f0ee;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:28px;vertical-align:top;">
                  <div style="width:22px;height:22px;border-radius:50%;background:#00682812;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#006828;">${i + 1}</div>
                </td>
                <td style="padding-left:10px;">
                  <span style="font-size:14px;color:#333;line-height:1.5;">${finding}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('')}
      </table>
    </td>
  </tr>

  <!-- Bridge text -->
  <tr>
    <td style="padding:16px 32px;">
      <p style="font-size:14px;line-height:1.7;color:#666;margin:0;">${data.bridgeText}</p>
    </td>
  </tr>

  <!-- CTA Button -->
  <tr>
    <td style="padding:8px 32px 32px;" align="center">
      <a href="${data.reportUrl}" target="_blank" style="display:inline-block;background:#1c1c1c;color:#ffffff;padding:14px 36px;border-radius:100px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
        Read the Full Report
      </a>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td style="padding:0 32px;">
      <div style="border-top:1px solid #eee;"></div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 32px;background:#fafaf8;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:14px;font-weight:700;color:#1c1c1c;">ZAVIS</span>
            <span style="font-size:11px;color:#999;margin-left:4px;">Research</span>
          </td>
          <td align="right">
            <a href="https://www.zavis.ai" style="font-size:12px;color:#006828;text-decoration:none;">zavis.ai</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#aaa;margin:12px 0 0;line-height:1.6;">
        You received this because you subscribed to Zavis Research updates.<br>
        <a href="{{unsubscribeUrl}}" style="color:#999;">Unsubscribe</a> · <a href="{{manageUrl}}" style="color:#999;">Manage preferences</a>
      </p>
    </td>
  </tr>

</table>
<!-- /Inner container -->

</td></tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>`
}

/**
 * Push a template to Plunk via API.
 * Call this once domain is verified.
 */
export async function createPlunkTemplate(name: string, subject: string, html: string) {
  const key = process.env.PLUNK_SECRET_KEY
  if (!key) throw new Error('PLUNK_SECRET_KEY not set')

  const res = await fetch('https://next-api.useplunk.com/templates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      subject,
      body: html,
      from: 'research@zavis.ai',
      type: 'marketing', // marketing includes unsubscribe handling
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Failed to create template')
  return data
}
