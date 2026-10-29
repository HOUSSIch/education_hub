import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: string[];
  actions?: string[];
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'ai',
    content: "Bonjour Alice ! Je suis votre assistant éducatif IA. Je peux vous aider à comprendre vos cours, générer des exercices personnalisés, analyser vos documents et répondre à toutes vos questions académiques. Comment puis-je vous aider aujourd'hui ?",
    timestamp: new Date(),
    actions: ['Générer des exercices', 'Analyser un document', 'Expliquer un concept'],
  },
];

const suggestions = [
  { icon: '💡', text: 'Explique-moi les arbres AVL', category: 'Concept' },
  { icon: '⚡', text: 'Génère 5 exercices sur la complexité', category: 'Exercices' },
  { icon: '📄', text: 'Résume mon cours de Machine Learning', category: 'Résumé' },
  { icon: '🔍', text: 'Donne-moi un exemple de quicksort', category: 'Exemple' },
];

const conversationHistory = [
  { id: 'h1', title: 'Arbres binaires - Explications', date: 'Aujourd\'hui', active: true },
  { id: 'h2', title: 'Régression linéaire multiple', date: 'Hier' },
  { id: 'h3', title: 'Optimisation SQL avancée', date: '12 Jan' },
  { id: 'h4', title: 'Introduction au ML profond', date: '10 Jan' },
  { id: 'h5', title: 'Complexité algorithmique', date: '8 Jan' },
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>✦</div>
      <div className="chat-ai" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#818cf8',
            animation: `bounce 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string = input.trim()) => {
    if (!text) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses: Record<string, { content: string; sources?: string[]; actions?: string[] }> = {
        default: {
          content: `Excellente question ! Voici une explication détaillée :\n\nLes **arbres binaires de recherche (ABR)** sont des structures de données hiérarchiques où chaque nœud possède au maximum deux enfants.\n\n**Propriété fondamentale :**\n- Tous les nœuds du sous-arbre gauche sont < au nœud courant\n- Tous les nœuds du sous-arbre droit sont > au nœud courant\n\n**Complexité temporelle :**\n- Recherche : O(log n) en moyenne, O(n) au pire\n- Insertion : O(log n) en moyenne\n- Suppression : O(log n) en moyenne\n\nVoulez-vous que je génère des exercices pratiques sur ce sujet ?`,
          sources: ['Chapitre 4 — Algorithmes & Structures de données', 'CLRS — Introduction to Algorithms, p.286'],
          actions: ['Générer des exercices', 'Expliquer les arbres AVL', 'Voir un exemple de code'],
        },
      };
      const resp = responses.default;
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        content: resp.content,
        timestamp: new Date(),
        sources: resp.sources,
        actions: resp.actions,
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (content: string) => {
    const parts = content.split('\n');
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <div key={i} style={{ fontWeight: 700, color: '#f1f5f9', marginTop: 8, marginBottom: 4 }}>{part.slice(2, -2)}</div>;
      }
      if (part.startsWith('- ')) {
        return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 8, marginBottom: 4 }}>
          <span style={{ color: '#6366f1' }}>•</span>
          <span>{part.slice(2)}</span>
        </div>;
      }
      if (part === '') return <div key={i} style={{ height: 6 }} />;
      return <span key={i}>{part}{'\n'}</span>;
    });
  };

  return (
    <AppLayout role="learner">
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#07070f' }}>
        {/* History sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 240, background: '#0c0c18',
            borderRight: '1px solid rgba(99,102,241,0.08)',
            display: 'flex', flexDirection: 'column',
            flexShrink: 0,
          }}>
            <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: 13 }}>
                + Nouvelle conversation
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }} className="scrollbar-custom">
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, padding: '8px 8px 4px', letterSpacing: '0.06em' }}>
                AUJOURD'HUI
              </div>
              {conversationHistory.map(conv => (
                <button key={conv.id} style={{
                  width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8,
                  background: conv.active ? 'rgba(99,102,241,0.12)' : 'none',
                  border: conv.active ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
                  cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: conv.active ? '#818cf8' : '#cbd5e1', lineHeight: 1.3, marginBottom: 2 }}>
                    {conv.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{conv.date}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chat header */}
          <div style={{
            padding: '14px 24px',
            background: 'rgba(11,11,20,0.9)',
            borderBottom: '1px solid rgba(99,102,241,0.08)',
            display: 'flex', alignItems: 'center', gap: 12,
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: '0 0 16px rgba(99,102,241,0.4)',
            }}>✦</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Assistant IA — Hub Éducatif</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                En ligne · Modèle éducatif multimodal
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {['📎 Document', '🖼 Image', '🎙 Voix'].map(btn => (
                <button key={btn} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}>
                  {btn}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }} className="scrollbar-custom">
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.role === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: '80%' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                    }}>✦</div>
                    <div style={{ flex: 1 }}>
                      <div className="chat-ai">
                        <div style={{ fontSize: 14, lineHeight: 1.65, color: '#e2e8f0' }}>
                          {formatContent(msg.content)}
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Sources :</div>
                            {msg.sources.map((s, i) => (
                              <div key={i} style={{ fontSize: 12, color: '#818cf8', marginBottom: 3 }}>📖 {s}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.actions && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {msg.actions.map(action => (
                            <button
                              key={action}
                              onClick={() => sendMessage(action)}
                              className="btn-secondary"
                              style={{ padding: '5px 12px', fontSize: 12, borderRadius: 8 }}
                            >{action}</button>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                        {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === 'user' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '70%' }}>
                    <div className="chat-user">
                      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{msg.content}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div style={{ padding: '0 24px 16px' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>SUGGESTIONS :</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map(s => (
                  <button key={s.text} onClick={() => sendMessage(s.text)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 10, padding: '8px 14px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    color: '#cbd5e1', fontSize: 13,
                  }}>
                    <span>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: '16px 24px',
            background: 'rgba(11,11,20,0.9)',
            borderTop: '1px solid rgba(99,102,241,0.08)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: 14, padding: '8px 8px 8px 16px',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question, demandez une explication, générez des exercices..."
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#f1f5f9', fontSize: 14, resize: 'none', lineHeight: 1.5,
                  maxHeight: 120, overflowY: 'auto', padding: '6px 0',
                  fontFamily: 'Inter, sans-serif',
                }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
              <div style={{ display: 'flex', gap: 6, paddingBottom: 2, flexShrink: 0 }}>
                <button style={{
                  width: 34, height: 34, borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                  color: '#64748b', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title="Joindre un fichier">📎</button>
                <button style={{
                  width: 34, height: 34, borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                  color: '#64748b', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title="Entrée vocale">🎙</button>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: 'none',
                    background: input.trim() && !isTyping
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255,255,255,0.06)',
                    cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                    color: input.trim() && !isTyping ? 'white' : '#475569',
                    fontSize: 16, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >↑</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
              {['📖 Résumer', '⚡ Exercices', '💡 Exemple', '🔄 Reformuler'].map(cmd => (
                <button key={cmd} onClick={() => setInput(cmd.split(' ')[1] || cmd)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#475569', fontSize: 12, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                >{cmd}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </AppLayout>
  );
}
