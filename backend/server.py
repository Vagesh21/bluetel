from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import uuid
import bcrypt
import jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'blues-hotel-default-secret')
JWT_ALGORITHM = "HS256"
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "audio").mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Auth Helpers ──
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {"user_id": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def log_activity(user_id: str, action: str, ip: str = "unknown"):
    await db.activity_log.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "action": action,
        "ip_address": ip, "timestamp": datetime.now(timezone.utc).isoformat()
    })

# ── Pydantic Models ──
class LoginRequest(BaseModel):
    email: str
    password: str

class EpisodeCreate(BaseModel):
    show_slug: str
    title: str
    description: str = ""
    audio_url: Optional[str] = None
    external_audio_url: Optional[str] = None
    cover_art_url: Optional[str] = None
    youtube_url: Optional[str] = None
    spotify_url: Optional[str] = None
    tags: List[str] = []
    duration_seconds: int = 0
    published: bool = True

class EpisodeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    show_slug: Optional[str] = None
    audio_url: Optional[str] = None
    external_audio_url: Optional[str] = None
    cover_art_url: Optional[str] = None
    youtube_url: Optional[str] = None
    spotify_url: Optional[str] = None
    tags: Optional[List[str]] = None
    duration_seconds: Optional[int] = None
    published: Optional[bool] = None
    order_index: Optional[int] = None

class EventCreate(BaseModel):
    title: str
    description: str = ""
    date: str
    time: str = ""
    venue: str = ""
    address: str = ""
    city: str = ""
    ticket_url: Optional[str] = None
    ticket_price: Optional[float] = None
    cover_image_url: Optional[str] = None
    published: bool = True

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    ticket_url: Optional[str] = None
    ticket_price: Optional[float] = None
    cover_image_url: Optional[str] = None
    published: Optional[bool] = None

class PageUpdate(BaseModel):
    content_html: str
    title: Optional[str] = None

class SubscribeRequest(BaseModel):
    first_name: str
    last_name: str
    email: str

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str = ""
    message: str

class SubmitMusicRequest(BaseModel):
    name: str
    artist_name: str = ""
    email: str
    message: str = ""
    file_url: Optional[str] = None

class ShareStoryRequest(BaseModel):
    name: str
    email: str
    message: str

class SettingsUpdate(BaseModel):
    settings: Dict[str, str]

class CheckoutRequest(BaseModel):
    event_id: str
    origin_url: str

# ── SMTP Helper ──
async def send_email(to_email: str, subject: str, html_body: str):
    settings = {}
    async for s in db.site_settings.find({}, {"_id": 0}):
        settings[s["key"]] = s["value"]
    smtp_host = settings.get("smtp_host", "")
    smtp_port = int(settings.get("smtp_port", "587"))
    smtp_user = settings.get("smtp_username", "")
    smtp_pass = settings.get("smtp_password", "")
    from_email = settings.get("smtp_from_email", "noreply@theblueshotel.com.au")
    from_name = settings.get("smtp_from_name", "The Blues Hotel")
    if not smtp_host or not smtp_user:
        logger.warning("SMTP not configured, skipping email send")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if settings.get("smtp_secure", "true").lower() == "true":
                server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

# ══════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════
@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"])
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}})
    ip = request.client.host if request.client else "unknown"
    await log_activity(user["id"], "login", ip)
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}

@api_router.get("/auth/me")
async def get_me(admin=Depends(get_current_admin)):
    return {"id": admin["id"], "name": admin["name"], "email": admin["email"], "role": admin["role"]}

# ══════════════════════════════════════
# SHOWS
# ══════════════════════════════════════
@api_router.get("/shows")
async def get_shows():
    shows = await db.shows.find({}, {"_id": 0}).to_list(100)
    return shows

@api_router.get("/shows/{slug}")
async def get_show(slug: str):
    show = await db.shows.find_one({"slug": slug}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    return show

# ══════════════════════════════════════
# EPISODES
# ══════════════════════════════════════
@api_router.get("/episodes")
async def get_episodes(show_slug: Optional[str] = None, published_only: bool = True, search: Optional[str] = None, limit: int = 50, skip: int = 0):
    query = {}
    if show_slug:
        query["show_slug"] = show_slug
    if published_only:
        query["published"] = True
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    episodes = await db.episodes.find(query, {"_id": 0}).sort("published_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.episodes.count_documents(query)
    return {"episodes": episodes, "total": total}

@api_router.get("/episodes/{episode_id}")
async def get_episode(episode_id: str):
    ep = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    return ep

@api_router.post("/episodes")
async def create_episode(data: EpisodeCreate, admin=Depends(get_current_admin)):
    show = await db.shows.find_one({"slug": data.show_slug}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=400, detail="Invalid show slug")
    count = await db.episodes.count_documents({"show_slug": data.show_slug})
    episode = {
        "id": str(uuid.uuid4()), **data.model_dump(),
        "published_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "order_index": count,
        "show_name": show["name"],
        "show_cover_art_url": show.get("cover_art_url", "")
    }
    if not episode["cover_art_url"]:
        episode["cover_art_url"] = show.get("cover_art_url", "")
    await db.episodes.insert_one(episode)
    created = await db.episodes.find_one({"id": episode["id"]}, {"_id": 0})
    await log_activity(admin["id"], f"created episode: {data.title}")
    return created

@api_router.put("/episodes/{episode_id}")
async def update_episode(episode_id: str, data: EpisodeUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    await db.episodes.update_one({"id": episode_id}, {"$set": update_data})
    updated = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Episode not found")
    await log_activity(admin["id"], f"updated episode: {episode_id}")
    return updated

@api_router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: str, admin=Depends(get_current_admin)):
    result = await db.episodes.delete_one({"id": episode_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Episode not found")
    await log_activity(admin["id"], f"deleted episode: {episode_id}")
    return {"message": "Episode deleted"}

# ══════════════════════════════════════
# EVENTS
# ══════════════════════════════════════
@api_router.get("/events")
async def get_events(published_only: bool = True, upcoming: bool = False):
    query = {}
    if published_only:
        query["published"] = True
    if upcoming:
        query["date"] = {"$gte": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    events = await db.events.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    return events

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@api_router.post("/events")
async def create_event(data: EventCreate, admin=Depends(get_current_admin)):
    event = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.events.insert_one(event)
    created = await db.events.find_one({"id": event["id"]}, {"_id": 0})
    await log_activity(admin["id"], f"created event: {data.title}")
    return created

@api_router.put("/events/{event_id}")
async def update_event(event_id: str, data: EventUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    await db.events.update_one({"id": event_id}, {"$set": update_data})
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    await log_activity(admin["id"], f"updated event: {event_id}")
    return updated

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, admin=Depends(get_current_admin)):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    await log_activity(admin["id"], f"deleted event: {event_id}")
    return {"message": "Event deleted"}

# ══════════════════════════════════════
# PAGES
# ══════════════════════════════════════
@api_router.get("/pages/{slug}")
async def get_page(slug: str):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.put("/pages/{slug}")
async def update_page(slug: str, data: PageUpdate, admin=Depends(get_current_admin)):
    update = {"content_html": data.content_html, "updated_at": datetime.now(timezone.utc).isoformat()}
    if data.title:
        update["title"] = data.title
    await db.pages.update_one({"slug": slug}, {"$set": update}, upsert=True)
    updated = await db.pages.find_one({"slug": slug}, {"_id": 0})
    await log_activity(admin["id"], f"updated page: {slug}")
    return updated

# ══════════════════════════════════════
# COMMUNITY & CONTACT
# ══════════════════════════════════════
@api_router.post("/community/submit-music")
async def submit_music(data: SubmitMusicRequest):
    submission = {
        "id": str(uuid.uuid4()), "type": "submit_music",
        "name": data.name, "artist_name": data.artist_name, "email": data.email,
        "message": data.message, "file_url": data.file_url,
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(submission)
    await send_email("admin@theblueshotel.com.au", f"New Music Submission from {data.artist_name or data.name}",
        f"<h2>New Music Submission</h2><p><strong>Name:</strong> {data.name}</p><p><strong>Artist:</strong> {data.artist_name}</p><p><strong>Email:</strong> {data.email}</p><p><strong>Message:</strong> {data.message}</p>")
    return {"message": "Music submission received"}

@api_router.post("/community/share-story")
async def share_story(data: ShareStoryRequest):
    submission = {
        "id": str(uuid.uuid4()), "type": "share_story",
        "name": data.name, "email": data.email, "message": data.message,
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(submission)
    await send_email("admin@theblueshotel.com.au", f"New Story from {data.name}",
        f"<h2>New Story Shared</h2><p><strong>Name:</strong> {data.name}</p><p><strong>Email:</strong> {data.email}</p><p><strong>Story:</strong> {data.message[:500]}</p>")
    return {"message": "Story received"}

@api_router.post("/contact")
async def contact_form(data: ContactRequest):
    submission = {
        "id": str(uuid.uuid4()), "type": "contact",
        "name": data.name, "email": data.email, "subject": data.subject,
        "message": data.message, "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(submission)
    await send_email("admin@theblueshotel.com.au", f"Contact Form: {data.subject}",
        f"<h2>New Contact Message</h2><p><strong>Name:</strong> {data.name}</p><p><strong>Email:</strong> {data.email}</p><p><strong>Subject:</strong> {data.subject}</p><p><strong>Message:</strong> {data.message}</p>")
    return {"message": "Message sent"}

@api_router.get("/submissions")
async def get_submissions(sub_type: Optional[str] = None, admin=Depends(get_current_admin)):
    query = {}
    if sub_type:
        query["type"] = sub_type
    subs = await db.submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return subs

@api_router.put("/submissions/{sub_id}/read")
async def mark_submission_read(sub_id: str, admin=Depends(get_current_admin)):
    await db.submissions.update_one({"id": sub_id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

@api_router.delete("/submissions/{sub_id}")
async def delete_submission(sub_id: str, admin=Depends(get_current_admin)):
    await db.submissions.delete_one({"id": sub_id})
    return {"message": "Deleted"}

# ══════════════════════════════════════
# NEWSLETTER
# ══════════════════════════════════════
@api_router.post("/newsletter/subscribe")
async def subscribe(data: SubscribeRequest):
    existing = await db.newsletter.find_one({"email": data.email}, {"_id": 0})
    if existing:
        return {"message": "Already subscribed"}
    sub = {
        "id": str(uuid.uuid4()), "first_name": data.first_name, "last_name": data.last_name,
        "email": data.email, "active": True, "subscribed_at": datetime.now(timezone.utc).isoformat()
    }
    await db.newsletter.insert_one(sub)
    await send_email("admin@theblueshotel.com.au", "New Newsletter Subscriber",
        f"<h2>New Subscriber</h2><p>{data.first_name} {data.last_name} ({data.email})</p>")
    return {"message": "Subscribed successfully"}

@api_router.get("/newsletter/subscribers")
async def get_subscribers(admin=Depends(get_current_admin)):
    subs = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(10000)
    return subs

@api_router.delete("/newsletter/subscribers/{sub_id}")
async def delete_subscriber(sub_id: str, admin=Depends(get_current_admin)):
    await db.newsletter.delete_one({"id": sub_id})
    return {"message": "Subscriber removed"}

@api_router.get("/newsletter/export-csv")
async def export_csv(admin=Depends(get_current_admin)):
    subs = await db.newsletter.find({}, {"_id": 0}).to_list(10000)
    csv_lines = ["first_name,last_name,email,subscribed_at"]
    for s in subs:
        csv_lines.append(f"{s.get('first_name','')},{s.get('last_name','')},{s.get('email','')},{s.get('subscribed_at','')}")
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse("\n".join(csv_lines), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=subscribers.csv"})

# ══════════════════════════════════════
# SETTINGS
# ══════════════════════════════════════
@api_router.get("/settings")
async def get_settings(admin=Depends(get_current_admin)):
    settings = {}
    async for s in db.site_settings.find({}, {"_id": 0}):
        settings[s["key"]] = s["value"]
    return settings

@api_router.put("/settings")
async def update_settings(data: SettingsUpdate, admin=Depends(get_current_admin)):
    for key, value in data.settings.items():
        await db.site_settings.update_one({"key": key}, {"$set": {"key": key, "value": value}}, upsert=True)
    await log_activity(admin["id"], "updated settings")
    return {"message": "Settings updated"}

@api_router.get("/settings/public")
async def get_public_settings():
    public_keys = ["site_title", "site_tagline", "contact_email", "contact_phone", "social_facebook", "social_instagram", "social_youtube", "social_bluesky", "social_linkedin", "demo_mode"]
    settings = {}
    async for s in db.site_settings.find({"key": {"$in": public_keys}}, {"_id": 0}):
        settings[s["key"]] = s["value"]
    return settings

@api_router.post("/settings/test-email")
async def test_email(admin=Depends(get_current_admin)):
    result = await send_email(admin["email"], "Test Email from The Blues Hotel", "<h2>Test Email</h2><p>Your SMTP settings are working correctly.</p>")
    if result:
        return {"message": "Test email sent"}
    raise HTTPException(status_code=500, detail="Failed to send test email. Check SMTP settings.")

# ══════════════════════════════════════
# ADMIN DASHBOARD & ACTIVITY
# ══════════════════════════════════════
@api_router.get("/admin/dashboard")
async def admin_dashboard(admin=Depends(get_current_admin)):
    episodes_count = await db.episodes.count_documents({})
    events_count = await db.events.count_documents({})
    subs_count = await db.newsletter.count_documents({})
    submissions_count = await db.submissions.count_documents({"read": False})
    recent_episodes = await db.episodes.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_submissions = await db.submissions.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "episodes_count": episodes_count, "events_count": events_count,
        "subscribers_count": subs_count, "unread_submissions": submissions_count,
        "recent_episodes": recent_episodes, "recent_submissions": recent_submissions
    }

@api_router.get("/admin/activity-log")
async def get_activity_log(admin=Depends(get_current_admin)):
    logs = await db.activity_log.find({}, {"_id": 0}).sort("timestamp", -1).limit(100).to_list(100)
    return logs

# ══════════════════════════════════════
# FILE UPLOADS
# ══════════════════════════════════════
@api_router.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file")
    ext = Path(file.filename).suffix.lower()
    if ext not in [".mp3", ".wav", ".m4a", ".ogg"]:
        raise HTTPException(status_code=400, detail="Invalid audio format")
    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / "audio" / filename
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    return {"url": f"/api/uploads/audio/{filename}", "filename": filename}

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file")
    ext = Path(file.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Invalid image format")
    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / "images" / filename
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    return {"url": f"/api/uploads/images/{filename}", "filename": filename}

# ══════════════════════════════════════
# STRIPE PAYMENTS (SCAFFOLD)
# ══════════════════════════════════════
@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest):
    event = await db.events.find_one({"id": data.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    price = event.get("ticket_price")
    if not price or price <= 0:
        raise HTTPException(status_code=400, detail="Event has no ticket price")
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        api_key = os.environ.get("STRIPE_API_KEY", "")
        success_url = f"{data.origin_url}/events?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{data.origin_url}/events"
        webhook_url = f"{data.origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        req = CheckoutSessionRequest(amount=float(price), currency="aud", success_url=success_url, cancel_url=cancel_url,
            metadata={"event_id": data.event_id, "event_title": event.get("title", "")})
        session = await stripe_checkout.create_checkout_session(req)
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()), "session_id": session.session_id, "event_id": data.event_id,
            "amount": float(price), "currency": "aud", "payment_status": "pending",
            "metadata": {"event_id": data.event_id, "event_title": event.get("title", "")},
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        api_key = os.environ.get("STRIPE_API_KEY", "")
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if tx and tx.get("payment_status") != status.payment_status:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": status.payment_status, "status": status.status}}
            )
        return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency}
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        body = await request.body()
        api_key = os.environ.get("STRIPE_API_KEY", "")
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        sig = request.headers.get("Stripe-Signature", "")
        webhook_response = await stripe_checkout.handle_webhook(body, sig)
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": webhook_response.payment_status, "event_type": webhook_response.event_type}}
            )
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": False}

# ══════════════════════════════════════
# SEED DATA
# ══════════════════════════════════════
@api_router.post("/seed")
async def seed_data():
    # Admin user
    existing_admin = await db.users.find_one({"email": "admin@theblueshotel.com.au"})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "name": "Admin", "email": "admin@theblueshotel.com.au",
            "password_hash": hash_password("password"), "role": "admin",
            "two_fa_enabled": False, "created_at": datetime.now(timezone.utc).isoformat(), "last_login": None
        })

    # Shows
    shows_data = [
        {"id": str(uuid.uuid4()), "slug": "the-blues-hotel", "name": "The Blues Hotel",
         "description": "The music, the legends, the stories behind the songs \u2014 and the fresh independent blues.",
         "cover_art_url": "https://artwork.captivate.fm/54cfbaea-c458-423b-b446-bc25cc63985a/TBHC-TBH-POCAST.png",
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "slug": "just-talkin-blues", "name": "Just Talkin' Blues",
         "description": "Conversations with the artists \u2014 unfiltered, unscripted, and real. Recorded via Riverside.fm; also available as a YouTube podcast series.",
         "cover_art_url": "https://artwork.captivate.fm/c808ca2b-b9d1-4e69-85cf-33a0591eca37/TBHC-JTB-PODCAST.jpg",
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "slug": "blues-moments-in-time", "name": "Blues Moments in Time",
         "description": "The history \u2014 one moment at a time. A daily podcast exploring blues birthdays, anniversaries, iconic album releases, and historic performances.",
         "cover_art_url": "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400&h=400&fit=crop",
         "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    for show in shows_data:
        existing = await db.shows.find_one({"slug": show["slug"]})
        if not existing:
            await db.shows.insert_one(show)

    # Get show IDs for episodes
    tbh = await db.shows.find_one({"slug": "the-blues-hotel"}, {"_id": 0})
    jtb = await db.shows.find_one({"slug": "just-talkin-blues"}, {"_id": 0})
    bmit = await db.shows.find_one({"slug": "blues-moments-in-time"}, {"_id": 0})

    episodes_data = [
        {"id": str(uuid.uuid4()), "show_slug": "the-blues-hotel", "show_name": "The Blues Hotel",
         "title": "Nocturnal Souls from the Delta to Down Under",
         "description": "Kelvin Huggins unlocks the doors to The Blues Hotel for 2026. We turn the lights down low and the stories up loud. Each episode walks the hallway between Chicago and the Mississippi Delta, then takes a sharp turn into Melbourne bars and Australian backroads.",
         "external_audio_url": "https://episodes.captivate.fm/episode/58427089-1924-4039-adb6-1b1f80a1b5d1.mp3",
         "audio_url": None, "cover_art_url": tbh["cover_art_url"] if tbh else "",
         "youtube_url": "", "spotify_url": "", "tags": ["delta", "chicago", "australia"],
         "duration_seconds": 6001, "published": True,
         "published_at": "2026-01-19T00:00:00+00:00", "created_at": "2026-01-19T00:00:00+00:00", "order_index": 0,
         "show_cover_art_url": tbh["cover_art_url"] if tbh else ""},
        {"id": str(uuid.uuid4()), "show_slug": "just-talkin-blues", "show_name": "Just Talkin' Blues",
         "title": "Riding the Rails: Inside Victoria's Blues Train Legacy",
         "description": "A deep dive into one of Australia's most unique music experiences \u2014 a four-hour rolling roots revue on a heritage steam train. This episode unpacks the Blues Train's 32-year evolution.",
         "external_audio_url": "https://episodes.captivate.fm/episode/e9ed5520-b164-4706-abd1-645400918193.mp3",
         "audio_url": None, "cover_art_url": jtb["cover_art_url"] if jtb else "",
         "youtube_url": "", "spotify_url": "", "tags": ["victoria", "blues-train", "live-music"],
         "duration_seconds": 1170, "published": True,
         "published_at": "2026-03-04T00:00:00+00:00", "created_at": "2026-03-04T00:00:00+00:00", "order_index": 0,
         "show_cover_art_url": jtb["cover_art_url"] if jtb else ""},
        {"id": str(uuid.uuid4()), "show_slug": "blues-moments-in-time", "show_name": "Blues Moments in Time",
         "title": "The Day Robert Johnson Walked Into a San Antonio Hotel Room",
         "description": "On November 23, 1936, Robert Johnson stepped into Room 414 of the Gunter Hotel in San Antonio, Texas, and recorded the first of his legendary sessions that would change music forever.",
         "external_audio_url": "", "audio_url": None,
         "cover_art_url": bmit["cover_art_url"] if bmit else "",
         "youtube_url": "", "spotify_url": "", "tags": ["robert-johnson", "history", "recording"],
         "duration_seconds": 720, "published": True,
         "published_at": "2026-02-15T00:00:00+00:00", "created_at": "2026-02-15T00:00:00+00:00", "order_index": 0,
         "show_cover_art_url": bmit["cover_art_url"] if bmit else ""},
    ]
    for ep in episodes_data:
        existing = await db.episodes.find_one({"title": ep["title"]})
        if not existing:
            await db.episodes.insert_one(ep)

    # Sample events
    events_data = [
        {"id": str(uuid.uuid4()), "title": "Blues at the Basement", "description": "An intimate evening of live blues at The Basement in Surry Hills. Featuring local artists and special guests.",
         "date": "2026-04-15", "time": "19:00", "venue": "The Basement", "address": "7 Macquarie Pl", "city": "Sydney, NSW",
         "ticket_url": "", "ticket_price": 25.00, "cover_image_url": "https://images.unsplash.com/photo-1765224747205-3c9c23f0553c?w=800&fit=crop",
         "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Just Talkin' Blues Live Recording", "description": "Watch a live recording of Just Talkin' Blues with a special guest artist. Drinks and conversation in the lobby.",
         "date": "2026-05-20", "time": "18:30", "venue": "The Blues Hotel Lobby", "address": "Surry Hills", "city": "Sydney, NSW",
         "ticket_url": "", "ticket_price": 0.0, "cover_image_url": "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&fit=crop",
         "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    for ev in events_data:
        existing = await db.events.find_one({"title": ev["title"]})
        if not existing:
            await db.events.insert_one(ev)

    # Default pages
    pages_data = [
        {"slug": "privacy-policy", "title": "Privacy Policy", "content_html": "<h2>Privacy Policy</h2><p>The Blues Hotel Collective respects your privacy. We collect only information you voluntarily provide (name, email) through our newsletter, contact forms, and community submissions. We do not sell or share your data with third parties. Your information is stored securely and used solely for communication related to The Blues Hotel Collective.</p>", "updated_at": datetime.now(timezone.utc).isoformat()},
        {"slug": "terms-of-use", "title": "Terms of Use", "content_html": "<h2>Terms of Use</h2><p>By accessing The Blues Hotel Collective website, you agree to use it responsibly. All content, including podcast episodes, images, and text, is the property of The Blues Hotel Collective unless otherwise stated. You may share content with attribution but may not reproduce it for commercial purposes without permission.</p>", "updated_at": datetime.now(timezone.utc).isoformat()},
    ]
    for page in pages_data:
        existing = await db.pages.find_one({"slug": page["slug"]})
        if not existing:
            await db.pages.insert_one(page)

    # Default settings
    default_settings = {
        "site_title": "The Blues Hotel Collective",
        "site_tagline": "your home for everything blues.",
        "contact_email": "admin@theblueshotel.com.au",
        "contact_phone": "0482 170 801",
        "social_facebook": "https://facebook.com/theblueshotel/",
        "social_instagram": "https://instagram.com/theblueshotel/",
        "social_youtube": "https://youtube.com/@theblueshotel",
        "social_bluesky": "https://bsky.app/profile/theblueshotel.com.au",
        "social_linkedin": "https://www.linkedin.com/in/the-blues-hotel-collective",
        "demo_mode": "true",
        "smtp_host": "", "smtp_port": "587", "smtp_username": "", "smtp_password": "",
        "smtp_from_name": "The Blues Hotel", "smtp_from_email": "noreply@theblueshotel.com.au", "smtp_secure": "true"
    }
    for key, value in default_settings.items():
        existing = await db.site_settings.find_one({"key": key})
        if not existing:
            await db.site_settings.insert_one({"key": key, "value": value})

    return {"message": "Seed data created successfully"}

# ── Mount uploads ──
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ── Include router ──
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("Starting The Blues Hotel Collective API")
    await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
