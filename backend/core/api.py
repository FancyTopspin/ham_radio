from typing import Optional
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from ninja import Router, Schema
from ninja.errors import HttpError

router = Router(tags=["Authentication"])

class UserResponse(Schema):
    id: int
    username: str
    email: str

class AuthStatusResponse(Schema):
    authenticated: bool
    user: Optional[UserResponse] = None

class RegisterPayload(Schema):
    username: str
    email: str
    password: str

class LoginPayload(Schema):
    username_or_email: str
    password: str

class MessageResponse(Schema):
    success: bool
    message: str


@router.get("/me", response=AuthStatusResponse)
def get_current_user(request):
    if request.user.is_authenticated:
        return {
            "authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
            }
        }
    return {"authenticated": False, "user": None}


@router.post("/register", response=AuthStatusResponse)
def register(request, payload: RegisterPayload):
    username = payload.username.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not username or not email or not password:
        raise HttpError(400, "Username, email, and password are required.")

    if len(password) < 6:
        raise HttpError(400, "Password must be at least 6 characters.")

    if User.objects.filter(username__iexact=username).exists():
        raise HttpError(400, "Username already taken.")

    if User.objects.filter(email__iexact=email).exists():
        raise HttpError(400, "Email address already registered.")

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return {
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        }
    except IntegrityError:
        raise HttpError(400, "Could not register user with provided details.")


@router.post("/login", response=AuthStatusResponse)
def login_view(request, payload: LoginPayload):
    identifier = payload.username_or_email.strip()
    password = payload.password

    # Try matching by username first
    user = authenticate(request, username=identifier, password=password)
    if not user:
        # Try matching by email
        try:
            matched_user = User.objects.get(email__iexact=identifier)
            user = authenticate(request, username=matched_user.username, password=password)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            pass

    if not user:
        raise HttpError(401, "Invalid username/email or password.")

    login(request, user)
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
    }


@router.post("/logout", response=MessageResponse)
def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
    return {"success": True, "message": "Successfully logged out."}
