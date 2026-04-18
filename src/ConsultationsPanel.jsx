import { useState, useEffect, useRef } from 'react';
import { ChefHat, Plus, Trash2, Send, Loader2, MessageCircle } from 'lucide-react';
import { api } from './lib/api.js';

export default function ConsultationsPanel() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [waitingForChef, setWaitingForChef] = useState(false);
  const historyEndRef = useRef(null);

  const selected = threads.find(t => t.id === selectedId);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listConsultations();
        setThreads(list);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected?.messages?.length, waitingForChef]);

  const newThread = async () => {
    try {
      const created = await api.createConsultation();
      setThreads([created, ...threads]);
      setSelectedId(created.id);
      setMessage('');
    } catch (e) {
      alert('Could not start a new conversation: ' + e.message);
    }
  };

  const deleteThread = async (id) => {
    const t = threads.find(x => x.id === id);
    if (!t) return;
    if (!confirm(`Delete "${t.title}"?`)) return;
    try {
      await api.deleteConsultation(id);
      setThreads(threads.filter(x => x.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const send = async () => {
    if (!selected || !message.trim()) return;
    const msg = message.trim();
    setMessage('');
    setWaitingForChef(true);
    try {
      const updated = await api.chatConsultation(selected.id, msg);
      // Move updated thread to top of list (most recently updated)
      setThreads([updated, ...threads.filter(t => t.id !== updated.id)]);
    } catch (e) {
      alert('Chef is busy in the back. ' + e.message);
    }
    setWaitingForChef(false);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Thread list */}
      <aside className="bg-white rounded-lg border border-stone-200 p-3 h-fit lg:sticky lg:top-28">
        <button
          onClick={newThread}
          className="w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-900 text-white text-sm font-medium py-2 rounded-md transition-colors mb-3"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
        {threads.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-6 px-2">
            No conversations yet. Start one to ask Matteo about techniques, pairings, or anything sandwich-related.
          </p>
        ) : (
          <ul className="space-y-1">
            {threads.map(t => {
              const msgCount = (t.messages || []).length;
              return (
                <li key={t.id} className="group relative">
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-3 py-2 pr-8 rounded-md text-sm transition-colors ${
                      selectedId === t.id
                        ? 'bg-red-50 text-red-900 font-medium'
                        : 'hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="truncate">{t.title}</div>
                    {msgCount > 0 && (
                      <div className="text-xs text-stone-400 mt-0.5">
                        {Math.floor(msgCount / 2)} exchange{msgCount === 2 ? '' : 's'}
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                    title="Delete conversation"
                    className="absolute right-1 top-1.5 p-1 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-700 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Chat view */}
      <main className="min-w-0">
        {selected ? (
          <ChatView
            thread={selected}
            message={message}
            setMessage={setMessage}
            onSend={send}
            waitingForChef={waitingForChef}
            historyEndRef={historyEndRef}
          />
        ) : (
          <WelcomeState onNewThread={newThread} hasThreads={threads.length > 0} />
        )}
      </main>
    </div>
  );
}

function ChatView({ thread, message, setMessage, onSend, waitingForChef, historyEndRef }) {
  const messages = thread.messages || [];
  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{thread.title}</div>
          <div className="text-xs text-stone-300">Chef Matteo · Bologna · 25 years of panini</div>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <MessageCircle className="w-10 h-10 text-stone-300 mb-3" />
            <p className="text-sm text-stone-600 max-w-md">
              Ask Matteo anything. Ingredient pairings, spread combinations, oil choices, technique questions, supplier advice — whatever you're turning over.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                "Does olive oil work with mortadella spread?",
                "How do I keep tomatoes from making bread soggy?",
                "What cheese pairs with fig jam and prosciutto?",
                "How long can I hold focaccia dough before baking?",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(suggestion)}
                  className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-stone-100 rounded-lg px-3 py-2 text-sm max-w-[85%] text-stone-800 whitespace-pre-wrap">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-700 flex-shrink-0 flex items-center justify-center">
                    <ChefHat className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-stone-800 whitespace-pre-wrap leading-relaxed max-w-[85%]">
                    {m.content}
                  </div>
                </div>
              )
            ))}
            {waitingForChef && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-red-700 flex-shrink-0 flex items-center justify-center">
                  <ChefHat className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-stone-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Matteo is thinking...
                </div>
              </div>
            )}
            <div ref={historyEndRef}></div>
          </div>
        )}
      </div>

      <div className="border-t border-stone-100 p-4">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend();
            }}
            placeholder="Ask Matteo anything... (Cmd/Ctrl+Enter to send)"
            rows={2}
            className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent resize-none"
          />
          <button
            onClick={onSend}
            disabled={!message.trim() || waitingForChef}
            className="bg-red-800 hover:bg-red-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white px-4 rounded-md transition-colors flex items-center"
            title="Send (Cmd/Ctrl+Enter)"
          >
            {waitingForChef ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeState({ onNewThread, hasThreads }) {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
      <MessageCircle className="w-12 h-12 mx-auto text-stone-300 mb-3" />
      <h3 className="text-lg font-semibold text-stone-700 mb-1">
        {hasThreads ? 'Pick a conversation' : 'Have a question for Matteo?'}
      </h3>
      <p className="text-sm text-stone-500 max-w-md mx-auto mb-5">
        {hasThreads
          ? 'Select one on the left, or start a new one.'
          : "This is where you chat with Matteo about anything not tied to a specific recipe — technique, pairings, suppliers, spread combinations, anything."}
      </p>
      {!hasThreads && (
        <button
          onClick={onNewThread}
          className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Start a conversation
        </button>
      )}
    </div>
  );
}
