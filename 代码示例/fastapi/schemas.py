"""请求体与响应体。Pydantic 会在进入接口前做类型校验。"""

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=64, description="登录名")
    password: str = Field(min_length=6, max_length=72, description="明文密码，只在传输中出现，不入库")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    # 与 Spring 示例保持同一用法：Authorization: Bearer <token>
    token_type: str = "Bearer"
    access_token: str
    expires_in_minutes: int


class UserResponse(BaseModel):
    id: int
    username: str
