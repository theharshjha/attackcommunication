import { Resend } from 'resend'
import { randomUUID } from 'crypto'
import { ChannelIntegration, MessagePayload } from './factory'

const resendApiKey = process.env.RESEND_API_KEY
const resendClient = resendApiKey ? new Resend(resendApiKey) : null

function ensureResend() {
  if (!resendClient) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return resendClient
}

export class EmailIntegration implements ChannelIntegration {
  async send(payload: MessagePayload) {
    try {
      const client = ensureResend()

      const { data, error } = await client.emails.send({
        from: payload.from || 'onboarding@resend.dev',
        to: payload.to,
        subject: 'Message from Unified Inbox',
        text: payload.content,
        html: `<p>${payload.content}</p>`,
      })

      if (error) {
        throw new Error(error.message)
      }

      return {
        externalId: data?.id ?? randomUUID(),
        status: 'sent',
      }
    } catch (error) {
      console.error('Email send error:', error)
      throw error
    }
  }
}

export async function sendEmail(to: string, subject: string, content: string) {
  const client = ensureResend()
  const { data, error } = await client.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject,
    text: content,
    html: `<p>${content}</p>`,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
