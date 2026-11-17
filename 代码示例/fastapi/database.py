"""
数据库连接与会话。

SQLAlchemy 的 Engine 内部使用 QueuePool：
进程启动时建好少量连接，请求来了从池里借，用完归还，避免每次请求都重新握手。
"""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

# echo=True 会把 SQL 打到控制台，排查问题时再打开。
# pool_pre_ping：借出连接前先发一次探测，MySQL 把空闲连接掐掉后不会把死连接交给业务。
# pool_recycle：连接最长存活秒数，应小于 MySQL wait_timeout，避免服务端先断开。
# pool_size：常驻连接数。max_overflow：高峰时允许临时多开的连接数。
# pool_timeout：池中没有空闲连接时，最多等待多少秒，超时抛异常而不是无限阻塞。
engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
)

# autocommit=False：一条业务里的多次写入放在同一个事务，成功 commit，失败 rollback。
# expire_on_commit=False：提交后对象属性仍可读取，适合在返回响应前继续用刚保存的实体。
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。metadata 里登记了要建的表。"""


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI 依赖：每个请求分配一个 Session，响应结束后关闭。

    Session 不是连接本身。它向连接池借用连接，close() 把连接还回池里，不会拆掉 TCP。
    业务代码里不要自己 new Session，统一通过 Depends(get_db) 注入，避免忘记关闭。
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        # 请求处理中抛错时回滚，避免半成品写入被提交。
        db.rollback()
        raise
    finally:
        db.close()


def check_database() -> str:
    """启动或健康检查时执行。SELECT 1 能连通就说明账号、库名、网络和驱动都正常。"""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return "ok"
