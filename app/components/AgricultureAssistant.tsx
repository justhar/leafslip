import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Leaf, X, MessageCircle, Send, Loader2 } from "lucide-react";

export default function AgricultureAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([
    {
      role: "bot",
      text: "Halo! Saya asisten UMKM Leafslip. Butuh bantuan mengelola stok, mencegah overstocking, atau membaca data penjualan?",
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
      // Correctly initialize GoogleGenAI with the API key from environment
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use gemini-3-pro-preview for complex advisor/reasoning tasks
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: userMsg,
        config: {
          systemInstruction:
            "Kamu adalah Leafslip AI, konsultan UMKM di Indonesia. Bantu pemilik usaha mengoptimalkan stok, mencegah overstocking, dan memahami data penjualan dari struk. Gunakan Bahasa Indonesia yang profesional namun santai. Gunakan Rupiah (Rp) dan konteks lokal bila relevan.",
        },
      });

      // Directly access .text property from GenerateContentResponse
      const botText =
        response.text ||
        "Maaf, saya belum bisa memprosesnya. Bisa coba lagi?";
      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Layanan sementara tidak tersedia. Coba lagi nanti ya.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      {isOpen ? (
        <div className="bg-white rounded-3xl shadow-2xl w-[350px] md:w-[400px] flex flex-col overflow-hidden border border-gray-300 h-[500px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="bg-[#2D3E2D] p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-[#D9ED92] text-[#2D3E2D] p-1.5 rounded-lg">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Advisor Leafslip</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-gray-300">Aktif</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-[#2D3E2D] text-white rounded-tr-none"
                      : "bg-white text-gray-700 border border-gray-300 rounded-tl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-300 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2D3E2D]" />
                  <span className="text-xs text-gray-400">
                    Advisor sedang berpikir...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-300">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tanya soal stok atau penjualan..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-[#D9ED92] transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-[#D9ED92] text-[#2D3E2D] p-2.5 rounded-xl hover:brightness-95 disabled:opacity-50 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#2D3E2D] text-[#D9ED92] p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-[#2D3E2D] px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Advisor Digital Siap Membantu
          </div>
        </button>
      )}
    </div>
  );
}
