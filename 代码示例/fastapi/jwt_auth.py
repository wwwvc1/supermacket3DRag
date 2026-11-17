"""
JWT 签发、校验，以及「从令牌找到当前用户」。

令牌分三段：Header.Payload.Signature。
Payload 只是 Base64，谁都能解码，不能放密码。
Signature 用服务器密钥计算，客户端改 Payload 后签名对不上，校验会失败。
"""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import User

# bcrypt 自带盐。同一明文每次哈希结果不同，校验时用 verify，不能自己做字符串相等比较。
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# auto_error=False：缺少 Authorization 头时由我们返回 401 和中文说明。
# HTTPBearer 只接受 "Authorization: Bearer <token>"，不接受把令牌放在 URL 上。
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(plain_password: str) -> str:
    """注册时调用。返回可直接写入 password_hash 列的字符串。"""
    return password_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """登录时调用。明文与库中的哈希是否匹配。"""
    return password_context.verify(plain_password, password_hash)


def create_access_token(user_id: int, username: str) -> str:
    """
    签发访问令牌。

    sub：主题，这里放用户名，和常见 JWT 约定一致。
    user_id：业务主键，后续接口不必再为了身份去解析用户名。
    iat / exp：签发时间与过期时间，必须是 UTC，避免本机时区把有效期算错。
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "user_id": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """
    校验签名和过期时间，返回 Payload。

    InvalidTokenError 覆盖签名错误、过期、格式损坏等情况。
    algorithms 必须写成白名单。不要用令牌头里自己声明的算法，否则存在算法混淆风险。
    """
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    受保护接口的依赖。解析令牌后按 user_id 回表确认用户仍存在。

    只信任签名过的令牌还不够：用户被删除或禁用后，未过期令牌仍应拒绝。
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少 Bearer 令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="令牌缺少用户标识")

    user = db.scalar(select(User).where(User.id == int(user_id)))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在或已被删除")
    return user
