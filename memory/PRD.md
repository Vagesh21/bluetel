# The Blues Hotel Collective - PRD

## Original Problem Statement
Rebuild The Blues Hotel Collective website (theblueshotel.com.au) from scratch — a blues music storytelling brand based in Surry Hills, Australia, founded by Kelvin Huggins. Replace WordPress with a modern stack: React CRA + FastAPI + MongoDB. Features include a persistent podcast player, full admin CMS, SMTP email, Stripe scaffold, and immersive dark blues bar UI.

## Architecture
- **Frontend**: React CRA + Tailwind CSS + Framer Motion + Shadcn/UI
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT-based admin authentication
- **Payments**: Stripe scaffold (emergentintegrations library)
- **Email**: SMTP (admin-configurable via settings)

## User Personas
1. **Blues Fan** - Browses podcasts, listens to episodes, subscribes to newsletter
2. **Artist/Musician** - Submits music, shares stories, attends events
3. **Admin (Kelvin Huggins)** - Manages all content, episodes, events, settings

## Core Requirements
- Persistent PiP podcast player across all pages
- 3 podcast shows with episode management
- Events listing with Stripe ticketing scaffold
- Community forms (Submit Music, Share a Story)
- Newsletter signup with subscriber management
- Admin CMS with full CRUD for all content types
- Dark, atmospheric blues bar aesthetic
- Mobile-first responsive design

## What's Been Implemented (March 2026)
### Public Pages
- Home (hero, about snippet, latest episodes, events teaser, newsletter)
- About (brand story, founder bio, timeline animation, shows overview)
- Podcasts (overview + individual show pages with episode lists)
- Where to Listen (streaming platform grid)
- Events (upcoming/past with Stripe checkout scaffold)
- Community: Submit Music, Share a Story
- Contact (form + info + social links)

### Admin CMS (/admin)
- Login with JWT auth
- Dashboard with stats
- Episode CRUD with audio/image upload
- Event CRUD with image upload
- Submissions viewer (contact, music, stories)
- Newsletter subscriber management with CSV export
- Settings (site info, social links, SMTP, demo mode)

### Backend API (30+ endpoints)
- Auth, Shows, Episodes, Events, Pages, Community, Newsletter, Settings, Uploads, Payments

### Key Features
- Persistent bottom podcast player with play/pause, seek, volume, speed, expand overlay
- localStorage persistence for player state
- Framer Motion scroll animations throughout
- Real content from existing website
- Seed data: 3 shows, 3 demo episodes with Captivate.fm audio, 2 sample events

## Prioritized Backlog
### P0 (Next)
- Comments & likes on episodes
- User registration (optional public accounts)
- Push notifications (web-push)
- 2FA via email OTP
- Password reset flow

### P1
- Data visualization in admin dashboard (charts)
- Activity log viewer in admin
- Rich text editor for pages
- Episode drag-and-drop reorder
- Social sharing buttons on episodes/events

### P2
- Full Stripe checkout flow with payment status polling
- SEO meta tags and JSON-LD structured data
- Admin reply to submissions via email
- PiP detachable floating player (browser PiP API)
- Privacy Policy / Terms of Use static page routing

## Next Tasks
1. Add user registration and episode comments/likes
2. Implement data visualization charts in admin dashboard
3. Add push notification support
4. Complete 2FA and password reset flows
5. Add social sharing buttons
