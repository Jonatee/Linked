"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, MessageSquareText, MoreHorizontal, Plus, Search, Send, Smile, Sparkles, UserRound } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import useAuthStore from "@/stores/auth-store";
import VerifiedBadge from "@/components/branding/verified-badge";
import { Input } from "@/components/ui/input";

function getConversationName(conversation) {
  const person = conversation?.otherParticipant || conversation?.participants?.find((item) => item?.id);
  return person?.profile?.displayName || person?.usernameDisplay || person?.username || "Conversation";
}

function getConversationUsername(conversation) {
  const person = conversation?.otherParticipant || conversation?.participants?.find((item) => item?.id);
  return person?.username || "";
}

function getConversationAvatar(conversation) {
  const person = conversation?.otherParticipant || conversation?.participants?.find((item) => item?.id);
  return person?.profile?.avatarMedia?.secureUrl || "";
}

function getConversationInitials(conversation) {
  const person = conversation?.otherParticipant || conversation?.participants?.find((item) => item?.id);
  return (person?.profile?.displayName || person?.usernameDisplay || person?.username || "LI").slice(0, 2).toUpperCase();
}

function getMessageAuthor(message, currentUserId) {
  if (!message) {
    return null;
  }

  return message.senderId === currentUserId ? message.recipient : message.sender;
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(date);
}

function statusLabel(presence) {
  if (!presence) return "";
  if (presence.status === "online") return "Online";
  if (presence.lastSeenAt) return "Last seen " + formatRelativeTime(presence.lastSeenAt);
  return "";
}

function ChatAvatar({ src, alt, initials = "LI", size = "md", className }) {
  const sizes = {
    sm: "h-10 w-10 text-[11px]",
    md: "h-12 w-12 text-xs",
    lg: "h-16 w-16 text-sm"
  };

  return (
    <div className={cn("shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#1b1717]", sizes[size], className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-bold text-white">{initials}</div>
      )}
    </div>
  );
}

function ConversationRow({ conversation, active, onClick, presence }) {
  const title = getConversationName(conversation);
  const avatarUrl = getConversationAvatar(conversation);
  const initials = getConversationInitials(conversation);
  const preview = conversation?.lastMessage?.body || conversation?.lastMessageText || "No messages yet.";
  const timeLabel = conversation?.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : "";
  const meta = statusLabel(presence);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border border-white/8 px-4 py-4 text-left transition",
        active ? "border-accent/70 border-l-4 bg-[#1f1515] shadow-[0_12px_30px_rgba(224,36,36,0.08)]" : "border-white/8 bg-[#171414] hover:border-white/15 hover:bg-[#1c1919]"
      )}
    >
      <div className="relative shrink-0">
        <ChatAvatar src={avatarUrl} alt={title} initials={initials} size="sm" />
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#171414]",
            presence?.status === "online" ? "bg-emerald-400" : "bg-white/20"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-bold text-white">{title}</span>
            {conversation?.otherParticipant?.isVerified ? <VerifiedBadge compact /> : null}
          </div>
          <span className={cn("shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em]", meta === "Online" ? "text-emerald-400" : "text-muted")}>{meta || timeLabel}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="truncate text-sm text-muted">{preview}</p>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message, isActiveUser, avatarUrl, initials, presence, isLatest }) {
  const timeLabel = formatMessageTime(message.createdAt);
  const readLabel = message.status === "read" ? "Read" : "Sent";

  return (
    <div className={cn("flex w-full", isActiveUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[70%] items-end gap-2.5", isActiveUser ? "ml-auto flex-row-reverse" : "mr-auto")}> 
        <ChatAvatar
          src={avatarUrl}
          alt={message.sender?.profile?.displayName || message.sender?.usernameDisplay || message.sender?.username || "User"}
          initials={initials}
          size="sm"
          className="mb-0.5"
        />
        <div className={cn("flex flex-col gap-1", isActiveUser ? "items-end text-right" : "items-start text-left")}> 
          <div
            className={cn(
              "rounded-[18px] border px-4 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.16)]",
              isActiveUser
                ? "border-[#ff4d6d]/30 bg-[#ff243f] text-white shadow-[0_12px_26px_rgba(255,36,63,0.2)]"
                : "border-white/10 bg-[#1c1a1a] text-[#ece7e2]"
            )}
          >
            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
          </div>
          <div className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted", isActiveUser ? "justify-end pr-1" : "justify-start pl-1")}>
            <span>{timeLabel}</span>
            {isActiveUser ? <span className={cn(message.status === "sending" ? "text-muted" : "text-[#ff4d6d]")}>{message.status === "sending" ? "Sending" : readLabel}</span> : null}
            {presence?.typing && !isActiveUser && isLatest ? <span className="text-emerald-400">Typing</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#151313] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <MessageSquareText size={28} />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-white">Select a chat</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Your conversations live here. Open a thread to see messages, presence updates, and live activity.
      </p>
    </div>
  );
}

function buildMessageSocketUrl() {
  const baseUrl = new URL(api.defaults.baseURL || "http://localhost:5000/api/v1");
  baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, "")}/messages/ws`;
  return baseUrl;
}

function useMessageSocket({ enabled, currentUserId, onEvent }) {
  const onEventRef = useRef(onEvent);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !currentUserId) {
      return undefined;
    }

    let cancelled = false;

    const clearSocket = () => {
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, "disconnect");
        } catch (error) {
          // Ignore socket close errors during reconnect and teardown.
        }
        socketRef.current = null;
      }
    };

    const connect = () => {
      if (cancelled || typeof window === "undefined") {
        return;
      }

      const token = window.localStorage.getItem("linked_access_token");
      if (!token) {
        return;
      }

      const socketUrl = buildMessageSocketUrl();
      socketUrl.searchParams.set("token", token);

      let socket;
      try {
        socket = new WebSocket(socketUrl.toString());
      } catch (error) {
        reconnectTimerRef.current = window.setTimeout(connect, 3000);
        return;
      }

      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onEventRef.current?.(parsed);
        } catch (error) {
          // Ignore malformed socket payloads.
        }
      };

      socket.onclose = (event) => {
        socketRef.current = null;
        if (cancelled) {
          return;
        }

        const delay = event.code === 4001 || event.code === 4003 ? 5000 : 3000;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        try {
          socket.close();
        } catch (error) {
          // Ignore socket close errors here; onclose will handle reconnection.
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      clearSocket();
    };
  }, [enabled, currentUserId]);

  const sendEvent = useCallback((event) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(event));
    return true;
  }, []);

  return { sendEvent };
}

export default function MessagesWorkspace({ conversationId = null, layout = "split" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.currentUser);
  const messageListRef = useRef(null);
  const messageListNearBottomRef = useRef(true);
  const lastThreadLengthRef = useRef(0);
  const [search, setSearch] = useState("");
  const [body, setBody] = useState("");
  const [presenceByUserId, setPresenceByUserId] = useState({});
  const [typingByConversationId, setTypingByConversationId] = useState({});
  const [mounted, setMounted] = useState(false);
  const typingTimeoutRef = useRef(null);
  const typingResetTimersRef = useRef(new Map());
  const typingStateRef = useRef(false);

  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: async () => {
      const response = await api.get("/messages/conversations");
      return response.data.data;
    },
    enabled: Boolean(currentUser)
  });

  const conversations = useMemo(() => conversationsQuery.data?.items || [], [conversationsQuery.data]);
  const filteredConversations = useMemo(() => {
    if (!search.trim()) {
      return conversations;
    }

    const term = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const title = getConversationName(conversation).toLowerCase();
      const username = getConversationUsername(conversation).toLowerCase();
      const preview = (conversation?.lastMessage?.body || conversation?.lastMessageText || "").toLowerCase();
      return title.includes(term) || username.includes(term) || preview.includes(term);
    });
  }, [conversations, search]);

  const activeConversation = useMemo(() => {
    if (!conversationId) {
      return null;
    }

    return conversations.find((item) => item.id === conversationId) || null;
  }, [conversationId, conversations]);

  const selectedConversationId = conversationId || activeConversation?.id || null;

  const messagesQuery = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      const response = await api.get(`/messages/conversations/${selectedConversationId}/messages`);
      return response.data.data;
    },
    enabled: Boolean(selectedConversationId)
  });

  const threadConversation = messagesQuery.data?.conversation || activeConversation || null;
  const messageItems = messagesQuery.data?.items;
  const threadMessages = useMemo(() => messageItems || [], [messageItems]);
  const currentParticipant = threadConversation?.otherParticipant || activeConversation?.otherParticipant || null;
  const currentParticipantId = currentParticipant?.id || null;
  const currentPresence = currentParticipantId ? presenceByUserId[currentParticipantId] || null : null;
  const typingState = selectedConversationId ? typingByConversationId[selectedConversationId] || false : false;
  const showThread = layout !== "inbox" && Boolean(selectedConversationId);
  const showSidebar = layout !== "thread";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const typingTimers = typingResetTimersRef.current;

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      typingStateRef.current = false;

      for (const timer of typingTimers.values()) {
        window.clearTimeout(timer);
      }

      typingTimers.clear();
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] });
  }, [queryClient, selectedConversationId]);

  useEffect(() => {
    const el = messageListRef.current;
    if (!el) {
      return;
    }

    const shouldStickToBottom = threadMessages.length !== lastThreadLengthRef.current
      ? messageListNearBottomRef.current
      : selectedConversationId !== null;

    if (shouldStickToBottom) {
      el.scrollTop = el.scrollHeight;
    }

    lastThreadLengthRef.current = threadMessages.length;
  }, [selectedConversationId, threadMessages.length]);

  function handleMessageListScroll(event) {
    const el = event.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    messageListNearBottomRef.current = distanceFromBottom < 120;
  }

  function clearTypingIndicator() {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (!selectedConversationId) {
      typingStateRef.current = false;
      return;
    }

    if (typingStateRef.current) {
      typingStateRef.current = false;
      sendEvent({
        type: "typing",
        conversationId: selectedConversationId,
        isTyping: false
      });
    }
  }

  function sendTypingIndicator(isTyping) {
    if (!selectedConversationId) {
      return;
    }

    const nextState = Boolean(isTyping);
    if (typingStateRef.current === nextState && nextState) {
      return;
    }

    typingStateRef.current = nextState;
    sendEvent({
      type: "typing",
      conversationId: selectedConversationId,
      isTyping: nextState
    });
  }

  function scheduleTypingStop() {
    if (!selectedConversationId) {
      return;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      typingTimeoutRef.current = null;
      clearTypingIndicator();
    }, 1500);
  }

  const { sendEvent } = useMessageSocket({
    enabled: mounted && Boolean(currentUser),
    currentUserId: currentUser?.id || null,
    onEvent: (event) => {
      const payload = event.payload || {};

      if (event.type === "message.created" || event.type === "message.read") {
        queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
        if (payload?.conversation?.id) {
          queryClient.invalidateQueries({ queryKey: ["messages", payload.conversation.id] });
        } else if (selectedConversationId) {
          queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] });
        }
      }

      if (event.type === "message.typing" || event.type === "typing") {
        const threadId = payload.conversationId || payload.threadId || selectedConversationId;
        const userId = payload.userId || payload.actorId || null;
        if (threadId && userId) {
          const existingTimer = typingResetTimersRef.current.get(threadId);
          if (existingTimer) {
            window.clearTimeout(existingTimer);
            typingResetTimersRef.current.delete(threadId);
          }

          if (payload.isTyping === false) {
            setTypingByConversationId((current) => ({
              ...current,
              [threadId]: false
            }));
            return;
          }

          setTypingByConversationId((current) => ({
            ...current,
            [threadId]: true
          }));

          const timer = window.setTimeout(() => {
            setTypingByConversationId((current) => ({
              ...current,
              [threadId]: false
            }));
            typingResetTimersRef.current.delete(threadId);
          }, 2500);

          typingResetTimersRef.current.set(threadId, timer);
        }
      }

      if (event.type === "presence.online" || event.type === "presence.offline" || event.type === "presence.last_seen") {
        const userId = payload.userId || payload.actorId || null;
        if (!userId) {
          return;
        }

        setPresenceByUserId((current) => ({
          ...current,
          [userId]: {
            status:
              event.type === "presence.online"
                ? "online"
                : event.type === "presence.offline"
                  ? "offline"
                  : current[userId]?.status || "offline",
            lastSeenAt: payload.lastSeenAt || payload.last_seen_at || current[userId]?.lastSeenAt || null,
            typing: payload.typing ?? current[userId]?.typing ?? false
          }
        }));
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ body: nextBody }) => {
      const response = await api.post(`/messages/conversations/${selectedConversationId}/messages`, {
        body: nextBody
      });
      return response.data.data;
    },
    onMutate: async ({ body: nextBody, clientMessageId }) => {
      const optimisticMessage = buildOptimisticMessage(nextBody, clientMessageId);      setBody("");
      clearTypingIndicator();

      await queryClient.cancelQueries({ queryKey: ["messages", selectedConversationId] });

      const previousConversation = queryClient.getQueryData(["messages", selectedConversationId]);

      queryClient.setQueryData(["messages", selectedConversationId], (current) => {
        if (!current) {
          return current;
        }

        const items = current.items || [];
        const filtered = items.filter((item) => item.clientMessageId !== clientMessageId);

        return {
          ...current,
          items: [...filtered, optimisticMessage]
        };
      });

      return { clientMessageId, previousConversation };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousConversation) {
        queryClient.setQueryData(["messages", selectedConversationId], context.previousConversation);
      }
    },
    onSuccess: (message, variables, context) => {
      queryClient.setQueryData(["messages", selectedConversationId], (current) => {
        const source = current || context?.previousConversation || null;
        if (!source) {
          return source;
        }

        const items = source.items || [];
        const filtered = items.filter((item) => item.clientMessageId !== variables?.clientMessageId && item.id !== message.id);

        return {
          ...source,
          items: [...filtered, message]
        };
      });

      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    },
    onSettled: () => {
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    }
  });

  function handleOpenConversation(conversation) {
    if (!conversation?.id) {
      return;
    }

    router.push(`/messages/${conversation.id}`);
  }

  function handleComposerChange(event) {
    setBody(event.target.value);
    sendTypingIndicator(true);
    scheduleTypingStop();
  }

  function handleComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function handleSendMessage() {
    const trimmed = body.trim();
    if (!selectedConversationId || !trimmed) {
      return;
    }

    sendMessageMutation.mutate({ body: trimmed, clientMessageId: `${Date.now()}-${Math.random().toString(16).slice(2)}` });
  }

  const activeConversationTitle = getConversationName(threadConversation);
  const activeConversationInitials = getConversationInitials(threadConversation);
  const activeConversationAvatar = getConversationAvatar(threadConversation);
  const activeConversationUsername = getConversationUsername(threadConversation);
  const activeConversationStatus = statusLabel(currentPresence);
  const currentUserAvatar = currentUser?.profile?.avatarMedia?.secureUrl || "";
  const currentUserInitials = (currentUser?.profile?.displayName || currentUser?.usernameDisplay || currentUser?.username || "LI").slice(0, 2).toUpperCase();
  function buildOptimisticMessage(nextBody, clientMessageId) {
    return {
      id: `temp-${clientMessageId}`,
      clientMessageId,
      body: nextBody,
      createdAt: new Date().toISOString(),
      status: "sending",
      senderId: currentUser?.id,
      sender: currentUser,
      recipient: currentParticipant
    };
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-5 overflow-hidden lg:flex-row">
      <aside className={cn("min-h-0 space-y-4 lg:w-[380px] lg:shrink-0", showThread ? "hidden lg:block" : "block")}>
        <section className="panel panel-reveal flex h-full min-h-0 flex-col overflow-hidden bg-[#141212]">
          <div className="border-b border-white/8 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="editorial-title text-3xl font-black text-white">Chats</div>
                <p className="mt-2 text-sm text-muted">Your current and past conversations.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <MessageSquareText size={20} />
              </div>
            </div>
            <div className="relative mt-4">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="h-12 rounded-[16px] border border-white/8 bg-[#0f0d0d] pl-10 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 space-y-2 overflow-y-auto p-3">
            {conversationsQuery.isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-[18px] bg-white/5 skeleton-shimmer" />
                ))}
              </div>
            ) : filteredConversations.length ? (
              filteredConversations.map((conversation) => {
                const presence = presenceByUserId[conversation?.otherParticipant?.id] || null;
                return (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={selectedConversationId === conversation.id}
                    unreadCount={conversation.unreadCount || 0}
                    presence={presence}
                    onClick={() => handleOpenConversation(conversation)}
                  />
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/10 p-6 text-sm text-muted">
                No chats yet. When you start talking to someone, the thread appears here.
              </div>
            )}
          </div>
        </section>
      </aside>

      <section className={cn("panel panel-reveal flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#141212]", showThread ? "flex" : "hidden lg:flex")}>
        {threadConversation ? (
          <>
            <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 border-b border-white/8 bg-[#141212]/95 px-4 py-4 backdrop-blur-xl md:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/messages")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-[#0f0d0d] text-muted transition hover:border-white/15 hover:text-white"
                  aria-label="Back to messages"
                >
                  <ArrowLeft size={18} />
                </button>
                <ChatAvatar
                  src={activeConversationAvatar || currentUserAvatar}
                  alt={activeConversationTitle}
                  initials={activeConversationInitials || currentUserInitials}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-lg font-black tracking-tight text-white">{activeConversationTitle}</h1>
                    {threadConversation?.otherParticipant?.isVerified ? <VerifiedBadge compact /> : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <span className="truncate">@{activeConversationUsername || currentUser?.username || "linked"}</span>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span className={cn(activeConversationStatus === "Online" ? "text-emerald-400" : "text-muted")}>{activeConversationStatus || "Offline"}</span>
                  </div>
                </div>
              </div>
            </header>

            <div ref={messageListRef} onScroll={handleMessageListScroll} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 md:px-6">
              {messagesQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className={cn("flex gap-3", index % 2 ? "justify-end" : "justify-start")}>
                      <div className="h-10 w-10 rounded-full bg-white/5 skeleton-shimmer" />
                      <div className="h-20 w-[70%] rounded-[22px] bg-white/5 skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              ) : threadMessages.length ? (
                threadMessages.map((message, index) => {
                  const isActiveUser = message.senderId === currentUser?.id;
                  const author = getMessageAuthor(message, currentUser?.id);
                  const avatarUrl = isActiveUser ? currentUserAvatar : author?.profile?.avatarMedia?.secureUrl || activeConversationAvatar;
                  const initials = isActiveUser
                    ? currentUserInitials
                    : (author?.profile?.displayName || author?.usernameDisplay || author?.username || "LI").slice(0, 2).toUpperCase();
                  const isLatest = index === threadMessages.length - 1;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      currentUser={currentUser}
                      isActiveUser={isActiveUser}
                      avatarUrl={avatarUrl}
                      initials={initials}
                      presence={currentPresence}
                      isLatest={isLatest}
                    />
                  );
                })
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-muted">
                  <Sparkles size={28} className="text-accent" />
                  <h2 className="mt-4 text-2xl font-black text-white">Start the conversation</h2>
                  <p className="mt-2 max-w-md text-sm">
                    Send the first message and the thread will stay live here with presence and typing updates.
                  </p>
                </div>
              )}
            </div>

            <footer className="sticky bottom-3 z-20 shrink-0 border-t border-white/8 bg-[#0b0b0b]/95 px-4 py-4 backdrop-blur-xl md:bottom-0 md:px-6">
              {typingState ? <div className="mb-3 text-sm text-emerald-400">Typing...</div> : null}
              <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-[28px] border border-white/10 bg-[#121212] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f1f1f] text-muted transition hover:text-white" aria-label="Add attachment">
                  <Plus size={18} />
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f1f1f] text-muted transition hover:text-white" aria-label="Add image">
                  <ImagePlus size={18} />
                </button>
                <div className="relative flex-1">
                  <Input
                    value={body}
                    onChange={handleComposerChange}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Type a message..."
                    className="h-12 w-full border-0 bg-transparent px-4 text-sm text-white placeholder:text-[#6f6f6f] focus-visible:ring-0"
                  />
                </div>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f1f1f] text-muted transition hover:text-white" aria-label="Emoji picker">
                  <Smile size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!body.trim() || !selectedConversationId || !canMessageCurrentThread}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff243f] text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 p-4 md:p-6">
            <EmptyState />
          </div>
        )}
      </section>

      {!showThread && layout === "split" ? (
        <div className="lg:hidden">
          <EmptyState />
        </div>
      ) : null}
    </div>
  );
}


