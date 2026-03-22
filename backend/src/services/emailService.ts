import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { config } from '../config'

const ses = new SESClient({ region: config.aws.region })

const FROM_EMAIL = config.ses.fromEmail

async function sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
  if (!FROM_EMAIL) {
    console.log(`[Email skipped - no FROM_EMAIL configured] To: ${to}, Subject: ${subject}`)
    return
  }

  try {
    await ses.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: htmlBody },
          },
        },
      })
    )
    console.log(`Email sent to ${to}: ${subject}`)
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, (err as Error).message)
  }
}

export async function sendInterviewScheduledEmail(
  candidateEmail: string,
  candidateName: string,
  jdTitle: string,
  scheduledStart: string,
  durationMinutes: number
): Promise<void> {
  const date = new Date(scheduledStart).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  })

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">SkillLens - Interview Scheduled</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi ${candidateName},</p>
        <p>A mock interview has been scheduled for you:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Position</td><td style="padding: 8px 0; font-weight: 600;">${jdTitle}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Date & Time</td><td style="padding: 8px 0; font-weight: 600;">${date} IST</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Duration</td><td style="padding: 8px 0; font-weight: 600;">${durationMinutes} minutes</td></tr>
        </table>
        <p>Log in to your SkillLens account to join the interview when it's time.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Good luck!</p>
      </div>
    </div>
  `

  await sendEmail(candidateEmail, `Interview Scheduled: ${jdTitle}`, html)
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${config.clientOrigin}/reset-password?token=${token}`

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">SkillLens - Password Reset</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Or copy this link: ${resetUrl}</p>
      </div>
    </div>
  `

  await sendEmail(email, 'Reset your SkillLens password', html)
}

export async function sendEvaluationCompleteEmail(
  adminEmail: string,
  candidateName: string,
  jdTitle: string,
  overallRating: number,
  recommendation: string
): Promise<void> {
  const ratingColor = overallRating >= 7 ? '#16a34a' : overallRating >= 5 ? '#ca8a04' : '#dc2626'

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">SkillLens - Evaluation Complete</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Interview evaluation is ready:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Candidate</td><td style="padding: 8px 0; font-weight: 600;">${candidateName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Position</td><td style="padding: 8px 0; font-weight: 600;">${jdTitle}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Score</td><td style="padding: 8px 0; font-weight: 700; font-size: 20px; color: ${ratingColor};">${overallRating}/10</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Recommendation</td><td style="padding: 8px 0; font-weight: 600;">${recommendation}</td></tr>
        </table>
        <p>Log in to SkillLens to view the full evaluation report.</p>
      </div>
    </div>
  `

  await sendEmail(adminEmail, `Evaluation Complete: ${candidateName} - ${jdTitle}`, html)
}
