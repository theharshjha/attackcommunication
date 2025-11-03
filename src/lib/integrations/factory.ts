import { TwilioSMSIntegration } from './twilio-sms'
import { TwilioWhatsAppIntegration } from './twilio-whatsapp'
import { EmailIntegration } from './email'

export interface MessagePayload {
  to: string
  content: string
  from?: string
}

export interface ChannelIntegration {
  send(payload: MessagePayload): Promise<{ externalId: string; status: string }>
}

export function createSender(channel: 'SMS' | 'WHATSAPP' | 'EMAIL'): ChannelIntegration {
  switch (channel) {
    case 'SMS':
      return new TwilioSMSIntegration()
    case 'WHATSAPP':
      return new TwilioWhatsAppIntegration()
    case 'EMAIL':
      return new EmailIntegration()
    default:
      throw new Error(`Unsupported channel: ${channel}`)
  }
}