'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'ai'; text: string };

export function WebChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hi! I\'m the AGRON AI agent. Ask me about crop diseases, the marketplace, or how to get started with Agron.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('https://portal.agron.uk/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, country: 'UG' }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'ai', text: data.message ?? 'Sorry, I could not respond.' }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-5 z-50 w-13 h-13 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #00E87A 0%, #00A855 100%)',
        }}
        aria-label="Open AGRON AI"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.338 2.698H4.136c-1.368 0-2.337-1.698-1.338-2.698L4.2 15.3" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-36 right-5 z-50 w-80 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'rgba(10,20,12,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0,232,122,0.2)',
            maxHeight: '65vh',
          }}
        >
          <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(0,232,122,0.1)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.3)' }}>
              <svg className="w-4 h-4" fill="none" stroke="#00E87A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.338 2.698H4.136c-1.368 0-2.337-1.698-1.338-2.698L4.2 15.3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#DCF5E2' }}>AGRON AI Agent</p>
              <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Powered by Agron AI</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E87A] animate-pulse" />
              <span className="text-[10px]" style={{ color: '#00E87A' }}>Live</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0, maxHeight: '45vh' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={m.role === 'user'
                    ? { background: 'rgba(0,232,122,0.15)', color: '#DCF5E2', borderRadius: '16px 16px 4px 16px', border: '1px solid rgba(0,232,122,0.2)' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#7CB87E', borderRadius: '16px 16px 16px 4px', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: '#00E87A', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about crops or farming..."
              className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#DCF5E2',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: 'rgba(0,232,122,0.15)', color: '#00E87A', border: '1px solid rgba(0,232,122,0.2)' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
