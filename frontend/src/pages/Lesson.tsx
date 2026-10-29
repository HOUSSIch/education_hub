import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';

const lessonContent = `
Un arbre AVL (nommé d'après Adelson-Velsky et Landis, 1962) est un arbre binaire de recherche **auto-équilibrant**.

## Propriété d'équilibrage

Pour chaque nœud de l'arbre, la différence de hauteur entre ses sous-arbres gauche et droit ne peut excéder 1. Cette valeur est appelée le **facteur d'équilibrage** (balance factor).

$$\\text{balance}(n) = \\text{hauteur}(\\text{gauche}) - \\text{hauteur}(\\text{droite}) \\in \\{-1, 0, 1\\}$$

## Rotations

Lorsqu'une insertion ou suppression brise cette propriété, l'arbre effectue des **rotations** pour se rééquilibrer.

### Rotation simple gauche (RG)

Appliquée quand le facteur d'équilibrage du nœud est +2 et celui du fils droit est +1.

### Rotation simple droite (RD)

Appliquée quand le facteur d'équilibrage du nœud est -2 et celui du fils gauche est -1.

## Complexité

Toutes les opérations (recherche, insertion, suppression) ont une complexité **O(log n)** garantie.
`;

export default function Lesson() {
  const [bookmarked, setBookmarked] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [asking, setAsking] = useState(false);

  const askAI = () => {
    setAsking(true);
    setAiPanelOpen(true);
    setTimeout(() => {
      setAiResponse('Un arbre AVL est un arbre binaire de recherche auto-équilibrant. La clé : après chaque insertion ou suppression, l\'arbre vérifie si le facteur d\'équilibrage est toujours dans {-1, 0, 1}. Sinon, il effectue des rotations. Pensez-y comme un arbre qui se "répare" lui-même après chaque modification !');
      setAsking(false);
    }, 1200);
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '24px 0 12px', letterSpacing: '-0.01em' }}>{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#cbd5e1', margin: '18px 0 8px' }}>{line.slice(4)}</h3>;
      if (line.startsWith('$$') && line.endsWith('$$')) return (
        <div key={i} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '12px 18px', margin: '12px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#818cf8' }}>
          {line.slice(2, -2)}
        </div>
      );
      if (line === '') return <div key={i} style={{ height: 10 }} />;

      // Bold
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={i} style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.75, margin: '4px 0' }}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#f1f5f9', fontWeight: 600 }}>{part}</strong> : part)}
      </p>;
    });
  };

  return (
    <AppLayout role="learner">
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Lesson content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="scrollbar-custom">
          {/* Lesson header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(99,102,241,0.08)',
            padding: '12px 32px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Link to="/courses" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>← Cours</Link>
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#64748b', fontSize: 13 }}>Algorithmes & Structures de données</span>
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>Arbres AVL</span>
            <div style={{ flex: 1 }} />
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
              <span>Leçon 4.2 sur 6</span>
              <div style={{ width: 80 }} className="progress-bar">
                <div className="progress-fill" style={{ width: '67%' }} />
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 120px' }}>
            {/* Lesson meta */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <span className="badge badge-indigo">Chapitre 4</span>
              <span className="badge badge-violet">⏱ 18 min</span>
              <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, padding: '3px 10px', fontWeight: 600 }}>● Interactif</span>
            </div>

            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800,
              color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.2,
            }}>Arbres AVL — Équilibrage automatique</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
              Par Dr. Marie Dupont · Mis à jour le 10 Jan 2026
            </p>

            {/* Video placeholder */}
            <div style={{
              width: '100%', height: 280, borderRadius: 16,
              background: 'linear-gradient(135deg, #0f0f1c, #1a1a2e)',
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              marginBottom: 32, cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
              }} />
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: 'white', marginBottom: 12,
                boxShadow: '0 0 30px rgba(99,102,241,0.4)',
              }}>▶</div>
              <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Vidéo — Arbres AVL expliqués</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>12:34</div>
            </div>

            {/* Content */}
            <div>{renderContent(lessonContent)}</div>

            {/* Interactive demo */}
            <div style={{
              marginTop: 28, padding: '20px 24px', borderRadius: 14,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#818cf8', marginBottom: 12 }}>
                🧪 Simulation interactive — Rotation AVL
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                {[45, 25, 75, 15, 35, 65, 85].map(n => (
                  <div key={n} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#818cf8', fontWeight: 700,
                  }}>{n}</div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                Arbre AVL équilibré — cliquez sur les nœuds pour simuler des insertions
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <div style={{
            position: 'sticky', bottom: 0,
            background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(99,102,241,0.08)',
            padding: '14px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Link to="/courses" className="btn-secondary" style={{ padding: '10px 18px', fontSize: 13 }}>
              ← Leçon précédente
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setBookmarked(b => !b)} style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                background: bookmarked ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                color: bookmarked ? '#fbbf24' : '#64748b', fontSize: 14, transition: 'all 0.2s',
              }}>🔖</button>
              <button onClick={() => setNoteOpen(o => !o)} style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: '#64748b', fontSize: 14,
              }}>📝</button>
              <button onClick={askAI} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderRadius: 10, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                border: '1px solid rgba(99,102,241,0.25)' as string,
                color: '#818cf8', fontSize: 13, fontWeight: 600,
              }}>✦ Expliquer autrement</button>
            </div>
            <Link to="/exercises" className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
              Leçon suivante →
            </Link>
          </div>
        </div>

        {/* Notes panel */}
        {noteOpen && (
          <div style={{
            width: 280, background: '#0c0c18',
            borderLeft: '1px solid rgba(99,102,241,0.08)',
            display: 'flex', flexDirection: 'column', padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>📝 Mes notes</div>
              <button onClick={() => setNoteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 16 }}>×</button>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Prenez vos notes ici..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10,
                padding: '12px', color: '#f1f5f9', fontSize: 13, lineHeight: 1.6,
                resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif',
              }}
            />
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: '9px', fontSize: 13 }}>
              Enregistrer
            </button>
          </div>
        )}

        {/* AI explanation panel */}
        {aiPanelOpen && (
          <div style={{
            width: 300, background: '#0c0c18',
            borderLeft: '1px solid rgba(99,102,241,0.08)',
            display: 'flex', flexDirection: 'column', padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✦</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>Explication IA</div>
              </div>
              <button onClick={() => setAiPanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 16 }}>×</button>
            </div>
            <div className="chat-ai" style={{ borderRadius: 12 }}>
              {asking ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', animation: `bounce 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#e2e8f0' }}>{aiResponse}</p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {['Donner un exemple concret', 'Comparer avec autre structure', 'Générer des exercices'].map(action => (
                <button key={action} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, borderRadius: 8, width: '100%', justifyContent: 'flex-start' }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }`}</style>
    </AppLayout>
  );
}
