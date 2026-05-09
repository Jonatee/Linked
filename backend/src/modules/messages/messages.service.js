const AppError = require("../../utils/app-error");
const { createCursorPagination } = require("../../utils/pagination");
const User = require("../users/user.model");
const Profile = require("../profiles/profile.model");
const Media = require("../media/media.model");
const blockingService = require("../users/blocking.service");
const UserSettings = require("../users/user-settings.model");
const Conversation = require("./message-conversation.model");
const Message = require("./message.model");
const { publishUserEvent } = require("./message-stream");
const { sendToUser } = require("../../utils/fcm");

function buildConversationKey(participantIds = []) {
  return [...participantIds].sort().join(":");
}

function buildProfilePayload(profile, mediaItems = []) {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    avatarMedia: mediaItems.find((item) => item.id === profile.avatarMediaId) || null
  };
}

function buildUserPayload(user, profiles, mediaItems) {
  if (!user) {
    return null;
  }

  const profile = profiles.find((item) => item.userId === user.id) || null;

  return {
    id: user.id,
    username: user.username,
    usernameDisplay: user.usernameDisplay,
    isVerified: user.isVerified,
    profile: buildProfilePayload(profile, mediaItems)
  };
}

async function loadUsers(userIds = []) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];

  if (!uniqueIds.length) {
    return {
      users: [],
      profiles: [],
      mediaItems: []
    };
  }

  const [users, profiles] = await Promise.all([
    User.find({ id: { $in: uniqueIds }, deletedAt: null })
      .select("id username usernameDisplay isVerified")
      .lean(),
    Profile.find({ userId: { $in: uniqueIds } }).lean()
  ]);

  const avatarMediaIds = [...new Set(profiles.map((profile) => profile.avatarMediaId).filter(Boolean))];
  const mediaItems = avatarMediaIds.length
    ? await Media.find({ id: { $in: avatarMediaIds }, deletedAt: null }).lean()
    : [];

  return { users, profiles, mediaItems };
}

async function assertCanMessage(senderId, recipientId) {
  if (!recipientId) {
    throw new AppError("recipientId is required", 400);
  }

  if (senderId === recipientId) {
    throw new AppError("You cannot message yourself", 400);
  }

  const recipient = await User.findOne({ id: recipientId, deletedAt: null }).lean();
  if (!recipient) {
    throw new AppError("Recipient not found", 404);
  }

  await blockingService.assertCanInteract(senderId, recipientId, "You cannot message this user");

  const [relationship, recipientSettings] = await Promise.all([
    blockingService.getRelationshipState(senderId, recipientId),
    UserSettings.findOne({ userId: recipientId }).lean()
  ]);

  const allowMessagesFrom = recipientSettings?.allowMessagesFrom || "following";
  if (allowMessagesFrom === "none") {
    throw new AppError("This user does not accept direct messages", 403);
  }

  if (allowMessagesFrom === "following" && !relationship.following) {
    throw new AppError("You must follow this user to message them", 403);
  }

  return { recipient };
}

async function getConversationForUsers(userId, recipientId) {
  const participantKey = buildConversationKey([userId, recipientId]);
  const existing = await Conversation.findOne({ participantKey, deletedAt: null }).lean();
  if (existing) {
    return existing;
  }

  return Conversation.findOneAndUpdate(
    { participantKey },
    {
      $setOnInsert: {
        participantIds: [userId, recipientId].sort(),
        participantKey,
        createdById: userId
      }
    },
    { new: true, upsert: true }
  );
}

async function getConversationOrFail(conversationId, userId) {
  const conversation = await Conversation.findOne({
    id: conversationId,
    participantIds: userId,
    deletedAt: null
  }).lean();

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const otherParticipantId = conversation.participantIds.find((participantId) => participantId !== userId) || null;
  if (otherParticipantId) {
    await blockingService.assertCanInteract(userId, otherParticipantId, "Conversation is not available");
  }

  return conversation;
}

function hydrateMessage(message, usersMap, profiles, mediaItems) {
  if (!message) {
    return null;
  }

  return {
    ...message,
    sender: buildUserPayload(usersMap.get(message.senderId) || null, profiles, mediaItems),
    recipient: buildUserPayload(usersMap.get(message.recipientId) || null, profiles, mediaItems)
  };
}

async function hydrateConversation(conversation, viewerId, unreadCount = 0) {
  if (!conversation) {
    return null;
  }

  const participantIds = conversation.participantIds || [];
  const lastMessageIds = conversation.lastMessageId ? [conversation.lastMessageId] : [];
  const otherParticipantId = participantIds.find((participantId) => participantId !== viewerId) || null;
  const [userBundle, lastMessages, relationship] = await Promise.all([
    loadUsers(participantIds),
    lastMessageIds.length ? Message.find({ id: { $in: lastMessageIds }, deletedAt: null }).lean() : [],
    otherParticipantId ? blockingService.getRelationshipState(viewerId, otherParticipantId) : Promise.resolve(null)
  ]);

  const userMap = new Map(userBundle.users.map((user) => [user.id, user]));
  const lastMessageMap = new Map(lastMessages.map((message) => [message.id, message]));
  const lastMessage = conversation.lastMessageId ? lastMessageMap.get(conversation.lastMessageId) || null : null;
  const hydratedLastMessage = hydrateMessage(lastMessage, userMap, userBundle.profiles, userBundle.mediaItems);
  const canMessage = relationship ? relationship.canMessage : true;

  return {
    ...conversation,
    participants: participantIds
      .map((participantId) => buildUserPayload(userMap.get(participantId) || null, userBundle.profiles, userBundle.mediaItems))
      .filter(Boolean),
    otherParticipant: otherParticipantId
      ? buildUserPayload(userMap.get(otherParticipantId) || null, userBundle.profiles, userBundle.mediaItems)
      : null,
    lastMessage: hydratedLastMessage,
    unreadCount,
    canMessage,
    relationship
  };
}

async function listConversations(userId, query = {}) {
  const limit = Number(query.limit || 20);
  const cursor = query.cursor ? new Date(query.cursor) : null;

  const conversations = await Conversation.find({
    participantIds: userId,
    archivedByIds: { $ne: userId },
    deletedAt: null,
    ...(cursor ? { lastMessageAt: { $lt: cursor } } : {})
  })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const conversationIds = conversations.map((item) => item.id);
  const unreadCounts = conversationIds.length
    ? await Message.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds },
            recipientId: userId,
            readAt: null,
            deletedAt: null
          }
        },
        {
          $group: {
            _id: "$conversationId",
            count: { $sum: 1 }
          }
        }
      ])
    : [];

  const unreadMap = new Map(unreadCounts.map((item) => [item._id, item.count]));
  const hydrated = await Promise.all(
    conversations.map((conversation) => hydrateConversation(conversation, userId, unreadMap.get(conversation.id) || 0))
  );
  const visibleConversations = [];

  for (const conversation of hydrated) {
    if (!conversation?.otherParticipant?.id) {
      visibleConversations.push(conversation);
      continue;
    }

    const relationship = await blockingService.getRelationshipState(userId, conversation.otherParticipant.id);
    if (relationship.canInteract) {
      visibleConversations.push(conversation);
    }
  }

  return createCursorPagination({ items: visibleConversations, limit, cursorField: "lastMessageAt" });
}

async function openConversation(userId, payload) {
  const { recipientId, body } = payload;
  await assertCanMessage(userId, recipientId);
  const conversation = await getConversationForUsers(userId, recipientId);
  const hydratedConversation = await hydrateConversation(conversation, userId, 0);

  if (!body) {
    return {
      conversation: hydratedConversation,
      message: null
    };
  }

  const message = await sendMessage(userId, conversation.id, { body });
  return {
    conversation: message.conversation,
    message: message.message
  };
}

async function listMessages(userId, conversationId, query = {}) {
  const conversation = await getConversationOrFail(conversationId, userId);
  const limit = Number(query.limit || 50);
  const cursor = query.cursor ? new Date(query.cursor) : null;

  const messages = await Message.find({
    conversationId,
    deletedAt: null,
    ...(cursor ? { createdAt: { $lt: cursor } } : {})
  })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const userBundle = await loadUsers(conversation.participantIds);
  const userMap = new Map(userBundle.users.map((user) => [user.id, user]));

  const hydrated = messages.map((message) => hydrateMessage(message, userMap, userBundle.profiles, userBundle.mediaItems));
  const paginated = createCursorPagination({ items: hydrated, limit, cursorField: "createdAt" });

  return {
    ...paginated,
    items: [...paginated.items].reverse(),
    conversation: await hydrateConversation(conversation, userId, 0)
  };
}

async function sendMessage(userId, conversationId, payload) {
  const conversation = await getConversationOrFail(conversationId, userId);
  const recipientId = conversation.participantIds.find((participantId) => participantId !== userId);

  if (!recipientId) {
    throw new AppError("Conversation is missing a recipient", 400);
  }

  await assertCanMessage(userId, recipientId);

  const body = (payload.body || "").trim();
  if (!body) {
    throw new AppError("Message body is required", 400);
  }

  const message = await Message.create({
    conversationId: conversation.id,
    senderId: userId,
    recipientId,
    body,
    status: "sent"
  });

  const updatedConversation = await Conversation.findOneAndUpdate(
    { id: conversation.id, deletedAt: null },
    {
      lastMessageId: message.id,
      lastMessageSenderId: userId,
      lastMessageText: body,
      lastMessageAt: message.createdAt,
      modifiedAt: new Date()
    },
    { new: true }
  ).lean();

  const userBundle = await loadUsers(conversation.participantIds);
  const userMap = new Map(userBundle.users.map((item) => [item.id, item]));
  const hydratedMessage = hydrateMessage(message.toObject ? message.toObject() : message, userMap, userBundle.profiles, userBundle.mediaItems);
  const hydratedConversation = await hydrateConversation(updatedConversation, userId, 0);
  const eventPayload = {
    conversation: hydratedConversation,
    message: hydratedMessage
  };

  const senderName = hydratedMessage.sender?.profile?.displayName || hydratedMessage.sender?.usernameDisplay || hydratedMessage.sender?.username || "Someone";
  sendToUser(recipientId, {
    title: `New message from ${senderName}`,
    body: hydratedMessage.body,
    data: {
      type: "message",
      conversationId: conversation.id,
      webUrl: `/messages/${conversation.id}`,
      fullUrl: `${process.env.FRONTEND_ORIGIN || "https://linked-theta.vercel.app"}/messages/${conversation.id}`
    }
  }).catch((error) => console.error("Failed to send message push notification:", error));

  await Promise.all([
    publishUserEvent(userId, { type: "message.created", payload: eventPayload }).catch(() => {}),
    publishUserEvent(recipientId, { type: "message.created", payload: eventPayload }).catch(() => {})
  ]);

  return {
    conversation: hydratedConversation,
    message: hydratedMessage
  };
}

async function markConversationRead(userId, conversationId) {
  const conversation = await getConversationOrFail(conversationId, userId);
  const otherParticipantId = conversation.participantIds.find((participantId) => participantId !== userId) || null;
  const now = new Date();

  const result = await Message.updateMany(
    {
      conversationId: conversation.id,
      recipientId: userId,
      readAt: null,
      deletedAt: null
    },
    {
      status: "read",
      readAt: now,
      modifiedAt: now
    }
  );

  await Conversation.updateOne(
    { id: conversation.id, deletedAt: null },
    {
      modifiedAt: now
    }
  );

  const hydratedConversation = await hydrateConversation(conversation, userId, 0);

  await Promise.all([
    publishUserEvent(userId, { type: "message.read", payload: { conversationId: conversation.id, readAt: now } }).catch(() => {}),
    otherParticipantId
      ? publishUserEvent(otherParticipantId, { type: "message.read", payload: { conversationId: conversation.id, readAt: now } }).catch(() => {})
      : Promise.resolve()
  ]);

  return {
    conversation: hydratedConversation,
    readCount: result.modifiedCount || 0
  };
}

module.exports = {
  assertCanMessage,
  openConversation,
  listConversations,
  listMessages,
  sendMessage,
  markConversationRead,
  buildConversationKey
};

