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

### Phase 1 - MVP (Complete)
- Home (hero, about snippet, latest episodes, events teaser, newsletter)
- About (brand story, founder bio, timeline animation, shows overview)
- Podcasts (overview + individual show pages with episode lists)
- Where to Listen (streaming platform grid)
- Events (upcoming/past with Stripe checkout scaffold)
- Community: Submit Music, Share a Story
- Contact (form + info + social links)
- Admin CMS: Login, Dashboard, Episode CRUD, Event CRUD, Submissions, Subscribers, Settings
- Persistent podcast player with localStorage persistence
- 30+ Backend API endpoints, JWT auth, file uploads

### Phase 2 - Full Features (Complete)
- **Account Management**: Change password, change email, change display name — all in Admin Settings
- **Data Visualization**: Recharts bar chart (Episodes by Show) + line chart (Subscriber Growth) on Dashboard
- **Activity Log**: Full admin activity log viewer at /admin/activity-log
- **CMS Pages Editor**: Edit Privacy Policy and Terms of Use from admin panel at /admin/pages
- **Episode Engagement**: Likes and comments on every episode (public-facing, email-based)
- **Social Sharing**: Facebook, X/Twitter, copy link buttons on all episodes
- **Static Pages**: Public routing for /privacy-policy and /terms-of-use
- **Password Reset**: Backend endpoints for token-based password reset via email

## Prioritized Backlog
### P0 (Next)
- User registration (optional public accounts for managing likes/comments)
- Push notifications (web-push for new episodes/events)
- 2FA via email OTP (scaffold exists, needs SMTP configured)
- Password reset UI page (backend ready)

### P1
- Episode drag-and-drop reorder in admin
- Rich text editor (Tiptap/Quill) for pages instead of raw HTML
- Admin reply to submissions via email
- PiP detachable floating player (browser PiP API)
- SEO meta tags and JSON-LD structured data

### P2
- Full Stripe checkout flow with payment status polling
- "Blues of the Day" daily highlight feature
- Episode play count tracking
- Comment moderation in admin panel

## Next Tasks
1. Add user registration and episode comments/likes
2. Implement data visualization charts in admin dashboard
3. Add push notification support
4. Complete 2FA and password reset flows
5. Add social sharing buttons
