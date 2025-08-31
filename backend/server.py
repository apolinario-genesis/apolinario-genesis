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
app = FastAPI(title="Sacred Bond - Couples App API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
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