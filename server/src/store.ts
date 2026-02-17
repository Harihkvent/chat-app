import Redis from "ioredis";

/**
 * Shared state store backed by Redis (for multi-instance deployments)
 * or in-memory Maps (for single-instance / local development).
 *
 * Redis is used when the REDIS_URL environment variable is set.
 */

const REDIS_URL = process.env.REDIS_URL;

// TTL for user socket entries (auto-expire stale entries after 24h)
const USER_SOCKET_TTL = 86400;
// TTL for call room entries (auto-expire stale rooms after 1h)
const CALL_ROOM_TTL = 3600;

// Redis key prefixes
const USER_SOCKET_KEY = "usersocket:";
const CALL_ROOM_KEY = "callroom:";

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  return redis;
}

export async function initRedis(): Promise<Redis | null> {
  if (!REDIS_URL) {
    console.log("ℹ️  REDIS_URL not set — using in-memory state (single-instance mode)");
    return null;
  }

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
    });

    await redis.ping();
    console.log("✅ Redis connected for shared state");
    return redis;
  } catch (err) {
    console.error("⚠️  Redis connection failed, falling back to in-memory:", err);
    redis = null;
    return null;
  }
}

// ─── In-memory fallbacks ────────────────────────────────────────────────────

const memUserSockets = new Map<string, string>();
const memCallRooms = new Map<string, Set<string>>();

// ─── User Sockets (userId → socketId) ───────────────────────────────────────

export async function setUserSocket(userId: string, socketId: string): Promise<void> {
  if (redis) {
    await redis.set(USER_SOCKET_KEY + userId, socketId, "EX", USER_SOCKET_TTL);
  } else {
    memUserSockets.set(userId, socketId);
  }
}

export async function getUserSocket(userId: string): Promise<string | null> {
  if (redis) {
    return redis.get(USER_SOCKET_KEY + userId);
  }
  return memUserSockets.get(userId) ?? null;
}

export async function deleteUserSocket(userId: string): Promise<void> {
  if (redis) {
    await redis.del(USER_SOCKET_KEY + userId);
  } else {
    memUserSockets.delete(userId);
  }
}

export async function findUserBySocket(socketId: string): Promise<string | null> {
  if (redis) {
    // Scan for user with this socketId
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        USER_SOCKET_KEY + "*",
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        const values = await redis.mget(...keys);
        for (let i = 0; i < keys.length; i++) {
          if (values[i] === socketId) {
            return keys[i].replace(USER_SOCKET_KEY, "");
          }
        }
      }
    } while (cursor !== "0");
    return null;
  } else {
    for (const [userId, sid] of memUserSockets.entries()) {
      if (sid === socketId) return userId;
    }
    return null;
  }
}

// ─── Call Rooms (roomId → Set<userId>) ──────────────────────────────────────

export async function addToCallRoom(roomId: string, userId: string): Promise<void> {
  if (redis) {
    await redis.sadd(CALL_ROOM_KEY + roomId, userId);
    await redis.expire(CALL_ROOM_KEY + roomId, CALL_ROOM_TTL);
  } else {
    const room = memCallRooms.get(roomId) || new Set();
    room.add(userId);
    memCallRooms.set(roomId, room);
  }
}

export async function removeFromCallRoom(roomId: string, userId: string): Promise<number> {
  if (redis) {
    await redis.srem(CALL_ROOM_KEY + roomId, userId);
    const remaining = await redis.scard(CALL_ROOM_KEY + roomId);
    if (remaining === 0) {
      await redis.del(CALL_ROOM_KEY + roomId);
    }
    return remaining;
  } else {
    const room = memCallRooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        memCallRooms.delete(roomId);
      }
      return room.size;
    }
    return 0;
  }
}

export async function getCallRoomMembers(roomId: string): Promise<string[]> {
  if (redis) {
    return redis.smembers(CALL_ROOM_KEY + roomId);
  }
  const room = memCallRooms.get(roomId);
  return room ? Array.from(room) : [];
}

export async function getAllCallRooms(): Promise<Map<string, Set<string>>> {
  if (redis) {
    const result = new Map<string, Set<string>>();
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        CALL_ROOM_KEY + "*",
        "COUNT",
        100
      );
      cursor = nextCursor;
      for (const key of keys) {
        const members = await redis.smembers(key);
        const roomId = key.replace(CALL_ROOM_KEY, "");
        result.set(roomId, new Set(members));
      }
    } while (cursor !== "0");
    return result;
  }
  return memCallRooms;
}
