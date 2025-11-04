import twilio from 'twilio'
import { ChannelIntegration, MessagePayload } from './factory'

function ensureClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio SMS integration is not configured')
  }

  return twilio(accountSid, authToken)
}

export class TwilioSMSIntegration implements ChannelIntegration {
  async send(payload: MessagePayload) {
    try {
      const client = ensureClient()
      const fromNumber = payload.from || process.env.TWILIO_PHONE_NUMBER

      if (!fromNumber) {
        throw new Error('TWILIO_PHONE_NUMBER is not configured')
      }

      const message = await client.messages.create({
        body: payload.content,
        from: fromNumber,
        to: payload.to,
      })

      return {
        externalId: message.sid,
        status: message.status,
      }
    } catch (error) {
      console.error('Twilio SMS error:', error)
      throw error
    }
  }
}

export async function sendSMS(to: string, content: string) {
  const client = ensureClient()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!fromNumber) {
    throw new Error('TWILIO_PHONE_NUMBER is not configured')
  }

  return client.messages.create({
    body: content,
    from: fromNumber,
    to,
  })
}
