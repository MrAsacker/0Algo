"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Trash2,
  User,
  Bot,
  Settings,
  Key,
  ChevronDown,
  Check,
  Lock,
  History as HistoryIcon,
  StopCircle,
  Grip,
  Sparkles,
  Zap,
  Cpu,
  Globe,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useUser, useSession } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { Claude, Gemini, OpenAI } from "@lobehub/icons";
import { toast } from "sonner";

// --- CONFIG ---
const MODELS = [
  {
    id: "gemini-3.1-flash",
    name: "Gemini 3.1-Flash",
    provider: "Google",
    icon: Gemini.Color,
    color: "text-blue-400",
  },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", icon: OpenAI, color: "text-white-400" },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    icon: Claude.Color,
    color: "text-orange-400",
  },
  { id: "kimi-k2.6", name: "Kimi", provider: "Moonshot", icon: Sparkles, color: "text-violet-500" },
] as const;

type ModelId = (typeof MODELS)[number]["id"];
interface Message {
  role: "user" | "assistant";
  content: string;
}
interface ApiKeys {
  gemini: string;
  openai: string;
  anthropic: string;
  kimi: string;
}

// --- SETTINGS MODAL ---
const SettingsModal = ({
  isOpen,
  onClose,
  keys,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeys;
  onSave: (k: ApiKeys) => void;
}) => {
  const [localKeys, setLocalKeys] = useState(keys);
  useEffect(() => {
    setLocalKeys(keys);
  }, [keys]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-zinc-950/95 flex items-center justify-center p-4 fade-in">
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Settings size={16} /> API Settings
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-200 flex gap-2">
              <Lock size={14} className="shrink-0 mt-0.5" />
              Keys stored in Clerk (secure & synced).
            </p>
          </div>

          {["gemini", "openai", "anthropic", "kimi"].map((provider) => (
            <div key={provider}>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">
                {provider} Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 pl-8 text-sm text-white focus:border-green-500 outline-none"
                  placeholder={`sk-...`}
                  value={(localKeys as any)[provider] || ""}
                  onChange={(e) => setLocalKeys({ ...localKeys, [provider]: e.target.value })}
                />
                <Key size={14} className="absolute left-2.5 top-2.5 text-zinc-600" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <button
            onClick={() => {
              onSave(localKeys);
              toast.success("API Keys saved successfully!");
              onClose();
            }}
            className="w-full bg-white text-black font-bold py-2 rounded hover:bg-zinc-200 transition"
          >
            Save Configurations
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN WIDGET ---
export default function GlobalChatWidget() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini-3.1-flash");
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: "",
    openai: "",
    anthropic: "",
    kimi: "",
  });
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // Resize State
  const [size, setSize] = useState({ width: 400, height: 600 });
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- RESIZE HANDLER ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    isResizing.current = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    if (containerRef.current) {
      containerRef.current.style.transition = "none";
    }

    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const deltaX = startX - e.clientX;
      const deltaY = startY - e.clientY;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const newWidth = Math.max(320, Math.min(startWidth + deltaX, window.innerWidth - 20));
        const newHeight = Math.max(400, Math.min(startHeight + deltaY, window.innerHeight - 20));

        if (containerRef.current) {
          containerRef.current.style.width = `${newWidth}px`;
          containerRef.current.style.height = `${newHeight}px`;
        }
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      isResizing.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      if (containerRef.current) {
        containerRef.current.style.transition = "";
      }

      const deltaX = startX - e.clientX;
      const deltaY = startY - e.clientY;
      setSize({
        width: Math.max(320, Math.min(startWidth + deltaX, window.innerWidth - 20)),
        height: Math.max(400, Math.min(startHeight + deltaY, window.innerHeight - 20)),
      });
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "nw-resize";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // --- DATA LOADING ---
  useEffect(() => {
    if (!isLoaded || !user) return;
    const meta = (user.unsafeMetadata as any)?.api_keys;
    if (meta) setApiKeys(meta);

    const loadHistory = async () => {
      const token = await session?.getToken({ template: "supabase" });
      if (!token) return;
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );
      const { data } = await sb
        .from("user_chats")
        .select("messages")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.messages) setMessages(data.messages as any);
      else
        setMessages([
          {
            role: "assistant",
            content: "Hi! I'm your coding assistant. Add your API keys in settings to start.",
          },
        ]);
    };
    loadHistory();
  }, [isLoaded, user]);

  // --- SAVING ---
  const saveKeys = async (k: ApiKeys) => {
    if (!user) return;
    await user.update({ unsafeMetadata: { ...user.unsafeMetadata, api_keys: k } });
    setApiKeys(k);
  };

  const saveHistory = async (msgs: Message[]) => {
    if (!user || !session) return;
    const token = await session.getToken({ template: "supabase" });
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );
    await sb.from("user_chats").upsert(
      {
        user_id: user.id,
        messages: msgs.slice(-20),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  };

  // --- SEND HANDLER ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: "user", content: input } as Message];
    setMessages(newMsgs);
    saveHistory(newMsgs);
    setInput("");
    setIsLoading(true);

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const assistantMsgIndex = newMsgs.length;
    setMessages([...newMsgs, { role: "assistant", content: "" }]);

    try {
      let resText = "";

      const updateMessage = (text: string) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantMsgIndex] = { role: "assistant", content: text };
          return updated;
        });
      };

      if (selectedModel === "gemini-3.1-flash") {
        if (!apiKeys.gemini) throw new Error("Missing Gemini API Key");
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:streamGenerateContent?key=${apiKeys.gemini}&alt=sse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: input }] }] }),
          }
        );
        if (!res.ok) throw new Error("Gemini Error");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (reader) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let chunkAddedText = false;
          for (const line of lines) {
            if (line.trim().startsWith("data: ") && line.trim() !== "data: [DONE]") {
              try {
                const d = JSON.parse(line.trim().substring(6));
                const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (text) {
                  resText += text;
                  chunkAddedText = true;
                }
              } catch (e) {}
            }
          }
          if (chunkAddedText) {
            updateMessage(resText);
          }
        }
      } else {
        // OpenAI/Moonshot Proxy
        const apiKey = selectedModel.includes("kimi")
          ? apiKeys.kimi?.trim()
          : apiKeys.openai?.trim();
        if (!apiKey) throw new Error(`Missing API Key`);

        const res = await fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: selectedModel.includes("kimi")
              ? "https://api.moonshot.ai/v1/chat/completions"
              : "https://api.openai.com/v1/chat/completions",
            body: {
              model: selectedModel === "kimi-k2.6" ? "kimi-k2.6" : "gpt-4o",
              messages: newMsgs,
              stream: true,
            },
            headers: { Authorization: `Bearer ${apiKey}` },
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Proxy Error");
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (reader) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let chunkAddedText = false;
          for (const line of lines) {
            if (line.trim().startsWith("data: ") && line.trim() !== "data: [DONE]") {
              try {
                const d = JSON.parse(line.trim().substring(6));
                const text = d.choices?.[0]?.delta?.content || "";
                if (text) {
                  resText += text;
                  chunkAddedText = true;
                }
              } catch (e) {}
            }
          }
          if (chunkAddedText) {
            updateMessage(resText);
          }
        }
      }

      const finalMsgs = [...newMsgs, { role: "assistant", content: resText } as Message];
      setMessages(finalMsgs);
      saveHistory(finalMsgs);
    } catch (e: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMsgIndex] = { role: "assistant", content: `Error: ${e.message}` };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
    }
  }, [isOpen]);

  if (!isLoaded || !user) return null;

  const activeModel = MODELS.find((m) => m.id === selectedModel)!;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end">
      {isOpen && (
        <div
          ref={containerRef}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-4 duration-200"
          style={{ width: size.width, height: size.height }}
        >
          {/* --- RESIZE HANDLE (Top-Left Corner) --- */}
          <div
            className="absolute top-0 left-0 w-8 h-8 cursor-nw-resize z-[100] flex items-center justify-center group"
            onMouseDown={handleMouseDown}
          >
            <Grip className="text-zinc-600 w-4 h-4 -rotate-45 group-hover:text-white transition-colors" />
          </div>

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            keys={apiKeys}
            onSave={saveKeys}
          />

          {/* HEADER: Fixed Height */}
          <div className="flex-none h-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur flex justify-between items-center px-4 pl-8 z-20 select-none">
            <div className="relative">
              <button
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-2 hover:bg-zinc-800 p-1.5 rounded-lg transition"
              >
                <activeModel.icon size={16} className={activeModel.color} />
                <span className="text-sm font-medium text-white">{activeModel.name}</span>
                <ChevronDown size={14} className="text-zinc-500" />
              </button>
              {isModelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id as any);
                        setIsModelMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-left"
                    >
                      <m.icon size={16} className={m.color} />{" "}
                      <span className="text-sm text-zinc-200">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => {
                  if (messages.length === 0) {
                    toast.info("History is already cleared.");
                    return;
                  }
                  toast.warning("Clear all chat history?", {
                    description: "This action cannot be undone.",
                    action: {
                      label: "Clear",
                      onClick: () => {
                        setMessages([]);
                        saveHistory([]);
                      },
                    },
                    cancel: {
                      label: "Cancel",
                      onClick: () => {},
                    },
                    duration: 6000,
                  });
                }}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* BODY: Flexible Height + Scrollable */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 bg-zinc-950 custom-scrollbar relative"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded center flex items-center justify-center ${msg.role === "user" ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}
                >
                  {msg.role === "user" ? <User size={16} /> : <activeModel.icon size={16} />}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed overflow-hidden ${msg.role === "user" ? "bg-white text-black" : "bg-zinc-900 text-zinc-300 border border-zinc-800"}`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeHighlight, rehypeKatex]}
                        components={{
                          pre: ({ children }) => (
                            <div className="not-prose my-2 overflow-hidden rounded-lg border border-zinc-700 bg-[#282a36]">
                              <div className="overflow-x-auto p-3">{children}</div>
                            </div>
                          ),
                          code: ({ node, inline, className, children, ...props }: any) => {
                            if (inline)
                              return (
                                <code className="bg-zinc-800 text-blue-300 px-1 rounded border border-zinc-700">
                                  {children}
                                </code>
                              );
                            return (
                              <code className={`${className} text-xs font-mono`} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-center text-zinc-500 text-xs ml-12">
                <Loader2 className="animate-spin" size={12} /> Generatng...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* FOOTER: Fixed Height */}
          <div className="flex-none p-3 border-t border-zinc-800 bg-zinc-900 z-20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-1 focus-within:border-zinc-600 transition"
            >
              <input
                className="flex-1 bg-transparent px-3 outline-none text-sm text-white placeholder-zinc-600 h-10"
                placeholder={`Message ${activeModel.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-white hover:bg-zinc-200 text-black rounded-lg disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 transition"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="text-[10px] text-zinc-600 text-center mt-2 flex justify-center gap-1 items-center">
              <Lock size={10} /> Encrypted & Private
            </div>
          </div>
        </div>
      )}

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-white hover:bg-zinc-200 text-black rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-[200]"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
