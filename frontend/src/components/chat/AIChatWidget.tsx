'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'

interface Msg { role: 'user' | 'assistant'; content: string; ts: Date }

const QUICK = ['Track my order', 'Cancel order', 'Return policy?']

export function AIChatWidget() {
  const { call } = useApi()
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: "Hi! I'm your Mallo Concierge. I can track orders, handle cancellations, and explain brand policies. How can I help?",
    ts: new Date(),
  }])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80) }, [open])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Msg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Build history from prior messages (excluding initial greeting)
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const data = await call<{ response: string }>('ai/chat', {
        method: 'POST',
        body: { message: text, history },
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, ts: new Date() }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble right now. Please try again shortly.", ts: new Date() },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, call])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const fmt = (d: Date) => new Intl.DateTimeFormat('en', { timeStyle: 'short' }).format(d)

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Concierge"
        className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <Sparkles size={22} className="text-brand-700 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-surface" />
      </button>

      {/* Chat panel — z-index below Clerk/Stripe modals (9999) */}
      {open && (
        <div className="fixed bottom-6 left-6 z-[9990] w-96 h-[520px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-surface-1 animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border-b border-white/5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
              <Sparkles size={14} className="text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Mallo Concierge</p>
              <p className="text-xs text-stone-500">AI-powered • Always on</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-stone-500 hover:text-[#6b4f7a] transition-colors">
              <X size={17} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user' ? 'chat-user' : 'chat-ai'
                }`}>
                  {m.content}
                  <p className="text-[10px] text-stone-600 mt-1">{fmt(m.ts)}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="chat-ai rounded-xl px-3 py-2 text-sm text-[#6b4f7a] flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
            {QUICK.map(p => (
              <button
                key={p}
                onClick={() => { setInput(p); inputRef.current?.focus() }}
                className="flex-shrink-0 text-xs px-3 py-1 rounded-full bg-surface-3 border border-white/10 hover:border-brand-700 text-stone-400 hover:text-stone-200 transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 p-3 border-t border-white/5 bg-surface-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask me anything…"
              className="flex-1 bg-surface-3 border border-white/10 rounded-xl px-3 py-2 text-sm text-stone-600 placeholder-stone-600 focus:outline-none focus:border-brand-700 transition-colors"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send size={14} className="text-[#6b4f7a]" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
