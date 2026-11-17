"""
FastAPI 最小可运行示例：注册、登录、查看当前用户。

启动前：
1. MySQL 中先建库：CREATE DATABASE demo_auth DEFAULT CHARSET utf8mb4;
2. 复制 .env.example 为 .env，改数据库密码和 JWT_SECRET。
3. pip install -r requirements.txt
4. 在本目录执行：uvicorn main:app --reload --port 8000

登录成功后访问受保护接口：
Authorization: Bearer <access_token>
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import Base, check_database, engine, get_db
from jwt_auth import create_access_token, get_current_user, hash_password, verify_password
from models import User
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    进程启动时建表并探测数据库，关闭时不做额外清理。

    create_all 只会创建缺失的表，不会修改已有列。示例够用。
    连不上数据库时这里会直接失败，避免服务起来了每个接口才报错。
    连接池由 Engine 持有，进程退出时 SQLAlchemy 会释放池中的连接。
    """
    Base.metadata.create_all(bind=engine)
    check_database()
    yield


app = FastAPI(title="FastAPI JWT 与数据库连接示例", version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    """不需要登录。用来确认进程和数据库都活着。"""
    return {"status": "up", "database": check_database()}


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> User:
    """注册。用户名唯一，密码只存哈希。"""
    existed = db.scalar(select(User).where(User.username == body.username))
    if existed is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")

    user = User(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    登录成功后返回 JWT，本接口不创建服务端 Session。

    失败时用户名不存在和密码错误返回同一句话，避免被用来探测账号是否注册。
    """
    user = db.scalar(select(User).where(User.username == body.username))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")

    return TokenResponse(
        access_token=create_access_token(user.id, user.username),
        expires_in_minutes=settings.jwt_expire_minutes,
    )


@app.get("/api/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    """需要 Bearer 令牌。身份来自 JWT，再经数据库确认用户仍在。"""
    return current_user
