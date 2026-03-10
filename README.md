# The Blues Hotel Collective — Website

> **Your home for everything blues.** A storytelling-driven podcast network dedicated to preserving, celebrating, and reimagining the world of blues music.

Built for Kelvin Huggins — Founder & Creative Director, based in Surry Hills, NSW, Australia.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [Admin Panel](#admin-panel)
9. [Stripe Integration](#stripe-integration)
10. [SMTP Email Setup](#smtp-email-setup)
11. [Push Notifications](#push-notifications)
12. [Two-Factor Authentication](#two-factor-authentication)
13. [API Reference](#api-reference)
14. [Database Schema](#database-schema)
15. [What Was Built](#what-was-built)
16. [Tools & Languages](#tools--languages)

---

## Overview

This is a complete rebuild of [theblueshotel.com.au](https://theblueshotel.com.au) from a WordPress site into a modern, full-stack application. The platform hosts three podcast shows, community features, event listings, and a powerful admin CMS — all wrapped in a dark, atmospheric UI that feels like walking into a blues bar.

### The Three Podcast Shows

| Show | Description |
|------|-------------|
| **The Blues Hotel** | The music, the legends, the stories behind the songs — and the fresh independent blues. |
| **Just Talkin' Blues** | Conversations with the artists — unfiltered, unscripted, and real. Recorded via Riverside.fm. |
| **Blues Moments in Time** | The history — one moment at a time. A daily podcast exploring blues birthdays, anniversaries, and historic performances. |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React** (CRA) | UI framework |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn/UI** | Component library (buttons, inputs, tabs, etc.) |
| **Framer Motion** | Page transitions, scroll animations, hover effects |
| **Recharts** | Data visualization (admin dashboard charts) |
| **Tiptap** | Rich text WYSIWYG editor (CMS page editing) |
| **Axios** | HTTP client for API calls |
| **React Router** | Client-side routing |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** (Python) | REST API framework |
| **MongoDB** (Motor) | Async database driver |
| **JWT** (PyJWT) | Authentication tokens |
| **bcrypt** | Password hashing |
| **Stripe** (emergentintegrations) | Payment processing scaffold |
| **pywebpush** | Web push notifications |
| **smtplib** | SMTP email sending |
| **aiofiles** | Async file handling for uploads |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Database | MongoDB |
| File Storage | Local (uploads directory) |
| Auth | JWT with httpOnly cookies |
| Push | Web Push API + Service Workers |
| Email | SMTP (admin-configurable) |
| Payments | Stripe Checkout (scaffolded) |

---

## Features

### Public-Facing

- **Persistent Podcast Player** — Bottom bar audio player that persists across all page navigations. Play/pause, seek, volume, speed control (0.75x–2x), expand to full overlay, localStorage persistence for resume on refresh
- **Homepage** — Parallax hero, latest episodes, upcoming events, newsletter signup
- **About** — Brand story, founder bio (Kelvin Huggins), animated timeline, three shows overview
- **Podcasts** — Overview of all 3 shows, individual show pages with searchable episode lists
- **Where to Listen** — Grid of streaming platforms (Spotify, Apple Podcasts, Amazon, etc.)
- **Events** — Upcoming/past events with Stripe checkout for ticketing
- **Community** — Submit Music form, Share a Story form
- **Contact** — Contact form with email, phone, location, social links
- **User Registration** — Public accounts for saving liked episodes and managing comments
- **Episode Engagement** — Like and comment on any episode, social sharing buttons (Facebook, X, copy link)
- **Push Notifications** — Browser notifications for new episodes/events
- **Newsletter Signup** — Quarterly Catch-Up subscription
- **Privacy Policy & Terms of Use** — Admin-editable static pages

### Admin CMS (`/admin`)

- **Dashboard** — Stats cards + Recharts (Episodes by Show bar chart, Subscriber Growth line chart)
- **Episode Management** — Full CRUD with audio/image upload, external URL support, draft/publish toggle
- **Event Management** — Full CRUD with image upload, Stripe ticketing, date/time/venue
- **CMS Pages** — Rich text editor (Tiptap) for Privacy Policy, Terms of Use, and other static pages
- **Community Submissions** — View, filter, mark read, delete submissions from all forms
- **Newsletter Subscribers** — View list, export CSV, remove subscribers
- **Activity Log** — Full audit trail of all admin actions with timestamps and IP addresses
- **Settings** — Site information, social media links, SMTP configuration, Demo Mode toggle, 2FA management, push notification sender
- **Account Management** — Change password, change email, change display name

### Security

- **JWT Authentication** — Token-based auth for admin and user accounts
- **Two-Factor Authentication** — Email OTP (6-digit code, 10-minute expiry), opt-in per admin account
- **Password Reset** — Token-based reset via email with 1-hour expiry
- **Activity Logging** — All admin logins and actions recorded

---

## Project Structure

```
/app
├── backend/
│   ├── server.py              # Main FastAPI application (all routes)
│   ├── .env                   # Backend environment variables
│   ├── requirements.txt       # Python dependencies
│   └── uploads/               # Uploaded audio and images
│       ├── audio/
│       └── images/
├── frontend/
│   ├── public/
│   │   └── sw.js              # Service worker for push notifications
│   ├── src/
│   │   ├── App.js             # Routes and app structure
│   │   ├── App.css            # Custom CSS (player, timeline, etc.)
│   │   ├── index.js           # Entry point + service worker registration
│   │   ├── index.css          # Tailwind base + dark theme variables
│   │   ├── lib/
│   │   │   └── api.js         # Axios API client
│   │   ├── contexts/
│   │   │   └── PlayerContext.js   # Podcast player state management
│   │   ├── components/
│   │   │   ├── Layout.js          # Page layout (navbar + footer + player)
│   │   │   ├── Navbar.js          # Sticky navigation with dropdowns
│   │   │   ├── Footer.js          # Three-column footer
│   │   │   ├── PodcastPlayer.js   # Persistent bottom player + expanded overlay
│   │   │   ├── ShareButtons.js    # Social sharing component
│   │   │   ├── TiptapEditor.js    # Rich text editor (WYSIWYG)
│   │   │   ├── PushNotification.js # Push notification opt-in + admin sender
│   │   │   └── ui/               # Shadcn/UI components
│   │   └── pages/
│   │       ├── Home.js            # Homepage
│   │       ├── About.js           # About + founder bio + timeline
│   │       ├── Podcasts.js        # All shows overview
│   │       ├── PodcastShow.js     # Individual show + episodes + engagement
│   │       ├── WhereToListen.js   # Streaming platforms grid
│   │       ├── Events.js          # Events listing + Stripe checkout
│   │       ├── SubmitMusic.js     # Community music submission form
│   │       ├── ShareStory.js      # Community story form
│   │       ├── Contact.js         # Contact form + info
│   │       ├── UserAuth.js        # Login/Register (public users)
│   │       ├── UserProfile.js     # User profile (liked episodes, comments)
│   │       ├── PasswordReset.js   # Password reset flow
│   │       ├── StaticPage.js      # Privacy Policy, Terms of Use
│   │       └── admin/
│   │           ├── AdminLogin.js      # Admin login
│   │           ├── AdminLayout.js     # Admin sidebar layout
│   │           ├── AdminDashboard.js  # Stats + charts
│   │           ├── AdminEpisodes.js   # Episode CRUD
│   │           ├── AdminEvents.js     # Event CRUD
│   │           ├── AdminPages.js      # CMS page editor (Tiptap)
│   │           ├── AdminSubmissions.js # Community submissions viewer
│   │           ├── AdminSubscribers.js # Newsletter management
│   │           ├── AdminActivityLog.js # Activity audit trail
│   │           └── AdminSettings.js    # All settings + account + 2FA + push
│   ├── .env                   # Frontend environment variables
│   ├── package.json           # Node.js dependencies
│   └── tailwind.config.js     # Tailwind configuration
├── memory/
│   └── PRD.md                 # Product Requirements Document
└── README.md                  # This file
```

---

## Installation & Setup

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **Yarn**
- **MongoDB** (local or cloud)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values
```

### 4. Start Services

```bash
# Terminal 1: Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Frontend
cd frontend
yarn start
```

The application seeds default data on first startup: 3 shows, 3 demo episodes, 2 sample events, default admin account, and site settings.

---

## Environment Variables

### Backend (`/backend/.env`)

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=blues_hotel

# Authentication
JWT_SECRET=your-secure-random-secret-key

# CORS
CORS_ORIGINS=*

# Stripe (Payment Processing)
STRIPE_API_KEY=sk_test_your_stripe_secret_key

# Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_CLAIMS_EMAIL=admin@theblueshotel.com.au
```

### Frontend (`/frontend/.env`)

```env
# Backend API URL
REACT_APP_BACKEND_URL=https://your-domain.com

# Push Notifications
REACT_APP_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### Generating VAPID Keys

```bash
python3 -c "
from pywebpush import webpush
from py_vapid import Vapid
v = Vapid()
v.generate_keys()
import base64
pk = v.public_key
pub_numbers = pk.public_numbers()
pub = base64.urlsafe_b64encode(b'\x04' + pub_numbers.x.to_bytes(32, 'big') + pub_numbers.y.to_bytes(32, 'big')).decode().rstrip('=')
priv_numbers = v.private_key.private_numbers()
priv = base64.urlsafe_b64encode(priv_numbers.private_value.to_bytes(32, 'big')).decode().rstrip('=')
print(f'VAPID_PUBLIC_KEY={pub}')
print(f'VAPID_PRIVATE_KEY={priv}')
"
```

---

## Running the Application

After setup, access:

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Frontend (public website) |
| `http://localhost:3000/admin/login` | Admin panel login |
| `http://localhost:8001/docs` | FastAPI Swagger documentation |

### Default Admin Login

| Field | Value |
|-------|-------|
| Email | `admin@theblueshotel.com.au` |
| Password | `password` |

**Change this password immediately in Settings > Account Management.**

---

## Admin Panel

### Dashboard
- At-a-glance stats: total episodes, events, subscribers, unread messages
- **Episodes by Show** bar chart (Recharts)
- **Subscriber Growth** line chart (Recharts)
- Recent episodes and submissions

### Managing Episodes
1. Go to **Episodes** > **New Episode**
2. Select the show (The Blues Hotel / Just Talkin' Blues / Blues Moments in Time)
3. Enter title, description
4. Either **upload an audio file** (MP3/WAV/M4A) or enter an **external audio URL** (e.g., from Captivate.fm, Buzzsprout)
5. Optionally upload cover art or let it inherit from the show
6. Add YouTube/Spotify embed URLs, tags
7. Toggle Published/Draft
8. Save

### Managing Events
1. Go to **Events** > **New Event**
2. Enter title, date, time, venue, address, city
3. Set ticket price (for Stripe checkout) or external ticket URL
4. Upload cover image
5. Save

### CMS Pages (Rich Text Editor)
1. Go to **Pages**
2. Click edit on Privacy Policy or Terms of Use
3. Use the **Tiptap WYSIWYG editor** — bold, italic, underline, headings, lists, blockquotes, links, images, alignment
4. Save

### Sending Push Notifications
1. Go to **Settings** > **Notifications**
2. Enter notification title and body
3. Optionally add a link URL
4. Click **Send Notification** — pushes to all subscribed browsers

### Account Management
Under **Settings** > **Account Management**:
- **Change Display Name** — update your admin name
- **Change Email** — requires current password confirmation, issues new JWT token
- **Change Password** — requires current password, minimum 6 characters

---

## Stripe Integration

Stripe is scaffolded for event ticketing using the `emergentintegrations` library.

### How It Works
1. Admin creates an event with a `ticket_price` (e.g., $25.00 AUD)
2. Public users see a "Get Tickets" button on the event
3. Clicking it creates a Stripe Checkout session via `POST /api/payments/checkout`
4. User is redirected to Stripe's hosted checkout page
5. After payment, user is redirected back with a session ID

### Setting Up Stripe

1. **Get your Stripe API keys** from [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Add your **Secret Key** to `backend/.env`:
   ```env
   STRIPE_API_KEY=sk_test_your_key_here
   ```
3. For production, switch to a live key (`sk_live_...`)
4. Stripe webhook handling is built in at `POST /api/webhook/stripe`

### Testing Stripe
Use test card `4242 4242 4242 4242` with any future expiry and CVC.

---

## SMTP Email Setup

All emails are sent via SMTP configured in the Admin Settings panel. No email service is hardcoded.

### Configuring SMTP
1. Go to **Admin > Settings > SMTP Email Configuration**
2. Enter:
   - **SMTP Host**: e.g., `smtp.gmail.com`
   - **SMTP Port**: e.g., `587`
   - **SMTP Username**: your email
   - **SMTP Password**: your app password
   - **From Name**: `The Blues Hotel`
   - **From Email**: `noreply@theblueshotel.com.au`
   - **TLS/SSL**: Enable
3. Click **Send Test Email** to verify

### Gmail Setup
1. Enable 2-Step Verification on your Google account
2. Generate an **App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the 16-character app password as `SMTP Password`

### Emails Sent By The System

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Contact form submitted | Admin | Name, email, subject, message |
| Submit Music form | Admin | Artist name, email, message, file link |
| Share a Story form | Admin | Name, email, story |
| New newsletter subscriber | Admin | Subscriber name + email |
| Password reset requested | User | Reset token (1-hour expiry) |
| 2FA login code | Admin | 6-digit OTP (10-minute expiry) |
| 2FA enable verification | Admin | 6-digit OTP |

---

## Push Notifications

Web push notifications let you alert subscribers about new episodes and events.

### How Users Subscribe
1. User clicks the **bell icon** ("Get Notified") in the navbar
2. Browser asks for notification permission
3. Subscription is registered with the backend

### Sending from Admin
1. Go to **Settings > Notifications**
2. Enter title, body, optional link
3. Click **Send Notification**

### Technical Details
- Uses the **Web Push API** with **VAPID** authentication
- Service worker at `/public/sw.js` handles push events
- Subscriptions stored in MongoDB `push_subscriptions` collection
- Failed subscriptions are automatically cleaned up

---

## Two-Factor Authentication

2FA adds email-based OTP verification to admin login.

### Enabling 2FA
1. Go to **Settings > Two-Factor Authentication**
2. Click **Enable 2FA**
3. Receive a 6-digit code via email (or displayed on screen if SMTP not configured)
4. Enter the code to confirm

### Login with 2FA
When 2FA is enabled:
1. Enter email and password normally
2. System sends a 6-digit code to your email
3. Enter the code on the verification screen
4. Code expires after 10 minutes

### Disabling 2FA
Go to **Settings > Two-Factor Authentication** > **Disable 2FA**

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Admin login (returns JWT, handles 2FA) |
| GET | `/api/auth/me` | Admin | Get current admin info |
| PUT | `/api/auth/change-password` | Admin | Change admin password |
| PUT | `/api/auth/change-email` | Admin | Change admin email |
| PUT | `/api/auth/change-name` | Admin | Change admin display name |
| POST | `/api/auth/password-reset-request` | No | Request password reset token |
| POST | `/api/auth/password-reset` | No | Reset password with token |
| POST | `/api/auth/2fa/enable` | Admin | Initiate 2FA (sends OTP) |
| POST | `/api/auth/2fa/verify` | Admin | Verify OTP to enable 2FA |
| POST | `/api/auth/2fa/disable` | Admin | Disable 2FA |
| POST | `/api/auth/2fa/login-verify` | Token | Verify 2FA during login |

### Public Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/register` | No | Register public user account |
| POST | `/api/users/login` | No | Login public user |
| GET | `/api/users/me` | User | Get profile + liked episodes + comments |
| PUT | `/api/users/me` | User | Update profile name |

### Shows
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/shows` | No | List all shows |
| GET | `/api/shows/{slug}` | No | Get show by slug |

### Episodes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/episodes` | No | List episodes (filter by show, search) |
| GET | `/api/episodes/{id}` | No | Get single episode |
| POST | `/api/episodes` | Admin | Create episode |
| PUT | `/api/episodes/{id}` | Admin | Update episode |
| DELETE | `/api/episodes/{id}` | Admin | Delete episode |
| POST | `/api/episodes/{id}/like` | No | Like an episode (email-based) |
| DELETE | `/api/episodes/{id}/like` | No | Unlike an episode |
| GET | `/api/episodes/{id}/engagement` | No | Get likes count + comments |
| POST | `/api/episodes/{id}/comments` | No | Post a comment |
| DELETE | `/api/episodes/{id}/comments/{cid}` | Admin | Delete a comment |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | No | List events |
| GET | `/api/events/{id}` | No | Get single event |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/{id}` | Admin | Update event |
| DELETE | `/api/events/{id}` | Admin | Delete event |

### Pages
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pages/{slug}` | No | Get page content |
| PUT | `/api/pages/{slug}` | Admin | Update page content |

### Community & Contact
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/community/submit-music` | No | Submit music form |
| POST | `/api/community/share-story` | No | Share a story form |
| POST | `/api/contact` | No | Contact form |
| GET | `/api/submissions` | Admin | List all submissions |
| PUT | `/api/submissions/{id}/read` | Admin | Mark as read |
| DELETE | `/api/submissions/{id}` | Admin | Delete submission |

### Newsletter
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/newsletter/subscribe` | No | Subscribe to newsletter |
| GET | `/api/newsletter/subscribers` | Admin | List all subscribers |
| DELETE | `/api/newsletter/subscribers/{id}` | Admin | Remove subscriber |
| GET | `/api/newsletter/export-csv` | Admin | Export subscribers as CSV |

### Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Admin | Get all settings |
| PUT | `/api/settings` | Admin | Update settings |
| GET | `/api/settings/public` | No | Get public settings |
| POST | `/api/settings/test-email` | Admin | Send test email |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard` | Admin | Dashboard stats + chart data |
| GET | `/api/admin/activity-log` | Admin | Activity audit trail |
| GET | `/api/admin/pages` | Admin | List all CMS pages |

### Push Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/push/vapid-key` | No | Get VAPID public key |
| POST | `/api/push/subscribe` | No | Subscribe to push |
| POST | `/api/push/send` | Admin | Send push notification |
| GET | `/api/push/subscribers-count` | Admin | Get subscriber count |

### Payments (Stripe)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/checkout` | No | Create Stripe checkout session |
| GET | `/api/payments/status/{session_id}` | No | Check payment status |
| POST | `/api/webhook/stripe` | No | Stripe webhook handler |

### File Uploads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/audio` | Admin | Upload audio file (MP3/WAV/M4A/OGG) |
| POST | `/api/upload/image` | Admin | Upload image (JPG/PNG/WebP/GIF) |

---

## Database Schema

### Collections (MongoDB)

| Collection | Description |
|-----------|-------------|
| `users` | Admin and public user accounts |
| `shows` | The 3 podcast shows |
| `episodes` | Podcast episodes (linked to shows) |
| `events` | Events with ticketing |
| `pages` | CMS-editable static pages |
| `submissions` | Contact/music/story form submissions |
| `newsletter` | Newsletter subscribers |
| `site_settings` | Key-value configuration store |
| `activity_log` | Admin audit trail |
| `episode_likes` | Episode likes (email-based) |
| `episode_comments` | Episode comments |
| `push_subscriptions` | Web push subscriptions |
| `otp_codes` | 2FA OTP codes |
| `password_resets` | Password reset tokens |
| `payment_transactions` | Stripe payment records |

---

## What Was Built

### Phase 1: MVP
- All 9 public pages with scroll animations and blues bar aesthetic
- Persistent podcast player (bottom bar + expanded overlay + localStorage persistence)
- Admin CMS with episode/event CRUD, submissions viewer, subscriber management
- JWT authentication, file uploads, 30+ API endpoints
- Seed data: 3 shows, 3 demo episodes (with real Captivate.fm audio), 2 events

### Phase 2: Full Features
- Account management: change password, email, display name
- Data visualization: Recharts bar chart + line chart on dashboard
- Activity log viewer
- CMS pages with raw HTML editing
- Episode likes, comments, social sharing

### Phase 3: Advanced Features
- **User registration** — public accounts with profile page showing liked episodes and comments
- **Password reset** — full UI flow with email token
- **Two-Factor Authentication** — email OTP with enable/disable in admin settings
- **Push notifications** — Web Push API with service worker, admin sender panel
- **Rich text editor** — Tiptap WYSIWYG replacing raw HTML for page editing
- **Comprehensive documentation** — this README

---

## Tools & Languages

| Category | Tools |
|----------|-------|
| **Languages** | Python 3.10+, JavaScript (ES6+), HTML5, CSS3 |
| **Frontend Framework** | React 18 (Create React App) |
| **CSS Framework** | Tailwind CSS 3 |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Rich Text Editor** | Tiptap (with extensions: StarterKit, Link, Underline, TextAlign, Placeholder, Image) |
| **Component Library** | Shadcn/UI |
| **Backend Framework** | FastAPI |
| **Database** | MongoDB with Motor (async driver) |
| **Authentication** | JWT (PyJWT) + bcrypt |
| **Payments** | Stripe (via emergentintegrations) |
| **Email** | Python smtplib (SMTP) |
| **Push Notifications** | pywebpush + Web Push API + Service Workers |
| **HTTP Client** | Axios |
| **File Uploads** | aiofiles + FastAPI UploadFile |
| **Icons** | Lucide React |
| **Fonts** | Playfair Display (headings), Manrope (body), JetBrains Mono (code) |

---

## Contact

- **Website**: [theblueshotel.com.au](https://theblueshotel.com.au)
- **Email**: admin@theblueshotel.com.au
- **Phone**: 0482 170 801
- **Location**: Surry Hills, NSW, Australia

### Social Media
- [Facebook](https://facebook.com/theblueshotel/)
- [Instagram](https://instagram.com/theblueshotel/)
- [YouTube](https://youtube.com/@theblueshotel)
- [Bluesky](https://bsky.app/profile/theblueshotel.com.au)
- [LinkedIn](https://www.linkedin.com/in/the-blues-hotel-collective)

---

*Built with care for the blues community. Listen. Learn. Feel the blues.*
