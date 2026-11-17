"""
读取数据库与 JWT 配置。

优先级：操作系统环境变量 > 同目录 .env > 下面的默认值。
默认值只为了本地能看懂字段含义，启动前应改成自己的库账号和密钥。
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # SQLAlchemy 连接串。方言 mysql+pymysql 表示用 PyMySQL 驱动走 MySQL 协议。
    # charset=utf8mb4 才能存中文和 emoji。
    database_url: str = (
        "mysql+pymysql://root:请改成你的密码@127.0.0.1:3306/demo_auth?charset=utf8mb4"
    )

    # HS256 对称签名密钥。签发和校验必须用同一把密钥。
    # 短密钥会被 jwt 库拒绝，或容易被穷举，生产环境不要使用示例字符串。
    jwt_secret: str = "请换成至少32字节的随机密钥-demo-only-change-me"

    # 访问令牌有效期，单位分钟。1440 = 24 小时。
    jwt_expire_minutes: int = 1440

    # 签名算法。HS256 是对称算法，服务端自己持有密钥即可。
    jwt_algorithm: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
