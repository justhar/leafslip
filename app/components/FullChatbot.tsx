"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, User, Bot, Trash2 } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/app/actions/chat";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FullChatbot() {
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([
    {
      role: "bot",
      text: "Halo! Saya Advisor Bisnis Leafslip Anda. Bagaimana saya bisa membantu mengoptimalkan bisnis Anda hari ini?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    try {
      const history: ChatMessage[] = [
        ...messages,
        { role: "user", text: userMsg },
      ]
        .map((message) => ({
          role: message.role === "bot" ? "assistant" : "user",
          content: message.text,
        }))
        .slice(-10);

      const botText = await sendChatMessage(history);
      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Layanan sedang tidak tersedia." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] lg:h-screen bg-white overflow-hidden animate-in fade-in duration-500">
      {/* Integrated Header */}
      <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-300 flex items-center justify-between bg-white z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-[#2D3E2D] rounded flex items-center justify-center text-[#D9ED92] border border-gray-200">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xs lg:text-sm font-bold text-[#2D3E2D] uppercase tracking-widest">
              Advisor Bisnis
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                Aktif
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() =>
            setMessages([
              { role: "bot", text: "Chat direset. Ada yang bisa saya bantu?" },
            ])
          }
          className="p-2 text-gray-300 hover:text-red-500 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Chat Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 lg:space-y-8 hide-scrollbar"
      >
        <div className="mx-auto space-y-6 lg:space-y-8">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-1`}
            >
              <div
                className={`flex gap-3 lg:gap-4 max-w-[95%] lg:max-w-[85%] ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 lg:w-8 lg:h-8 rounded flex-shrink-0 flex items-center justify-center border ${
                    m.role === "user"
                      ? "bg-[#D9ED92]/20 border-[#D9ED92]/50 text-[#2D3E2D]"
                      : "bg-gray-50 border-gray-300 text-gray-400"
                  }`}
                >
                  {m.role === "user" ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div
                  className={`px-4 py-2.5 text-[11px] lg:text-sm leading-relaxed border ${
                    m.role === "user"
                      ? "bg-[#2D3E2D] text-white border-[#2D3E2D] rounded-lg"
                      : "bg-white text-gray-700 border-gray-300 rounded-lg"
                  }`}
                >
                  {m.role === "bot" ? (
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 lg:gap-4 max-w-[80%] items-center">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded bg-gray-50 border border-gray-300 flex items-center justify-center">
                  <Bot size={12} />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Menganalisis...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar */}
      <div className="px-4 lg:px-6 py-4 lg:py-6 border-t border-gray-300 bg-white shrink-0">
        <div className=" mx-auto flex gap-2 lg:gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ketik pesan..."
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 lg:py-3 text-[#2D3E2D] text-[12px] lg:text-sm outline-none focus:border-[#D9ED92] transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-[#2D3E2D] text-[#D9ED92] px-4 rounded font-bold hover:brightness-125 disabled:opacity-20 transition-all active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
