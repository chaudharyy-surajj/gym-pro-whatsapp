# 🚀 Deployment Guide - Render.com

Complete guide to deploy Gravity Fitness Gym Management System to Render.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Render.com account (free tier available)
- ✅ All code committed to Git
- ✅ Repository pushed to GitHub

---

## 🎯 What Will Be Deployed

### 1. Web Application (Next.js)
- **Service Type:** Web Service
- **Port:** 3000
- **Plan:** Free
- **Features:**
  - Dashboard
  - Members management
  - WhatsApp chat interface
  - Analytics
  - Settings

### 2. WhatsApp Bot (Background Worker)
- **Service Type:** Worker
- **Plan:** Free
- **Features:**
  - Auto-replies to messages
  - Birthday wishes (daily at midnight)
  - Good morning messages (daily at 5 AM)
  - Fee reminders
  - Absence nudges

### 3. PostgreSQL Database
- **Service Type:** PostgreSQL
- **Plan:** Free (1GB storage)
- **Features:**
  - Members data
  - Payments & expenses
  - WhatsApp chats & messages
  - Gym configuration

---

## 📝 Step 1: Prepare Your Code for Git

### 1.1 Check Git Status

```bash
git status
```

### 1.2 Add All Files

```bash
git add .
```

### 1.3 Commit Changes

```bash
git commit -m "Prepare for Render deployment - Add render.yaml, update Prisma for PostgreSQL"
```

### 1.4 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `gym-pro-whatsapp`
3. Description: "Gym Management System with WhatsApp Bot"
4. Visibility: Private (recommended) or Public
5. Click "Create repository"

### 1.5 Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/gym-pro-whatsapp.git

# Push code
git branch -M main
git push -u origin main
```

---

## 🚀 Step 2: Deploy to Render

### 2.1 Sign Up / Log In to Render

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### 2.2 Create New Blueprint

1. Click "New +" button
2. Select "Blueprint"
3. Connect your GitHub repository: `gym-pro-whatsapp`
4. Render will detect `render.yaml` automatically
5. Click "Apply"

### 2.3 What Render Will Create

Render will automatically create:
- ✅ PostgreSQL database (`gym-pro-db`)
- ✅ Web service (`gym-pro-web`)
- ✅ Worker service (`gym-pro-whatsapp-bot`)

All services will be linked automatically!

---

## 🔧 Step 3: Configure Services

### 3.1 Database Setup

The database is created automatically. Render will:
- ✅ Create PostgreSQL database
- ✅ Generate connection string
- ✅ Link to web and worker services

**No manual configuration needed!**

### 3.2 Web Service Configuration

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
- `NODE_ENV`: production
- `DATABASE_URL`: (auto-linked from database)

### 3.3 Worker Service Configuration

**Build Command:**
```bash
npm install && npx prisma generate
```

**Start Command:**
```bash
npm run bot
```

**Environment Variables:**
- `NODE_ENV`: production
- `DATABASE_URL`: (auto-linked from database)

---

## 📊 Step 4: Initialize Database

### 4.1 Run Migrations

After deployment, you need to create database tables:

1. Go to your web service in Render dashboard
2. Click "Shell" tab
3. Run:

```bash
npx prisma db push
```

This creates all tables in PostgreSQL.

### 4.2 Seed Initial Data (Optional)

Create initial gym configuration:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.gymConfig.create({
  data: {
    id: 1,
    name: 'Gravity Fitness Unisex Gym',
    location: 'Gravity Fitness Gym, Rajbala Enclave',
    hours: 'Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM',
    contact: '9084306122',
    monthlyPrice: 1500,
    quarterlyPrice: 4000,
    annualPrice: 10000
  }
}).then(() => prisma.\$disconnect());
"
```

---

## 📱 Step 5: Connect WhatsApp Bot

### 5.1 Access Bot Logs

1. Go to Render dashboard
2. Click on `gym-pro-whatsapp-bot` worker
3. Click "Logs" tab

### 5.2 Get QR Code

The bot will generate a QR code in the logs. Look for:

```
--- SCAN THE QR CODE BELOW TO CONNECT YOUR WHATSAPP ---
```

### 5.3 Scan QR Code

1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Click "Link a Device"
4. Scan the QR code from Render logs

### 5.4 Verify Connection

After scanning, you should see in logs:
```
✅ GymPro WhatsApp Bot is ONLINE!
```

---

## 🌐 Step 6: Access Your Application

### 6.1 Get Web URL

1. Go to Render dashboard
2. Click on `gym-pro-web` service
3. Copy the URL (e.g., `https://gym-pro-web.onrender.com`)

### 6.2 Test Application

Visit your URL and test:
- ✅ Dashboard loads
- ✅ Can add members
- ✅ Settings page works
- ✅ WhatsApp chat interface shows

### 6.3 Test WhatsApp Bot

Send a message to your gym's WhatsApp:
- "Hi" → Should get welcome message
- "Plans" → Should show pricing
- "Info" → Should show gym details

---

## ⚙️ Step 7: Configure Custom Domain (Optional)

### 7.1 Add Custom Domain

1. Go to your web service settings
2. Click "Custom Domain"
3. Add your domain (e.g., `gym.yourdomain.com`)
4. Follow DNS configuration instructions

### 7.2 Update DNS

Add CNAME record:
```
Type: CNAME
Name: gym
Value: gym-pro-web.onrender.com
```

---

## 🔄 Step 8: Continuous Deployment

### 8.1 Auto-Deploy on Git Push

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main
```

Render will:
1. Detect the push
2. Build the application
3. Deploy automatically
4. Restart services

### 8.2 Manual Deploy

You can also trigger manual deploys:
1. Go to service in Render dashboard
2. Click "Manual Deploy"
3. Select "Deploy latest commit"

---

## 📊 Monitoring & Logs

### View Logs

**Web Service Logs:**
1. Go to `gym-pro-web` service
2. Click "Logs" tab
3. See real-time application logs

**Bot Worker Logs:**
1. Go to `gym-pro-whatsapp-bot` service
2. Click "Logs" tab
3. See bot activity, messages sent, errors

**Database Logs:**
1. Go to `gym-pro-db` database
2. Click "Logs" tab
3. See connection logs, queries

### Metrics

Render provides:
- CPU usage
- Memory usage
- Request count
- Response times

---

## 🐛 Troubleshooting

### Issue: Build Failed

**Solution:**
1. Check build logs for errors
2. Ensure `package.json` has all dependencies
3. Verify `render.yaml` configuration

### Issue: Database Connection Error

**Solution:**
1. Check `DATABASE_URL` environment variable
2. Ensure database is running
3. Run `npx prisma db push` to create tables

### Issue: WhatsApp Bot Not Connecting

**Solution:**
1. Check worker logs for QR code
2. Ensure worker service is running
3. Scan QR code within 60 seconds
4. Check if WhatsApp Web is already connected elsewhere

### Issue: Application Slow

**Solution:**
1. Free tier has limited resources
2. Consider upgrading to paid plan
3. Optimize database queries
4. Enable caching

---

## 💰 Pricing

### Free Tier Limits

**Web Service:**
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- Wakes up on request (may take 30-60 seconds)

**Worker Service:**
- 750 hours/month
- Runs continuously (doesn't sleep)

**Database:**
- 1GB storage
- 90 days retention
- Automatic backups

### Upgrade Options

**Starter Plan ($7/month per service):**
- No sleep
- Faster performance
- More resources

**Standard Plan ($25/month per service):**
- Even more resources
- Priority support
- Advanced features

---

## 🔒 Security Best Practices

### 1. Environment Variables

Never commit sensitive data:
- ✅ Use environment variables
- ✅ Add `.env` to `.gitignore`
- ✅ Use Render's environment variable management

### 2. Database Security

- ✅ Use strong passwords
- ✅ Enable SSL connections
- ✅ Regular backups

### 3. WhatsApp Security

- ✅ Keep QR code private
- ✅ Don't share session data
- ✅ Monitor bot activity

---

## 📝 Maintenance

### Regular Tasks

**Daily:**
- Check bot logs for errors
- Monitor message delivery

**Weekly:**
- Review database size
- Check application performance
- Update dependencies if needed

**Monthly:**
- Review Render usage
- Backup database
- Update pricing if needed

### Updates

To update your application:

```bash
# Pull latest changes
git pull origin main

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Update description"
git push origin main
```

Render will auto-deploy!

---

## 🎯 Post-Deployment Checklist

- [ ] Web application accessible
- [ ] Database tables created
- [ ] WhatsApp bot connected
- [ ] Test member creation
- [ ] Test WhatsApp messages
- [ ] Configure gym settings
- [ ] Add initial members
- [ ] Test birthday wishes
- [ ] Test good morning messages
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring alerts

---

## 📞 Support

### Render Support

- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Application Issues

Check logs in Render dashboard for:
- Build errors
- Runtime errors
- Database connection issues
- Bot connection problems

---

## 🎉 Success!

Your Gravity Fitness Gym Management System is now live on Render!

**Web Application:** `https://gym-pro-web.onrender.com`
**WhatsApp Bot:** Running 24/7 as background worker
**Database:** PostgreSQL with automatic backups

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [WhatsApp Web.js](https://wwebjs.dev/)

---

**Deployed:** Ready for production use!
**Maintained by:** Your team
**Last Updated:** March 25, 2026
