import { Resend } from 'resend'
import { ChannelIntegration, MessagePayload } from './factory'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export class EmailIntegration implements ChannelIntegration {
  async send(payload: MessagePayload) {
    try {
      // Call Resend API to send email
      const { data, error } = await resend.emails.send({
        from: payload.from || 'onboarding@resend.dev', // Resend's test email (works without verification)
        to: payload.to,                                 // Recipient email
        subject: 'Message from Unified Inbox',          // Email subject
        text: payload.content,                          // Plain text version
        html: `<p>${payload.content}</p>`,             // HTML version (basic for now)
      })

      if (error) {
        throw new Error(error.message)
      }

      return {
        externalId: data?.id || 'email-id',  // Resend's message ID
        status: 'sent',
      }
    } catch (error) {
      console.error('Email send error:', error)
      throw error
    }
  }
}