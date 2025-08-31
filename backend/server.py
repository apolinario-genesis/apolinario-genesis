from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import secrets
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = "sacred-bond-couples-app-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Nosso Diário - Couples App API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models - Users
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserResponse(UserBase):
    id: str
    partner_id: Optional[str] = None
    partner_name: Optional[str] = None
    couple_code: Optional[str] = None
    created_at: datetime
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CoupleInviteRequest(BaseModel):
    couple_code: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Pydantic Models - Mural do Amor
class LoveMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    message_type: str = Field(default="message")  # message, quote, declaration

class LoveMessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    recipient_id: str
    message: str
    message_type: str
    created_at: datetime

# Pydantic Models - Agenda do Casal
class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    event_date: datetime
    event_type: str = Field(default="general")  # general, anniversary, date, religious
    is_reminder: bool = Field(default=True)

class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    event_date: datetime
    event_type: str
    is_reminder: bool
    created_by: str
    created_by_name: str
    created_at: datetime

# Pydantic Models - Diário Compartilhado
class DiaryEntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, max_length=2000)
    photos: Optional[List[str]] = Field(default=None)  # base64 images
    mood: Optional[str] = Field(default="happy")  # happy, grateful, excited, peaceful, romantic
    location: Optional[str] = Field(None, max_length=100)

class DiaryEntryResponse(BaseModel):
    id: str
    title: str
    content: str
    photos: Optional[List[str]]
    mood: Optional[str]
    location: Optional[str]
    created_by: str
    created_by_name: str
    created_at: datetime

# Pydantic Models - Espaço Espiritual
class SpiritualContentCreate(BaseModel):
    content_type: str  # prayer, reflection, verse_study
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, max_length=1000)
    bible_verse: Optional[str] = Field(None, max_length=200)
    bible_reference: Optional[str] = Field(None, max_length=50)

class SpiritualContentResponse(BaseModel):
    id: str
    content_type: str
    title: str
    content: str
    bible_verse: Optional[str]
    bible_reference: Optional[str]
    created_by: str
    created_by_name: str
    created_at: datetime

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_couple_code():
    """Generate a 6-character couple code"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

async def verify_couple(current_user):
    """Verify user has a partner"""
    if not current_user.get("partner_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a partner to access this feature"
        )
    return current_user

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    couple_code = generate_couple_code()
    
    user_dict = {
        "_id": ObjectId(),
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "partner_id": None,
        "couple_code": couple_code,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=str(user_dict["_id"]),
        name=user_dict["name"],
        email=user_dict["email"],
        couple_code=user_dict["couple_code"],
        created_at=user_dict["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"email": login_data.email})
    
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get partner info if exists
    partner_name = None
    if user.get("partner_id"):
        partner = await db.users.find_one({"_id": ObjectId(user["partner_id"])})
        if partner:
            partner_name = partner["name"]
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        partner_id=str(user["partner_id"]) if user.get("partner_id") else None,
        partner_name=partner_name,
        couple_code=user.get("couple_code"),
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/join-couple")
async def join_couple(invite: CoupleInviteRequest, current_user = Depends(get_current_user)):
    # Check if user already has a partner
    if current_user.get("partner_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a partner"
        )
    
    # Find user with the couple code
    partner = await db.users.find_one({"couple_code": invite.couple_code})
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid couple code"
        )
    
    # Check if partner already has a partner
    if partner.get("partner_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This person already has a partner"
        )
    
    # Connect the couple
    current_user_id = ObjectId(current_user["_id"])
    partner_id = ObjectId(partner["_id"])
    
    # Update both users
    await db.users.update_one(
        {"_id": current_user_id},
        {"$set": {"partner_id": partner_id, "updated_at": datetime.utcnow()}}
    )
    await db.users.update_one(
        {"_id": partner_id},
        {"$set": {"partner_id": current_user_id, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Successfully connected as couple!", "partner_name": partner["name"]}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    partner_name = None
    if current_user.get("partner_id"):
        partner = await db.users.find_one({"_id": ObjectId(current_user["partner_id"])})
        if partner:
            partner_name = partner["name"]
    
    return UserResponse(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        partner_id=str(current_user["partner_id"]) if current_user.get("partner_id") else None,
        partner_name=partner_name,
        couple_code=current_user.get("couple_code"),
        created_at=current_user["created_at"]
    )

# Mural do Amor Routes
@api_router.post("/love-messages", response_model=LoveMessageResponse)
async def create_love_message(message: LoveMessageCreate, current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    partner = await db.users.find_one({"_id": ObjectId(current_user["partner_id"])})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    message_dict = {
        "_id": ObjectId(),
        "sender_id": ObjectId(current_user["_id"]),
        "recipient_id": ObjectId(current_user["partner_id"]),
        "message": message.message,
        "message_type": message.message_type,
        "created_at": datetime.utcnow()
    }
    
    await db.love_messages.insert_one(message_dict)
    
    return LoveMessageResponse(
        id=str(message_dict["_id"]),
        sender_id=str(current_user["_id"]),
        sender_name=current_user["name"],
        recipient_id=str(current_user["partner_id"]),
        message=message_dict["message"],
        message_type=message_dict["message_type"],
        created_at=message_dict["created_at"]
    )

@api_router.get("/love-messages", response_model=List[LoveMessageResponse])
async def get_love_messages(current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    messages = await db.love_messages.find({
        "$or": [
            {"sender_id": ObjectId(current_user["_id"])},
            {"recipient_id": ObjectId(current_user["_id"])}
        ]
    }).sort("created_at", -1).to_list(100)
    
    result = []
    for msg in messages:
        sender = await db.users.find_one({"_id": msg["sender_id"]})
        result.append(LoveMessageResponse(
            id=str(msg["_id"]),
            sender_id=str(msg["sender_id"]),
            sender_name=sender["name"] if sender else "Unknown",
            recipient_id=str(msg["recipient_id"]),
            message=msg["message"],
            message_type=msg["message_type"],
            created_at=msg["created_at"]
        ))
    
    return result

# Agenda do Casal Routes
@api_router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate, current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    event_dict = {
        "_id": ObjectId(),
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date,
        "event_type": event.event_type,
        "is_reminder": event.is_reminder,
        "created_by": ObjectId(current_user["_id"]),
        "couple_id": [ObjectId(current_user["_id"]), ObjectId(current_user["partner_id"])],
        "created_at": datetime.utcnow()
    }
    
    await db.events.insert_one(event_dict)
    
    return EventResponse(
        id=str(event_dict["_id"]),
        title=event_dict["title"],
        description=event_dict["description"],
        event_date=event_dict["event_date"],
        event_type=event_dict["event_type"],
        is_reminder=event_dict["is_reminder"],
        created_by=str(current_user["_id"]),
        created_by_name=current_user["name"],
        created_at=event_dict["created_at"]
    )

@api_router.get("/events", response_model=List[EventResponse])
async def get_events(current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    events = await db.events.find({
        "couple_id": {"$in": [ObjectId(current_user["_id"])]}
    }).sort("event_date", 1).to_list(100)
    
    result = []
    for event in events:
        creator = await db.users.find_one({"_id": event["created_by"]})
        result.append(EventResponse(
            id=str(event["_id"]),
            title=event["title"],
            description=event.get("description"),
            event_date=event["event_date"],
            event_type=event["event_type"],
            is_reminder=event["is_reminder"],
            created_by=str(event["created_by"]),
            created_by_name=creator["name"] if creator else "Unknown",
            created_at=event["created_at"]
        ))
    
    return result

# Diário Compartilhado Routes
@api_router.post("/diary-entries", response_model=DiaryEntryResponse)
async def create_diary_entry(entry: DiaryEntryCreate, current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    entry_dict = {
        "_id": ObjectId(),
        "title": entry.title,
        "content": entry.content,
        "photos": entry.photos,
        "mood": entry.mood,
        "location": entry.location,
        "created_by": ObjectId(current_user["_id"]),
        "couple_id": [ObjectId(current_user["_id"]), ObjectId(current_user["partner_id"])],
        "created_at": datetime.utcnow()
    }
    
    await db.diary_entries.insert_one(entry_dict)
    
    return DiaryEntryResponse(
        id=str(entry_dict["_id"]),
        title=entry_dict["title"],
        content=entry_dict["content"],
        photos=entry_dict["photos"],
        mood=entry_dict["mood"],
        location=entry_dict["location"],
        created_by=str(current_user["_id"]),
        created_by_name=current_user["name"],
        created_at=entry_dict["created_at"]
    )

@api_router.get("/diary-entries", response_model=List[DiaryEntryResponse])
async def get_diary_entries(current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    entries = await db.diary_entries.find({
        "couple_id": {"$in": [ObjectId(current_user["_id"])]}
    }).sort("created_at", -1).to_list(100)
    
    result = []
    for entry in entries:
        creator = await db.users.find_one({"_id": entry["created_by"]})
        result.append(DiaryEntryResponse(
            id=str(entry["_id"]),
            title=entry["title"],
            content=entry["content"],
            photos=entry.get("photos"),
            mood=entry.get("mood"),
            location=entry.get("location"),
            created_by=str(entry["created_by"]),
            created_by_name=creator["name"] if creator else "Unknown",
            created_at=entry["created_at"]
        ))
    
    return result

# Espaço Espiritual Routes
@api_router.post("/spiritual-content", response_model=SpiritualContentResponse)
async def create_spiritual_content(content: SpiritualContentCreate, current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    content_dict = {
        "_id": ObjectId(),
        "content_type": content.content_type,
        "title": content.title,
        "content": content.content,
        "bible_verse": content.bible_verse,
        "bible_reference": content.bible_reference,
        "created_by": ObjectId(current_user["_id"]),
        "couple_id": [ObjectId(current_user["_id"]), ObjectId(current_user["partner_id"])],
        "created_at": datetime.utcnow()
    }
    
    await db.spiritual_content.insert_one(content_dict)
    
    return SpiritualContentResponse(
        id=str(content_dict["_id"]),
        content_type=content_dict["content_type"],
        title=content_dict["title"],
        content=content_dict["content"],
        bible_verse=content_dict["bible_verse"],
        bible_reference=content_dict["bible_reference"],
        created_by=str(current_user["_id"]),
        created_by_name=current_user["name"],
        created_at=content_dict["created_at"]
    )

@api_router.get("/spiritual-content", response_model=List[SpiritualContentResponse])
async def get_spiritual_content(content_type: Optional[str] = None, current_user = Depends(get_current_user)):
    await verify_couple(current_user)
    
    query = {"couple_id": {"$in": [ObjectId(current_user["_id"])]}}
    if content_type:
        query["content_type"] = content_type
    
    contents = await db.spiritual_content.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for content in contents:
        creator = await db.users.find_one({"_id": content["created_by"]})
        result.append(SpiritualContentResponse(
            id=str(content["_id"]),
            content_type=content["content_type"],
            title=content["title"],
            content=content["content"],
            bible_verse=content.get("bible_verse"),
            bible_reference=content.get("bible_reference"),
            created_by=str(content["created_by"]),
            created_by_name=creator["name"] if creator else "Unknown",
            created_at=content["created_at"]
        ))
    
    return result

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()