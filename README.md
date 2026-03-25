# 💪 Gravity Fitness - Gym Management System

A complete gym management system with WhatsApp bot integration for automated member communication, birthday wishes, fee reminders, and more.

![Gravity Fitness Logo](public/gravity-fitness-logo.svg)

---

## 🌟 Features

### 📊 Dashboard & Analytics
- Real-time member statistics
- Revenue tracking with visual charts
- Payment history
- Expense management
- Member attendance tracking

### 👥 Member Management
- Add/edit/delete members
- Profile photos
- Membership plans (Monthly, Quarterly, Annual)
- Automatic fee due date calculation
- Member status tracking (Active, Due, Inactive)
- Birthday tracking

### 💬 WhatsApp Integration
- **Automated Welcome Messages** - New members receive welcome message with gym details
- **Birthday Wishes** - Automatic birthday messages at midnight
- **Good Morning Messages** - Daily motivation quotes at 5:00 AM
- **Fee Reminders** - Automatic reminders 3 days before due date
- **Absence Nudges** - Remind inactive members to return
- **Auto-Replies** - Bot responds to common queries (plans, info, status)
- **Chat Interface** - View and reply to all WhatsApp conversations from dashboard

### ⚙️ Settings & Configuration
- Dynamic pricing (updates across all systems automatically)
- Gym information (name, address, hours, contact)
- Enable/disable automations
- Customize messages
- No code changes needed - everything updates from database

### 🎨 Modern UI
- Light/Dark mode support
- Responsive design
- Clean, professional interface
- Accessible components

---

## 🚀 Quick Deploy to Render

### Prerequisites
- GitHub account
- Render.com account (free tier available)
- WhatsApp Business number

### Deploy in 3 Steps

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/gym-pro-whatsapp.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to https://render.com
   - Click "New +" → "Blueprint"
   - Select your repository
   - Click "Apply"

3. **Initialize Database**
   - Open web service shell in Render
   - Run: `npx prisma db push`
   - Add gym config (see `DEPLOY_NOW.md`)

**Full Instructions:** See `DEPLOY_NOW.md` for step-by-step commands

**Detailed Guide:** See `DEPLOYMENT_GUIDE.md` for comprehensive documentation

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- WhatsApp account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gym-pro-whatsapp.git
   cd gym-pro-whatsapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   npx prisma db push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Run WhatsApp bot** (in separate terminal)
   ```bash
   npm run bot
   ```

6. **Open browser**
   - Navigate to http://localhost:3000
   - Scan QR code in bot terminal with WhatsApp

---

## 📁 Project Structure

```
gym-pro-whatsapp/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Dashboard
│   │   ├── members/           # Member management
│   │   ├── whatsapp/          # WhatsApp chat interface
│   │   ├── analytics/         # Analytics page
│   │   ├── settings/          # Settings page
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── lib/                   # Utility functions
│   │   ├── birthdayService.ts
│   │   ├── goodMorningService.ts
│   │   ├── welcomeMessageService.ts
│   │   └── motivationalQuotes.ts
│   └── whatsapp-bot.ts        # WhatsApp bot main file
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── render.yaml                # Render deployment config
├── DEPLOY_NOW.md             # Quick deployment commands
├── DEPLOYMENT_GUIDE.md       # Comprehensive deployment guide
└── QUICK_START_DEPLOYMENT.md # Step-by-step deployment
```

---

## 🤖 WhatsApp Bot Commands

Members can send these messages to the gym's WhatsApp:

- **"Hi"** or **"Hello"** - Get welcome message
- **"Plans"** or **"Pricing"** - View membership plans
- **"Info"** - Get gym address, hours, contact
- **"Status"** - Check membership status and renewal date

---

## 🔄 Automated Features

### Daily at Midnight (12:00 AM)
- ✅ Birthday wishes to members
- ✅ Fee reminders (3 days before due date)
- ✅ Absence nudges (after 5 days of inactivity)

### Daily at 5:00 AM
- ✅ Good morning messages with motivation quotes

### Real-time
- ✅ Welcome messages when new member added
- ✅ Auto-replies to WhatsApp queries
- ✅ Chat synchronization

---

## 🎯 Dynamic Pricing

All pricing is fetched from database dynamically:
- ✅ Website shows current prices
- ✅ WhatsApp bot shows current prices
- ✅ Welcome messages use current prices
- ✅ **No bot restart needed** when prices change

Update prices in Settings page and everything updates automatically!

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (production), SQLite (development)
- **ORM:** Prisma
- **WhatsApp:** whatsapp-web.js
- **Automation:** node-cron
- **Deployment:** Render.com

---

## 📊 Database Schema

- **Member** - Member information, plans, status
- **Payment** - Payment history
- **Expense** - Expense tracking
- **Attendance** - Member attendance logs
- **GymConfig** - Gym settings and pricing
- **Chat** - WhatsApp conversations
- **ChatMessage** - Individual messages
- **BotCommand** - Command queue for bot
- **BotStatus** - Bot connection status
- **BotMessageLog** - Message history

---

## 🔒 Security

- Environment variables for sensitive data
- `.gitignore` excludes session data and credentials
- PostgreSQL with SSL in production
- WhatsApp session data not committed to Git

---

## 📈 Scaling

### Free Tier (Current)
- Web service: 750 hours/month
- Worker service: 750 hours/month
- Database: 1GB storage
- Perfect for gyms with 50-100 members

### Upgrade Options
- **Starter ($7/month):** No sleep, faster performance
- **Standard ($25/month):** More resources, priority support

---

## 🐛 Troubleshooting

### Bot Not Connecting
- Check worker logs for QR code
- Ensure worker service is running
- Scan QR within 60 seconds
- Disconnect WhatsApp Web from other devices

### Messages Not Sending
- Verify bot shows "ONLINE" in logs
- Check member phone numbers are correct
- Ensure numbers include country code (91 for India)

### Database Errors
- Run `npx prisma db push` to sync schema
- Check DATABASE_URL environment variable
- Verify database service is running

---

## 📝 License

This project is private and proprietary to Gravity Fitness Gym.

---

## 👨‍💻 Development

### Run Both Services
```bash
npm run dev:all
```

### Run Separately
```bash
# Terminal 1 - Web app
npm run dev

# Terminal 2 - WhatsApp bot
npm run bot
```

### Database Commands
```bash
# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

---

## 📞 Support

For issues or questions:
1. Check `DEPLOYMENT_GUIDE.md`
2. Review Render logs
3. Check WhatsApp bot logs
4. Verify database connection

---

## 🎉 Credits

Built with ❤️ for Gravity Fitness Unisex Gym

**Gym Details:**
- Address: Gravity Fitness Gym, Rajbala Enclave
- Hours: Morning 5-10 AM, Evening 4-10 PM
- Contact: 9084306122

---

**Last Updated:** March 25, 2026
