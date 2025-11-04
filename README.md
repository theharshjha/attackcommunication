# AttackCommunication

A modern, full-stack omnichannel communication platform built with Next.js that enables teams to manage customer conversations across SMS, WhatsApp, and Email from a unified inbox.

LOOM VIDEO LINK: https://www.loom.com/share/9dfa79e49fff46deabdc40adcaee7629


## 🚀 Features

### Core Functionality
- **Unified Inbox**: Manage all customer communications from a single interface
- **Multi-Channel Support**: Handle SMS, WhatsApp, and Email conversations seamlessly
- **Real-time Updates**: Live conversation updates using Socket.IO
- **Conversation Management**: Organize conversations with states (Open, Waiting, Closed)
- **Contact Management**: Centralized contact database with automatic deduplication
- **User Assignment**: Assign conversations to team members for better workflow
- **Notes System**: Add internal notes to contacts for team collaboration
- **Role-Based Access**: Support for Admin, Editor, and Viewer roles

### Communication Channels
- **SMS**: Powered by Twilio
- **WhatsApp**: Powered by Twilio WhatsApp Business API
- **Email**: Powered by Resend/Nodemailer

### User Interface
- **Modern Dashboard**: Clean, intuitive interface built with React 19
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Filtering**: Filter conversations by channel and state
- **Message History**: Complete conversation history with timestamps
- **Contact Details**: View and edit contact information inline

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma 6
- **Authentication**: Better Auth
- **Real-time**: Socket.IO

### Integrations
- **SMS/WhatsApp**: Twilio
- **Email**: Resend / Nodemailer
- **File Storage**: Vercel Blob

### Development Tools
- **Language**: TypeScript 5
- **Linting**: ESLint + Prettier
- **Package Manager**: npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v20 or higher
- **PostgreSQL**: v14 or higher
- **npm**: v9 or higher

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd attackcommunication
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/attackcommunication"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890" # Your Twilio phone number
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890" # Your Twilio WhatsApp number

# Email (Choose one)
# Option 1: Resend
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Option 2: Nodemailer (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="noreply@yourdomain.com"

# Development Settings (Optional)
NODE_ENV="development"
SKIP_TWILIO_VALIDATION="true" # Skip webhook signature validation in development
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database with sample data
npm run seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🚦 Getting Started

### First Time Setup

1. **Create an Account**
   - Navigate to `http://localhost:3000`
   - Click "Sign Up" and create your account
   - Verify your email (if email verification is enabled)

2. **Configure Integrations**
   - Set up your Twilio account for SMS/WhatsApp
   - Configure your email provider (Resend or SMTP)
   - Set up webhook URLs for incoming messages

3. **Set Up Webhooks**
   
   **For Twilio (SMS/WhatsApp):**
   - Go to your Twilio Console
   - Configure webhook URL: `https://yourdomain.com/api/webhooks/twilio`
   - Set HTTP Method to POST
   
   **For Email:**
   - Configure your email provider to forward incoming emails to: `https://yourdomain.com/api/webhooks/email`

### Using the Platform

#### Managing Conversations
1. **Inbound Messages**: New messages appear in the "Inbound" section
2. **Assign Conversations**: Click on a conversation and assign it to a team member
3. **Reply**: Select a channel (SMS/WhatsApp/Email) and send your response
4. **Change State**: Mark conversations as Open, Waiting, or Closed

#### Contact Management
1. Navigate to **Contacts** from the sidebar
2. View all contacts with their communication history
3. Add notes to contacts for internal reference
4. Edit contact details as needed

#### Team Collaboration
1. **My Work**: View conversations assigned to you
2. **Notes**: Add internal notes visible only to your team
3. **Search**: Quickly find contacts and conversations

## 📁 Project Structure

```
attackcommunication/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages (login, signup)
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── contacts/     # Contact management
│   │   │   ├── conversations/# Conversation management
│   │   │   ├── messages/     # Message handling
│   │   │   ├── notes/        # Notes management
│   │   │   ├── users/        # User management
│   │   │   └── webhooks/     # Webhook handlers
│   │   ├── dashboard/        # Main dashboard pages
│   │   ├── globals.css       # Global styles
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── inbox/           # Inbox components
│   │   └── settings/        # Settings components
│   ├── lib/
│   │   ├── auth.ts          # Authentication configuration
│   │   ├── auth-client.ts   # Client-side auth utilities
│   │   ├── auth-server.ts   # Server-side auth utilities
│   │   ├── db.ts            # Prisma client
│   │   ├── conversation.ts  # Conversation utilities
│   │   └── integrations/    # Channel integrations
│   │       ├── email.ts
│   │       ├── twilio-sms.ts
│   │       ├── twilio-whatsapp.ts
│   │       └── factory.ts
│   ├── middleware.ts         # Next.js middleware (auth)
│   └── types/               # TypeScript type definitions
├── .env                      # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Authentication & Security

- **Authentication**: Powered by Better Auth with email/password
- **Session Management**: Secure session handling with HTTP-only cookies
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access Control**: Admin, Editor, and Viewer roles
- **Middleware Protection**: Route protection via Next.js middleware
- **Webhook Validation**: Twilio signature validation for webhook security

## 📊 Database Schema

### Core Models
- **User**: User accounts with roles and authentication
- **Contact**: Customer contact information
- **Conversation**: Conversation threads with contacts
- **Message**: Individual messages across all channels
- **Note**: Internal notes on contacts
- **Session**: User session management
- **Account**: OAuth and credential accounts

### Key Relationships
- Contacts have many Messages and Conversations
- Conversations belong to Contacts and can be assigned to Users
- Messages belong to Conversations and Contacts
- Notes link Users to Contacts

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Seed database
npm run seed

# Prisma commands
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev     # Create and apply migrations
npx prisma generate        # Generate Prisma Client
```

### Testing Webhooks Locally

Use ngrok or a similar tool to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL for webhook configuration
# Example: https://abc123.ngrok.io/api/webhooks/twilio
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables for Production

Ensure all environment variables are set in your production environment:
- Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain
- Set `NODE_ENV=production`
- Remove or set `SKIP_TWILIO_VALIDATION=false`
- Configure production database URL

### Post-Deployment

1. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

2. Update webhook URLs in Twilio and email provider to point to your production domain

## 🔍 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database user permissions

**Webhook Not Receiving Messages**
- Verify webhook URL is publicly accessible
- Check Twilio webhook configuration
- Review webhook logs in Twilio console
- Ensure `SKIP_TWILIO_VALIDATION` is set correctly

**Authentication Issues**
- Verify `BETTER_AUTH_SECRET` is set
- Clear browser cookies and try again
- Check `BETTER_AUTH_URL` matches your domain

**Messages Not Sending**
- Verify Twilio credentials are correct
- Check Twilio account balance
- Verify phone numbers are in E.164 format
- Review API error logs

## 📝 API Documentation

### Key Endpoints

#### Authentication
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout

#### Conversations
- `GET /api/conversations` - List conversations (with filters)
- `GET /api/conversations/[id]` - Get conversation details
- `PATCH /api/conversations/[id]` - Update conversation (assign, change state)

#### Messages
- `GET /api/messages?conversationId=xxx` - Get messages for a conversation
- `POST /api/messages/send` - Send a new message

#### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts/[id]` - Get contact details
- `PATCH /api/contacts/[id]` - Update contact

#### Notes
- `POST /api/notes` - Create a note

#### Webhooks
- `POST /api/webhooks/twilio` - Twilio webhook handler
- `POST /api/webhooks/email` - Email webhook handler

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Authentication by [Better Auth](https://www.better-auth.com/)
- SMS/WhatsApp by [Twilio](https://www.twilio.com/)
- Email by [Resend](https://resend.com/)

## 📧 Support

For support, please open an issue in the repository or contact the development team.

---

**Built with ❤️ for better customer communication**