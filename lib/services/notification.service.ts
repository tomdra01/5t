import { Resend } from "resend"

export interface NotificationPayload {
  to: string
  subject: string
  body: string
  cveId?: string
  severity?: string
  deadline?: string
}

export class NotificationService {
  static async sendVulnerabilityAlert(payload: NotificationPayload): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[Notification] Resend API key not configured - skipping email")
      return
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.NOTIFICATION_FROM_EMAIL || "security@5teen.app",
        to: payload.to,
        subject: payload.subject,
        html: this.buildEmailTemplate(payload),
      })
    } catch (error) {
      console.error("[Notification] Failed to send email:", error)
    }
  }

  static async sendDeadlineAlert(
    userEmail: string,
    cveId: string,
    severity: string,
    componentName: string,
    deadline: string
  ): Promise<void> {
    await this.sendVulnerabilityAlert({
      to: userEmail,
      subject: `[CRA Alert] ${severity} Vulnerability Deadline Approaching - ${cveId}`,
      body: `A ${severity.toLowerCase()} severity vulnerability (${cveId}) in ${componentName} requires attention before ${deadline}.`,
      cveId,
      severity,
      deadline,
    })
  }

  static async sendNewVulnerabilityAlert(
    userEmail: string,
    cveId: string,
    severity: string,
    componentName: string
  ): Promise<void> {
    await this.sendVulnerabilityAlert({
      to: userEmail,
      subject: `[CRA Alert] New ${severity} Vulnerability Detected - ${cveId}`,
      body: `A new ${severity.toLowerCase()} severity vulnerability (${cveId}) has been detected in ${componentName}.`,
      cveId,
      severity,
    })
  }

  private static buildEmailTemplate(payload: NotificationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .severity-critical { border-left-color: #dc2626; }
            .severity-high { border-left-color: #ea580c; }
            .severity-medium { border-left-color: #f59e0b; }
            .severity-low { border-left-color: #84cc16; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>5teen CRA Compliance Alert</h1>
            </div>
            <div class="content">
              <div class="alert-box severity-${payload.severity?.toLowerCase()}">
                <p>${payload.body}</p>
                ${payload.cveId ? `<p><strong>CVE ID:</strong> ${payload.cveId}</p>` : ""}
                ${payload.severity ? `<p><strong>Severity:</strong> ${payload.severity}</p>` : ""}
                ${payload.deadline ? `<p><strong>Reporting Deadline:</strong> ${payload.deadline}</p>` : ""}
              </div>
              <p>This notification is part of your CRA Article 15 compliance obligations.</p>
              <p>Please review and address this vulnerability in the 5teen platform.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from 5teen CRA Compliance Platform</p>
              <p>&copy; 2025 5teen - Secure Software Development</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}
