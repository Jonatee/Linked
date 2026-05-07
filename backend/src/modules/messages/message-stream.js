const { WebSocketServer, WebSocket } = require("ws");
const { redis } = require("../../db/redis");
const { logInfo, logError } = require("../../config/logger");
const { verifyAccessToken } = require("../../utils/tokens");
const User = require("../users/user.model");
const Conversation = require("./message-conversation.model");

const userConnections = new Map();
let subscriber = null;
let started = false;
let socketServer = null;
let attachedServer = null;
let upgradeHandler = null;
let heartbeatInterval = null;

function ensureConnectionSet(userId) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }

  return userConnections.get(userId);
}

function formatEvent(event) {
  return {
    type: event.type || "message.event",
    payload: event.payload || null,
    timestamp: event.timestamp || new Date().toISOString()
  };
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function sendSocketEvent(ws, event) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(JSON.stringify(formatEvent(event)));
}

function broadcastToUser(userId, event) {
  const connections = userConnections.get(userId);
  if (!connections || !connections.size) {
    return;
  }

  for (const ws of connections) {
    try {
      sendSocketEvent(ws, event);
    } catch (error) {
      logError("Failed to write message socket event", error.message);
    }
  }
}

async function publishUserEvent(userId, event) {
  await redis.publish(`messages:user:${userId}`, JSON.stringify(formatEvent(event)));
}

async function publishToUsers(userIds = [], event) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
  if (!uniqueIds.length) {
    return;
  }

  await Promise.all(uniqueIds.map((userId) => publishUserEvent(userId, event).catch(() => {})));
}

async function getConversationRecipients(conversationId, userId) {
  if (!conversationId || !userId) {
    return [];
  }

  const conversation = await Conversation.findOne({
    id: conversationId,
    participantIds: userId,
    deletedAt: null
  })
    .select("participantIds")
    .lean();

  if (!conversation) {
    return [];
  }

  return (conversation.participantIds || []).filter((participantId) => participantId !== userId);
}

async function getPresenceRecipients(userId) {
  const conversations = await Conversation.find({
    participantIds: userId,
    deletedAt: null
  })
    .select("participantIds")
    .lean();

  return [
    ...new Set(
      conversations
        .flatMap((conversation) => conversation.participantIds || [])
        .filter((participantId) => participantId && participantId !== userId)
    )
  ];
}

async function publishPresenceEvent(userId, type, status, lastSeenAt = null) {
  const recipients = await getPresenceRecipients(userId);
  if (!recipients.length) {
    return;
  }

  await publishToUsers(recipients, {
    type,
    payload: {
      userId,
      status,
      lastSeenAt
    }
  });
}

async function publishTypingEvent(userId, conversationId, isTyping) {
  const recipients = await getConversationRecipients(conversationId, userId);
  if (!recipients.length) {
    return;
  }

  await publishToUsers(recipients, {
    type: "message.typing",
    payload: {
      userId,
      conversationId,
      isTyping: Boolean(isTyping)
    }
  });
}

async function handleSocketMessage(userId, ws, raw) {
  const text = raw.toString("utf8");
  const event = safeJsonParse(text);
  if (!event) {
    return;
  }

  const type = event.type || event.event || event.action;
  const payload = event.payload || event;

  if (type === "typing" || type === "message.typing") {
    const conversationId = payload.conversationId || payload.threadId || null;
    if (!conversationId) {
      return;
    }

    await publishTypingEvent(userId, conversationId, payload.isTyping ?? true);
  }

  if (type === "ping") {
    sendSocketEvent(ws, { type: "pong", payload: null });
  }
}

function cleanupSocket(userId, ws) {
  const connections = userConnections.get(userId);
  if (!connections) {
    return false;
  }

  connections.delete(ws);
  if (!connections.size) {
    userConnections.delete(userId);
    return true;
  }

  return false;
}

function handleConnection(ws, req) {
  const userId = req.user?.id;
  if (!userId) {
    ws.close(4001, "Unauthorized");
    return;
  }

  const connections = ensureConnectionSet(userId);
  connections.add(ws);
  ws.isAlive = true;

  sendSocketEvent(ws, { type: "ready", payload: { userId } });

  if (connections.size === 1) {
    void publishPresenceEvent(userId, "presence.online", "online", null);
  }

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    void handleSocketMessage(userId, ws, message).catch((error) => {
      logError("Failed to handle message socket event", error.message);
    });
  });

  ws.on("close", () => {
    const becameOffline = cleanupSocket(userId, ws);
    if (becameOffline) {
      const lastSeenAt = new Date().toISOString();
      void publishPresenceEvent(userId, "presence.offline", "offline", lastSeenAt);
      void publishPresenceEvent(userId, "presence.last_seen", "offline", lastSeenAt);
    }
  });

  ws.on("error", (error) => {
    logError("Message websocket error", error.message);
  });
}

function rejectUpgrade(socket, statusLine = "HTTP/1.1 401 Unauthorized") {
  try {
    socket.write(`${statusLine}\r\nConnection: close\r\n\r\n`);
  } catch (error) {
    // Ignore socket write failures during reject.
  }

  socket.destroy();
}

async function authenticateUpgrade(req) {
  const requestUrl = new URL(req.url, "http://localhost");
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return null;
  }

  const user = await User.findOne({ id: payload.sub, deletedAt: null }).lean();
  if (!user) {
    return null;
  }

  return user;
}

function attachMessageSocketServer(server) {
  if (socketServer) {
    return;
  }

  attachedServer = server;
  socketServer = new WebSocketServer({ noServer: true });
  socketServer.on("connection", handleConnection);

  upgradeHandler = (req, socket, head) => {
    const requestUrl = new URL(req.url, "http://localhost");
    if (!["/api/v1/messages/ws", "/messages/ws"].includes(requestUrl.pathname)) {
      socket.destroy();
      return;
    }

    authenticateUpgrade(req)
      .then((user) => {
        if (!user) {
          rejectUpgrade(socket);
          return;
        }

        req.user = { id: user.id };
        socketServer.handleUpgrade(req, socket, head, (ws) => {
          socketServer.emit("connection", ws, req);
        });
      })
      .catch((error) => {
        logError("Failed to authenticate websocket upgrade", error.message);
        rejectUpgrade(socket, "HTTP/1.1 500 Internal Server Error");
      });
  };

  attachedServer.on("upgrade", upgradeHandler);
}

async function startMessageStream() {
  if (started) {
    return;
  }

  subscriber = redis.duplicate({
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });

  await subscriber.connect();
  await subscriber.psubscribe("messages:user:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    const userId = channel.split(":").pop();

    try {
      broadcastToUser(userId, JSON.parse(message));
    } catch (error) {
      logError("Failed to parse message pub/sub event", error.message);
    }
  });

  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(() => {
      for (const connections of userConnections.values()) {
        for (const ws of connections) {
          if (!ws.isAlive) {
            ws.terminate();
            continue;
          }

          ws.isAlive = false;
          try {
            ws.ping();
          } catch (error) {
            ws.terminate();
          }
        }
      }
    }, 30000);
  }

  started = true;
  logInfo("Message pub/sub connected");
}

async function stopMessageStream() {
  if (attachedServer && upgradeHandler) {
    attachedServer.off("upgrade", upgradeHandler);
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  for (const connections of userConnections.values()) {
    for (const ws of connections) {
      try {
        ws.terminate();
      } catch (error) {
        // Ignore termination errors during shutdown.
      }
    }
  }

  userConnections.clear();

  if (socketServer) {
    try {
      socketServer.close();
    } catch (error) {
      // Ignore close errors during shutdown.
    }
    socketServer = null;
  }

  attachedServer = null;
  upgradeHandler = null;

  if (!subscriber) {
    started = false;
    return;
  }

  try {
    await subscriber.quit();
  } finally {
    subscriber = null;
    started = false;
  }
}

module.exports = {
  attachMessageSocketServer,
  publishUserEvent,
  startMessageStream,
  stopMessageStream
};
