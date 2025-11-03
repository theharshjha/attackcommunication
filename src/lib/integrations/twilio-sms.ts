import twilio from 'twilio'
import { ChannelIntegration, MessagePayload } from './factory'

// Initialize Twilio client with your credentials
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export class TwilioSMSIntegration implements ChannelIntegration {
  async send(payload: MessagePayload) {
    try {
      // Call Twilio API to send SMS
      const message = await client.messages.create({
        body: payload.content,                              // Your message text
        from: payload.from || process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
        to: payload.to,                                     // Recipient's number
      })

      // Return Twilio's message ID and status
      return {
        externalId: message.sid,  // Twilio's unique ID (e.g., "SM12345...")
        status: message.status,   // "queued", "sent", "delivered", etc.
      }
    } catch (error) {
      console.error('Twilio SMS error:', error)
      throw error  // Re-throw so calling code knows it failed
    }
  }
}