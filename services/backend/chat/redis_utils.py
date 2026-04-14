"""Redis utility functions for presence tracking and caching."""

from typing import Optional

import redis.asyncio as redis_async


class RedisManager:
    """Manage Redis connections and operations for presence tracking."""

    REDIS_URL = "redis://localhost"
    PRESENCE_KEY_PREFIX = "presence:user:"

    @classmethod
    async def get_connection(cls) -> Optional[redis_async.Redis]:
        """Get a Redis connection."""
        try:
            return redis_async.from_url(cls.REDIS_URL, decode_responses=True)
        except Exception as e:
            print(f"Failed to connect to Redis: {e}")
            return None

    @classmethod
    async def set_user_online(cls, user_id: int, ttl: int = 60) -> bool:
        """Mark user as online in Redis with TTL."""
        redis = await cls.get_connection()
        if not redis:
            return False

        try:
            await redis.set(
                f"{cls.PRESENCE_KEY_PREFIX}{user_id}",
                "online",
                ex=ttl,
            )
            return True
        except Exception as e:
            print(f"Error setting user online: {e}")
            return False
        finally:
            await redis.close()

    @classmethod
    async def set_online(cls, user_id: int, ttl: int = 60) -> bool:
        """Alias for setting a user online in Redis."""
        return await cls.set_user_online(user_id, ttl=ttl)

    @classmethod
    async def set_user_offline(cls, user_id: int) -> bool:
        """Mark user as offline by removing from Redis."""
        redis = await cls.get_connection()
        if not redis:
            return False

        try:
            await redis.delete(f"{cls.PRESENCE_KEY_PREFIX}{user_id}")
            return True
        except Exception as e:
            print(f"Error setting user offline: {e}")
            return False
        finally:
            await redis.close()

    @classmethod
    async def set_offline(cls, user_id: int) -> bool:
        """Alias for setting a user offline in Redis."""
        return await cls.set_user_offline(user_id)

    @classmethod
    async def is_user_online(cls, user_id: int) -> bool:
        """Check if user is currently online."""
        redis = await cls.get_connection()
        if not redis:
            return False

        try:
            result = await redis.get(f"{cls.PRESENCE_KEY_PREFIX}{user_id}")
            return result is not None
        except Exception as e:
            print(f"Error checking user online status: {e}")
            return False
        finally:
            await redis.close()

    @classmethod
    async def get_all_online_users(cls) -> list:
        """Get list of all online user IDs."""
        redis = await cls.get_connection()
        if not redis:
            return []

        try:
            keys = await redis.keys(f"{cls.PRESENCE_KEY_PREFIX}*")
            user_ids = [int(key.split(":")[-1]) for key in keys]
            return user_ids
        except Exception as e:
            print(f"Error getting online users: {e}")
            return []
        finally:
            await redis.close()

    @classmethod
    async def refresh_user_session(cls, user_id: int, ttl: int = 60) -> bool:
        """Refresh user's online TTL (extend session)."""
        return await cls.set_user_online(user_id, ttl)

    @classmethod
    async def refresh_presence(cls, user_id: int, ttl: int = 60) -> bool:
        """Alias for refreshing a user's presence TTL."""
        return await cls.refresh_user_session(user_id, ttl=ttl)
