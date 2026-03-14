from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
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
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'blues_hotel')
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=1500)
db = client[db_name]
DB_MODE = "mongo"

JWT_SECRET = os.environ.get('JWT_SECRET', 'blues-hotel-default-secret')
JWT_ALGORITHM = "HS256"
DEFAULT_TEST_EMAIL = "vageshanagani21@gmail.com"
LEGACY_ADMIN_EMAIL = "admin@theblueshotel.com.au"
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "audio").mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def ensure_database_connection():
    global client, db, DB_MODE
    try:
        await client.admin.command("ping")
        DB_MODE = "mongo"
        return
    except Exception as exc:
        logger.warning(f"MongoDB unavailable, switching to in-memory DB: {exc}")
    try:
        from mongomock_motor import AsyncMongoMockClient
    except Exception as exc:
        logger.error(f"Failed to load mongomock fallback: {exc}")
        raise
    client = AsyncMongoMockClient()
    db = client[db_name]
    DB_MODE = "mock"

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

async def get_current_user_optional(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except Exception:
        return None

def generate_otp():
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    return cleaned.strip("-")

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
    published_at: Optional[str] = None

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
    published_at: Optional[str] = None
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
    audio_url: Optional[str] = None

class ShareStoryRequest(BaseModel):
    name: str
    email: str
    message: str
    audio_url: Optional[str] = None

class SettingsUpdate(BaseModel):
    settings: Dict[str, str]

class ShowCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: str = ""
    cover_art_url: Optional[str] = None

class ShowUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    cover_art_url: Optional[str] = None

class CheckoutRequest(BaseModel):
    event_id: str
    origin_url: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ChangeEmailRequest(BaseModel):
    password: str
    new_email: str

class ChangeNameRequest(BaseModel):
    name: str

class PasswordResetRequestModel(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class CommentCreate(BaseModel):
    name: str
    email: str
    text: str

class LikeRequest(BaseModel):
    email: str

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None

class TwoFAVerifyRequest(BaseModel):
    otp: str

class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]

class PushNotificationSend(BaseModel):
    title: str
    body: str
    url: Optional[str] = None

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

async def get_notification_email() -> str:
    setting = await db.site_settings.find_one({"key": "contact_email"}, {"_id": 0})
    if setting and setting.get("value"):
        return setting["value"]
    return DEFAULT_TEST_EMAIL

# ══════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════
@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user and email in {DEFAULT_TEST_EMAIL, LEGACY_ADMIN_EMAIL}:
        # Support legacy admin email during transition to the new default.
        user = await db.users.find_one({"role": "admin"}, {"_id": 0})
        if user:
            await db.users.update_one({"id": user["id"]}, {"$set": {"email": DEFAULT_TEST_EMAIL}})
            user["email"] = DEFAULT_TEST_EMAIL
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"])
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}})
    ip = request.client.host if request.client else "unknown"
    await log_activity(user["id"], "login", ip)
    # Check if 2FA is enabled
    if user.get("two_fa_enabled"):
        otp = generate_otp()
        expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        await db.otp_codes.insert_one({"user_id": user["id"], "otp": otp, "expires": expires, "purpose": "login_2fa", "used": False})
        email_sent = await send_email(user["email"], "Login Verification Code - The Blues Hotel",
            f"<h2>Login Verification</h2><p>Your login code is: <strong style='font-size:24px'>{otp}</strong></p><p>This code expires in 10 minutes.</p>")
        return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}, "requires_2fa": True, "otp_hint": otp if not email_sent else None}
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}, "requires_2fa": False}

@api_router.get("/auth/me")
async def get_me(admin=Depends(get_current_admin)):
    return {"id": admin["id"], "name": admin["name"], "email": admin["email"], "role": admin["role"]}

@api_router.put("/auth/change-password")
async def change_password(req: ChangePasswordRequest, admin=Depends(get_current_admin)):
    if not verify_password(req.current_password, admin["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    new_hash = hash_password(req.new_password)
    await db.users.update_one({"id": admin["id"]}, {"$set": {"password_hash": new_hash}})
    await log_activity(admin["id"], "changed password")
    return {"message": "Password changed successfully"}

@api_router.put("/auth/change-email")
async def change_email(req: ChangeEmailRequest, admin=Depends(get_current_admin)):
    if not verify_password(req.password, admin["password_hash"]):
        raise HTTPException(status_code=400, detail="Password is incorrect")
    existing = await db.users.find_one({"email": req.new_email, "id": {"$ne": admin["id"]}})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    await db.users.update_one({"id": admin["id"]}, {"$set": {"email": req.new_email}})
    await log_activity(admin["id"], f"changed email to {req.new_email}")
    new_token = create_token(admin["id"], req.new_email)
    return {"message": "Email changed successfully", "token": new_token, "email": req.new_email}

@api_router.put("/auth/change-name")
async def change_name(req: ChangeNameRequest, admin=Depends(get_current_admin)):
    await db.users.update_one({"id": admin["id"]}, {"$set": {"name": req.name}})
    await log_activity(admin["id"], f"changed name to {req.name}")
    return {"message": "Name updated successfully", "name": req.name}

@api_router.post("/auth/password-reset-request")
async def password_reset_request(req: PasswordResetRequestModel):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}
    reset_token = str(uuid.uuid4())
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    await db.password_resets.insert_one({"token": reset_token, "user_id": user["id"], "expires": expires, "used": False})
    await send_email(req.email, "Password Reset - The Blues Hotel",
        f"<h2>Password Reset</h2><p>Use this token to reset your password:</p><p><strong>{reset_token}</strong></p><p>This token expires in 1 hour.</p>")
    return {"message": "If that email exists, a reset link has been sent."}

@api_router.post("/auth/password-reset")
async def password_reset(req: PasswordResetConfirm):
    reset = await db.password_resets.find_one({"token": req.token, "used": False}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.fromisoformat(reset["expires"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    new_hash = hash_password(req.new_password)
    await db.users.update_one({"id": reset["user_id"]}, {"$set": {"password_hash": new_hash}})
    await db.password_resets.update_one({"token": req.token}, {"$set": {"used": True}})
    await log_activity(reset["user_id"], "reset password via email token")
    return {"message": "Password reset successfully"}

# ══════════════════════════════════════
# PUBLIC USER REGISTRATION & AUTH
# ══════════════════════════════════════
@api_router.post("/users/register")
async def user_register(req: UserRegisterRequest):
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = {
        "id": str(uuid.uuid4()), "name": req.name, "email": req.email,
        "password_hash": hash_password(req.password), "role": "user",
        "two_fa_enabled": False, "created_at": datetime.now(timezone.utc).isoformat(), "last_login": None
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": "user"}}

@api_router.post("/users/login")
async def user_login(req: UserLoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"])
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}

@api_router.get("/users/me")
async def get_user_profile(user=Depends(get_current_admin)):
    liked = await db.episode_likes.find({"email": user["email"]}, {"_id": 0}).to_list(200)
    liked_ids = [l["episode_id"] for l in liked]
    liked_episodes = []
    if liked_ids:
        liked_episodes = await db.episodes.find({"id": {"$in": liked_ids}}, {"_id": 0}).to_list(200)
    comments = await db.episode_comments.find({"email": user["email"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return {
        "id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"],
        "created_at": user.get("created_at", ""),
        "liked_episodes": liked_episodes, "comments": comments
    }

@api_router.put("/users/me")
async def update_user_profile(req: UserProfileUpdate, user=Depends(get_current_admin)):
    update = {}
    if req.name: update["name"] = req.name
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"id": updated["id"], "name": updated["name"], "email": updated["email"], "role": updated["role"]}

# ══════════════════════════════════════
# 2FA (Email OTP)
# ══════════════════════════════════════
@api_router.post("/auth/2fa/enable")
async def enable_2fa(admin=Depends(get_current_admin)):
    otp = generate_otp()
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.otp_codes.insert_one({"user_id": admin["id"], "otp": otp, "expires": expires, "purpose": "enable_2fa", "used": False})
    email_sent = await send_email(admin["email"], "Your 2FA Verification Code",
        f"<h2>2FA Verification</h2><p>Your verification code is: <strong style='font-size:24px'>{otp}</strong></p><p>This code expires in 10 minutes.</p>")
    if not email_sent:
        return {"message": "OTP generated but email delivery requires SMTP configuration", "otp_for_testing": otp}
    return {"message": "Verification code sent to your email"}

@api_router.post("/auth/2fa/verify")
async def verify_2fa(req: TwoFAVerifyRequest, admin=Depends(get_current_admin)):
    otp_record = await db.otp_codes.find_one(
        {"user_id": admin["id"], "otp": req.otp, "used": False, "purpose": "enable_2fa"}, {"_id": 0}
    )
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    if datetime.fromisoformat(otp_record["expires"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
    await db.otp_codes.update_one({"otp": req.otp, "user_id": admin["id"]}, {"$set": {"used": True}})
    await db.users.update_one({"id": admin["id"]}, {"$set": {"two_fa_enabled": True}})
    await log_activity(admin["id"], "enabled 2FA")
    return {"message": "2FA enabled successfully"}

@api_router.post("/auth/2fa/disable")
async def disable_2fa(admin=Depends(get_current_admin)):
    await db.users.update_one({"id": admin["id"]}, {"$set": {"two_fa_enabled": False}})
    await log_activity(admin["id"], "disabled 2FA")
    return {"message": "2FA disabled"}

@api_router.post("/auth/2fa/login-verify")
async def verify_2fa_login(req: TwoFAVerifyRequest, request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["user_id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    otp_record = await db.otp_codes.find_one(
        {"user_id": user_id, "otp": req.otp, "used": False, "purpose": "login_2fa"}, {"_id": 0}
    )
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if datetime.fromisoformat(otp_record["expires"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
    await db.otp_codes.update_one({"otp": req.otp, "user_id": user_id}, {"$set": {"used": True}})
    return {"message": "2FA verified", "verified": True}

# ══════════════════════════════════════
# PUSH NOTIFICATIONS
# ══════════════════════════════════════
@api_router.get("/push/vapid-key")
async def get_vapid_key():
    return {"publicKey": os.environ.get("VAPID_PUBLIC_KEY", "")}

@api_router.post("/push/subscribe")
async def push_subscribe(data: PushSubscription):
    existing = await db.push_subscriptions.find_one({"endpoint": data.endpoint})
    if existing:
        await db.push_subscriptions.update_one({"endpoint": data.endpoint}, {"$set": {"keys": data.keys}})
        return {"message": "Subscription updated"}
    await db.push_subscriptions.insert_one({
        "id": str(uuid.uuid4()), "endpoint": data.endpoint, "keys": data.keys,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Subscribed to notifications"}

@api_router.post("/push/send")
async def send_push(data: PushNotificationSend, admin=Depends(get_current_admin)):
    from pywebpush import webpush, WebPushException
    vapid_private = os.environ.get("VAPID_PRIVATE_KEY", "")
    vapid_email = os.environ.get("VAPID_CLAIMS_EMAIL", "admin@theblueshotel.com.au")
    if not vapid_private:
        raise HTTPException(status_code=500, detail="VAPID keys not configured")
    subs = await db.push_subscriptions.find({}, {"_id": 0}).to_list(10000)
    sent = 0
    failed = 0
    payload = json.dumps({"title": data.title, "body": data.body, "url": data.url or "/"})
    for sub in subs:
        try:
            webpush(
                subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={"sub": f"mailto:{vapid_email}"}
            )
            sent += 1
        except WebPushException:
            failed += 1
            await db.push_subscriptions.delete_one({"endpoint": sub["endpoint"]})
        except Exception:
            failed += 1
    await log_activity(admin["id"], f"sent push notification: {data.title} (sent: {sent}, failed: {failed})")
    return {"message": f"Sent to {sent} subscribers, {failed} failed"}

@api_router.get("/push/subscribers-count")
async def get_push_subscribers_count(admin=Depends(get_current_admin)):
    count = await db.push_subscriptions.count_documents({})
    return {"count": count}

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

@api_router.post("/shows")
async def create_show(data: ShowCreate, admin=Depends(get_current_admin)):
    generated_slug = slugify(data.slug or data.name)
    if not generated_slug:
        raise HTTPException(status_code=400, detail="Show slug is required")
    existing = await db.shows.find_one({"slug": generated_slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Show slug already exists")
    show = {
        "id": str(uuid.uuid4()),
        "slug": generated_slug,
        "name": data.name.strip(),
        "description": data.description or "",
        "cover_art_url": data.cover_art_url or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shows.insert_one(show)
    created = await db.shows.find_one({"id": show["id"]}, {"_id": 0})
    await log_activity(admin["id"], f"created show: {show['name']}")
    return created

@api_router.put("/shows/{show_id}")
async def update_show(show_id: str, data: ShowUpdate, admin=Depends(get_current_admin)):
    show = await db.shows.find_one({"id": show_id}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()
    if "slug" in update_data:
        update_data["slug"] = slugify(update_data["slug"])
    elif "name" in update_data and show.get("slug") == slugify(show.get("name", "")):
        update_data["slug"] = slugify(update_data["name"])
    if "slug" in update_data and not update_data["slug"]:
        raise HTTPException(status_code=400, detail="Show slug is required")
    if "slug" in update_data and update_data["slug"] != show["slug"]:
        existing = await db.shows.find_one({"slug": update_data["slug"], "id": {"$ne": show_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Show slug already exists")
    await db.shows.update_one({"id": show_id}, {"$set": update_data})
    updated = await db.shows.find_one({"id": show_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Show not found")
    if "slug" in update_data or "name" in update_data or "cover_art_url" in update_data:
        await db.episodes.update_many(
            {"show_slug": show["slug"]},
            {"$set": {
                "show_slug": updated["slug"],
                "show_name": updated["name"],
                "show_cover_art_url": updated.get("cover_art_url", ""),
            }},
        )
    await log_activity(admin["id"], f"updated show: {updated['name']}")
    return updated

@api_router.delete("/shows/{show_id}")
async def delete_show(show_id: str, admin=Depends(get_current_admin)):
    show = await db.shows.find_one({"id": show_id}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    linked_episodes = await db.episodes.count_documents({"show_slug": show["slug"]})
    if linked_episodes > 0:
        raise HTTPException(status_code=400, detail="Cannot delete a show with existing episodes")
    await db.shows.delete_one({"id": show_id})
    await log_activity(admin["id"], f"deleted show: {show['name']}")
    return {"message": "Show deleted"}

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
        "published_at": data.published_at or datetime.now(timezone.utc).isoformat(),
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

# ── Episode Likes & Comments ──
@api_router.post("/episodes/{episode_id}/like")
async def like_episode(episode_id: str, data: LikeRequest):
    ep = await db.episodes.find_one({"id": episode_id})
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    existing = await db.episode_likes.find_one({"episode_id": episode_id, "email": data.email})
    if existing:
        return {"message": "Already liked", "liked": True}
    await db.episode_likes.insert_one({"id": str(uuid.uuid4()), "episode_id": episode_id, "email": data.email, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Liked", "liked": True}

@api_router.delete("/episodes/{episode_id}/like")
async def unlike_episode(episode_id: str, email: str):
    await db.episode_likes.delete_one({"episode_id": episode_id, "email": email})
    return {"message": "Unliked", "liked": False}

@api_router.get("/episodes/{episode_id}/engagement")
async def get_episode_engagement(episode_id: str, email: Optional[str] = None):
    likes_count = await db.episode_likes.count_documents({"episode_id": episode_id})
    user_liked = False
    if email:
        user_liked = await db.episode_likes.find_one({"episode_id": episode_id, "email": email}) is not None
    comments = await db.episode_comments.find({"episode_id": episode_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    comments_count = len(comments)
    return {"likes_count": likes_count, "user_liked": user_liked, "comments": comments, "comments_count": comments_count}

@api_router.post("/episodes/{episode_id}/comments")
async def post_comment(episode_id: str, data: CommentCreate):
    ep = await db.episodes.find_one({"id": episode_id})
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    comment = {"id": str(uuid.uuid4()), "episode_id": episode_id, "name": data.name, "email": data.email, "text": data.text, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.episode_comments.insert_one(comment)
    created = await db.episode_comments.find_one({"id": comment["id"]}, {"_id": 0})
    return created

@api_router.delete("/episodes/{episode_id}/comments/{comment_id}")
async def delete_comment(episode_id: str, comment_id: str, admin=Depends(get_current_admin)):
    await db.episode_comments.delete_one({"id": comment_id, "episode_id": episode_id})
    await log_activity(admin["id"], f"deleted comment {comment_id} on episode {episode_id}")
    return {"message": "Comment deleted"}

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
        "message": data.message, "file_url": data.file_url, "audio_url": data.audio_url,
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(submission)
    notification_email = await get_notification_email()
    await send_email(notification_email, f"New Music Submission from {data.artist_name or data.name}",
        f"<h2>New Music Submission</h2><p><strong>Name:</strong> {data.name}</p><p><strong>Artist:</strong> {data.artist_name}</p><p><strong>Email:</strong> {data.email}</p><p><strong>Message:</strong> {data.message}</p>")
    return {"message": "Music submission received"}

@api_router.post("/community/share-story")
async def share_story(data: ShareStoryRequest):
    submission = {
        "id": str(uuid.uuid4()), "type": "share_story",
        "name": data.name, "email": data.email, "message": data.message, "audio_url": data.audio_url,
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(submission)
    notification_email = await get_notification_email()
    await send_email(notification_email, f"New Story from {data.name}",
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
    notification_email = await get_notification_email()
    await send_email(notification_email, f"Contact Form: {data.subject}",
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
    notification_email = await get_notification_email()
    await send_email(notification_email, "New Newsletter Subscriber",
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
    test_target = await get_notification_email()
    result = await send_email(test_target, "Test Email from The Blues Hotel", "<h2>Test Email</h2><p>Your SMTP settings are working correctly.</p>")
    if result:
        return {"message": "Test email sent", "to": test_target}
    raise HTTPException(status_code=500, detail="Failed to send test email. Check SMTP settings.")

@api_router.get("/admin/backup")
async def backup_data(admin=Depends(get_current_admin)):
    collection_names = await db.list_collection_names()
    collections: Dict[str, List[dict]] = {}
    collection_meta: Dict[str, dict] = {}
    for name in sorted(collection_names):
        if name.startswith("system."):
            continue
        docs = await db[name].find({}, {"_id": 0}).to_list(100000)
        collections[name] = docs
        collection_meta[name] = {"count": len(docs)}
    payload = {
        "metadata": {
            "app": "The Blues Hotel Collective",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "db_mode": DB_MODE,
            "exported_by_admin_id": admin["id"],
            "collections": collection_meta,
        },
        "collections": collections,
    }
    filename = f"blues-hotel-backup-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    return JSONResponse(
        payload,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@api_router.post("/admin/restore")
async def restore_data(
    file: UploadFile = File(...),
    overwrite: bool = Form(True),
    admin=Depends(get_current_admin),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No backup file provided")
    raw = await file.read()
    try:
        data = json.loads(raw.decode("utf-8"))
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Backup file must be UTF-8 JSON")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid backup JSON")
    if not isinstance(data, dict) or "collections" not in data:
        raise HTTPException(status_code=400, detail="Invalid backup format")
    collections = data["collections"]
    if not isinstance(collections, dict):
        raise HTTPException(status_code=400, detail="Invalid collections payload")

    restored_counts: Dict[str, int] = {}
    for name, docs in collections.items():
        if not isinstance(name, str) or not isinstance(docs, list):
            raise HTTPException(status_code=400, detail="Invalid collection data in backup")
        if overwrite:
            await db[name].delete_many({})
        if docs:
            await db[name].insert_many(docs)
        restored_counts[name] = len(docs)
    await log_activity(
        admin["id"],
        f"restored backup ({'overwrite' if overwrite else 'append'}) with {len(restored_counts)} collections",
    )
    return {
        "message": "Backup restored",
        "collections_restored": restored_counts,
        "metadata": data.get("metadata", {}),
    }

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

    # Chart data: episodes per show
    shows = await db.shows.find({}, {"_id": 0}).to_list(10)
    episodes_by_show = []
    for show in shows:
        count = await db.episodes.count_documents({"show_slug": show["slug"]})
        episodes_by_show.append({"name": show["name"], "slug": show["slug"], "count": count})

    # Chart data: subscriber growth (last 12 months)
    subscriber_growth = []
    now = datetime.now(timezone.utc)
    for i in range(11, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        month_label = month_start.strftime("%b %Y")
        count = await db.newsletter.count_documents({"subscribed_at": {"$lte": month_start.isoformat()}})
        total_now = await db.newsletter.count_documents({"subscribed_at": {"$lte": (month_start + timedelta(days=32)).replace(day=1).isoformat()}})
        subscriber_growth.append({"month": month_label, "count": total_now})

    # Chart data: submissions over time (last 6 months)
    submissions_chart = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        next_month = (month_start + timedelta(days=32)).replace(day=1)
        count = await db.submissions.count_documents({"created_at": {"$gte": month_start.isoformat(), "$lt": next_month.isoformat()}})
        submissions_chart.append({"month": month_start.strftime("%b"), "count": count})

    return {
        "episodes_count": episodes_count, "events_count": events_count,
        "subscribers_count": subs_count, "unread_submissions": submissions_count,
        "recent_episodes": recent_episodes, "recent_submissions": recent_submissions,
        "episodes_by_show": episodes_by_show, "subscriber_growth": subscriber_growth,
        "submissions_chart": submissions_chart
    }

@api_router.get("/admin/pages")
async def get_all_pages(admin=Depends(get_current_admin)):
    pages = await db.pages.find({}, {"_id": 0}).to_list(100)
    return pages

@api_router.get("/admin/activity-log")
async def get_activity_log(admin=Depends(get_current_admin)):
    logs = await db.activity_log.find({}, {"_id": 0}).sort("timestamp", -1).limit(100).to_list(100)
    return logs

# ══════════════════════════════════════
# FILE UPLOADS
# ══════════════════════════════════════
@api_router.post("/upload/community-audio")
async def upload_community_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file")
    ext = Path(file.filename).suffix.lower()
    if ext not in [".mp3", ".wav", ".m4a", ".ogg"]:
        raise HTTPException(status_code=400, detail="Invalid audio format")
    content = await file.read()
    max_size_bytes = 20 * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=400, detail="Audio file exceeds 20MB limit")
    filename = f"community-{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / "audio" / filename
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    return {"url": f"/api/uploads/audio/{filename}", "filename": filename}

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
    existing_admin = await db.users.find_one({"role": "admin"})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "name": "Admin", "email": DEFAULT_TEST_EMAIL,
            "password_hash": hash_password("password"), "role": "admin",
            "two_fa_enabled": False, "created_at": datetime.now(timezone.utc).isoformat(), "last_login": None
        })
    else:
        admin_updates = {}
        if existing_admin.get("email") == LEGACY_ADMIN_EMAIL:
            admin_updates["email"] = DEFAULT_TEST_EMAIL
        # Keep startup credentials deterministic for first-time seeded admin only.
        if existing_admin.get("last_login") is None and not verify_password("password", existing_admin["password_hash"]):
            admin_updates["password_hash"] = hash_password("password")
        if admin_updates:
            await db.users.update_one({"id": existing_admin["id"]}, {"$set": admin_updates})

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
        "contact_email": DEFAULT_TEST_EMAIL,
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
    await ensure_database_connection()
    await seed_data()
    logger.info(f"Database mode: {DB_MODE}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
