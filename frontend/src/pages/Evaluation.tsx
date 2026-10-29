import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const questions = [
  { id: 1, text: 'Quelle est la complexité de l\'algorithme quicksort dans le cas moyen ?', type: 'mcq', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], answer: 'O(n log n)' },
  { id: 2, text: 'Un arbre AVL est toujours parfaitement équilibré.', type: 'tf', answer: false },
  { id: 3, text: 'Quel algorithme de tri a la meilleure complexité dans le cas moyen ?', type: 'mcq', options: ['Tri bulles', 'Tri fusion', 'Tri insertion', 'Tri sélection'], answer: 'Tri fusion' },
  { id: 4, text: 'Expliquez la différence entre une pile (stack) et une file (queue).', type: 'open' },
  { id: 5, text: 'La recherche dans une table de hachage a toujours une complexité O(1).', type: 'tf', answer: false },
  { id: 6, text: 'Quelle structure de données utilise le principe LIFO ?', type: 'mcq', options: ['File', 'Pile', 'Arbre', 'Graphe'], answer: 'Pile' },
  { id: 7, text: 'Définissez la complexité amortie et donnez un exemple.', type: 'open' },
  { id: 8, text: 'Quelle traversée d\'arbre binaire produit une liste triée ?', type: 'mcq', options: ['Préordre', 'Postordre', 'Ordre symétrique', 'Niveau par niveau'], answer: 'Ordre symétrique' },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Evaluation() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | boolean>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(7200); // 2h
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progressPct = (answered / questions.length) * 100;
  const urgent = timeLeft < 600;

  const submit = () => {
    setSubmitted(true);
    setShowSubmitModal(false);
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: '#07070f', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20,
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 800, color: '#f1f5f9' }}>
          Examen soumis !
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16 }}>Vos réponses ont été enregistrées avec succès.</p>
        <Link to="/results" className="btn-primary" style={{ padding: '13px 28px', fontSize: 15 }}>
          Voir mes résultats →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700 }}>Examen Final — Algorithmes & Structures de données</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Prof. Marie Dupont · 15 Janvier 2026</div>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
            <span>{answered}/{questions.length} répondues</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10,
            background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
            border: urgent ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: 14 }}>⏱</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700,
              color: urgent ? '#f87171' : '#f1f5f9',
            }}>{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', fontSize: 13, fontWeight: 700,
            }}
          >Soumettre</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Question navigator */}
        <div style={{
          width: 200, background: '#0c0c18',
          borderRight: '1px solid rgba(99,102,241,0.08)',
          padding: 16, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 12, letterSpacing: '0.06em' }}>
            NAVIGATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: '100%', aspectRatio: '1', borderRadius: 8, cursor: 'pointer',
                background: i === current
                  ? 'rgba(99,102,241,0.25)'
                  : answers[questions[i].id] !== undefined
                  ? 'rgba(16,185,129,0.15)'
                  : flagged.has(i)
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(255,255,255,0.05)',
                border: i === current
                  ? '1.5px solid rgba(99,102,241,0.5)'
                  : answers[questions[i].id] !== undefined
                  ? '1px solid rgba(16,185,129,0.25)'
                  : flagged.has(i)
                  ? '1px solid rgba(245,158,11,0.25)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: i === current ? '#818cf8' : answers[questions[i].id] !== undefined ? '#34d399' : flagged.has(i) ? '#fbbf24' : '#64748b',
                fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
              }}>{i + 1}{flagged.has(i) && <span style={{ fontSize: 8, display: 'block', lineHeight: 1 }}>🚩</span>}</button>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { color: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', label: 'Répondu', count: answered },
              { color: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', label: 'Signalé', count: flagged.size },
              { color: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', label: 'Non répondu', count: questions.length - answered },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: s.color, border: s.border }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', fontWeight: 700 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main question area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '36px 48px' }} className="scrollbar-custom">
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Question header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-indigo">Question {current + 1} sur {questions.length}</span>
                <span className="badge badge-violet">
                  {{ mcq: 'QCM', tf: 'Vrai/Faux', open: 'Développement' }[q.type] || q.type}
                </span>
              </div>
              <button
                onClick={() => setFlagged(f => { const n = new Set(f); if (n.has(current)) n.delete(current); else n.add(current); return n; })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 8, cursor: 'pointer',
                  background: flagged.has(current) ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                  color: flagged.has(current) ? '#fbbf24' : '#64748b',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                }}
              >🚩 {flagged.has(current) ? 'Signalé' : 'Signaler'}</button>
            </div>

            <div className="glass" style={{ borderRadius: 16, padding: 32, marginBottom: 24 }}>
              <p style={{ fontSize: 17, color: '#f1f5f9', lineHeight: 1.7, marginBottom: 28, fontWeight: 500 }}>{q.text}</p>

              {q.type === 'mcq' && q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))} style={{
                      padding: '14px 18px', borderRadius: 11, cursor: 'pointer', textAlign: 'left',
                      background: answers[q.id] === opt ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                      border: answers[q.id] === opt ? '1.5px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      color: answers[q.id] === opt ? '#818cf8' : '#cbd5e1',
                      fontSize: 15, fontWeight: answers[q.id] === opt ? 600 : 400, transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `1.5px solid ${answers[q.id] === opt ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                        background: answers[q.id] === opt ? '#6366f1' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {answers[q.id] === opt && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'tf' && (
                <div style={{ display: 'flex', gap: 16 }}>
                  {[{ l: '✓ Vrai', v: true }, { l: '✗ Faux', v: false }].map(o => (
                    <button key={o.l} onClick={() => setAnswers(a => ({ ...a, [q.id]: o.v }))} style={{
                      flex: 1, padding: '20px', borderRadius: 14, cursor: 'pointer',
                      background: answers[q.id] === o.v ? (o.v ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)') : 'rgba(255,255,255,0.04)',
                      border: answers[q.id] === o.v ? `1.5px solid ${o.v ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` : '1px solid rgba(255,255,255,0.08)',
                      color: answers[q.id] === o.v ? (o.v ? '#34d399' : '#f87171') : '#94a3b8',
                      fontSize: 17, fontWeight: 700, transition: 'all 0.2s',
                    }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'open' && (
                <>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>
                    Rédigez votre réponse ci-dessous. Soyez précis et structuré.
                  </div>
                  <textarea
                    value={String(answers[q.id] || '')}
                    onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="Votre réponse développée..."
                    rows={7}
                    className="input-field"
                    style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.65 }}
                  />
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 6, textAlign: 'right' }}>
                    {String(answers[q.id] || '').length} caractères
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="btn-secondary" style={{ padding: '11px 20px', fontSize: 14 }}
              >← Précédente</button>
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c + 1)} className="btn-primary" style={{ padding: '11px 22px', fontSize: 14 }}>
                  Suivante →
                </button>
              ) : (
                <button onClick={() => setShowSubmitModal(true)} style={{
                  padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                }}>Soumettre l'examen ✓</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ background: '#111122', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: 36, maxWidth: 440, width: '90%' }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>📋</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9', textAlign: 'center', marginBottom: 8 }}>
              Soumettre l'examen ?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              Vous avez répondu à <strong style={{ color: '#818cf8' }}>{answered}/{questions.length}</strong> questions.
              {answered < questions.length && <span style={{ color: '#fbbf24' }}> {questions.length - answered} question(s) sans réponse.</span>}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowSubmitModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                Annuler
              </button>
              <button onClick={submit} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontSize: 14, fontWeight: 700,
              }}>Confirmer ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
