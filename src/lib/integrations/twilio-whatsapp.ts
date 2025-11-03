import twilio from 'twilio'
import { ChannelIntegration, MessagePayload } from './factory'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export class TwilioWhatsAppIntegration implements ChannelIntegration {
  async send(payload: MessagePayload) {
    try {
      // Same as SMS but with "whatsapp:" prefix
      const message = await client.messages.create({
        body: payload.content,
        from: payload.from || process.env.TWILIO_WHATSAPP_NUMBER, // Sandbox: whatsapp:+14155238886
        to: `whatsapp:${payload.to}`,  // KEY DIFFERENCE: Add whatsapp: prefix
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