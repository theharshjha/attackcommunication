import twilio from 'twilio'
import { ChannelIntegration, MessagePayload } from './factory'

function ensureClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio WhatsApp integration is not configured')
  }

  return twilio(accountSid, authToken)
}

function formatWhatsAppNumber(value: string) {
  const stripped = value.replace(/^whatsapp:/i, '').trim()
  if (!stripped) {
    throw new Error('Invalid WhatsApp destination number')
  }
  return `whatsapp:${stripped}`
}

export class TwilioWhatsAppIntegration implements ChannelIntegration {
  async send(payload: MessagePayload) {
    try {
      const client = ensureClient()
      const fromNumber = payload.from || process.env.TWILIO_WHATSAPP_NUMBER

      if (!fromNumber) {
        throw new Error('TWILIO_WHATSAPP_NUMBER is not configured')
      }

      const message = await client.messages.create({
        body: payload.content,
        from: formatWhatsAppNumber(fromNumber),
        to: formatWhatsAppNumber(payload.to),
      })

      return {
        externalId: message.sid,
        status: message.status,
      }
    } catch (error) {
      console.error('Twilio WhatsApp error:', error)
      throw error
    }
  }
}

export async function sendWhatsApp(to: string, content: string) {
  const client = ensureClient()
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

  if (!fromNumber) {
    throw new Error('TWILIO_WHATSAPP_NUMBER is not configured')
  }

  return client.messages.create({
    body: content,
    from: formatWhatsAppNumber(fromNumber),
    to: formatWhatsAppNumber(to),
  })
}
