import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';

type QuestionType = 'mcq' | 'tf' | 'open' | 'code';
type Difficulty = 'Débutant' | 'Intermédiaire' | 'Avancé';

interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options?: string[];
  answer?: string | boolean;
  userAnswer?: string | boolean;
  correct?: boolean;
}

const generated: Question[] = [
  {
    id: 1, type: 'mcq',
    text: 'Quelle est la complexité temporelle de la recherche dans un arbre AVL ?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    answer: 'O(log n)',
  },
  {
    id: 2, type: 'tf',
    text: 'Un arbre AVL est toujours un arbre binaire de recherche.',
    answer: true,
  },
  {
    id: 3, type: 'mcq',
    text: 'Quel est le facteur d\'équilibrage maximal autorisé dans un arbre AVL ?',
    options: ['0', '1', '2', '3'],
    answer: '1',
  },
  {
    id: 4, type: 'open',
    text: 'Expliquez en vos propres mots pourquoi un arbre AVL garantit O(log n) pour toutes ses opérations.',
  },
  {
    id: 5, type: 'code',
    text: 'Implémentez une fonction Python qui calcule le facteur d\'équilibrage d\'un nœud dans un arbre binaire.',
  },
];

export default function Exercises() {
  const [phase, setPhase] = useState<'config' | 'exercise' | 'done'>('config');
  const [config, setConfig] = useState({
    subject: 'Algorithmes & Structures de données',
    difficulty: 'Intermédiaire' as Difficulty,
    types: ['mcq', 'tf'] as QuestionType[],
    count: 5,
    objective: 'Maîtriser les arbres AVL',
  });
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setQuestions(generated);
      setGenerating(false);
      setPhase('exercise');
      setCurrent(0);
      setAnswers({});
      setSubmitted(false);
    }, 1800);
  };

  const submitAll = () => {
    setSubmitted(true);
    setPhase('done');
  };

  const q = questions[current];
  const score = questions.filter(q => {
    const ua = answers[q.id];
    return ua !== undefined && ua === q.answer;
  }).length;

  const diffColor: Record<Difficulty, string> = {
    'Débutant': '#10b981', 'Intermédiaire': '#f59e0b', 'Avancé': '#ef4444',
  };

  return (
    <AppLayout role="learner">
      <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
        {phase === 'config' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6 }}>
                ⚡ Générateur d'exercices IA
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 15 }}>
                Configurez votre session d'exercices. L'IA génère des questions personnalisées selon vos paramètres.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
              <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {/* Subject */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>
                      Sujet / Cours
                    </label>
                    <select
                      value={config.subject}
                      onChange={e => setConfig(c => ({ ...c, subject: e.target.value }))}
                      className="input-field"
                      style={{ cursor: 'pointer' }}
                    >
                      {['Algorithmes & Structures de données', 'Machine Learning Appliqué', 'Bases de données avancées', 'Développement Web Full-Stack'].map(s => (
                        <option key={s} value={s} style={{ background: '#0d0d1a' }}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 10, display: 'block' }}>
                      Difficulté
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['Débutant', 'Intermédiaire', 'Avancé'] as Difficulty[]).map(d => (
                        <button key={d} onClick={() => setConfig(c => ({ ...c, difficulty: d }))} style={{
                          flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                          background: config.difficulty === d ? `${diffColor[d]}18` : 'rgba(255,255,255,0.04)',
                          border: config.difficulty === d ? `1px solid ${diffColor[d]}40` : '1px solid rgba(255,255,255,0.07)',
                          color: config.difficulty === d ? diffColor[d] : '#64748b',
                          fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                        }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Types */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 10, display: 'block' }}>
                      Types de questions
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {([
                        { value: 'mcq', label: 'QCM', icon: '☑' },
                        { value: 'tf', label: 'Vrai/Faux', icon: '↕' },
                        { value: 'open', label: 'Question ouverte', icon: '✏' },
                        { value: 'code', label: 'Code', icon: '⌨' },
                      ] as { value: QuestionType; label: string; icon: string }[]).map(t => {
                        const active = config.types.includes(t.value);
                        return (
                          <button key={t.value} onClick={() => setConfig(c => ({
                            ...c,
                            types: active ? c.types.filter(x => x !== t.value) : [...c.types, t.value],
                          }))} style={{
                            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                            background: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                            border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.07)',
                            color: active ? '#818cf8' : '#64748b', display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                          }}>
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                            {active && <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 14 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Count */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>
                      Nombre de questions : <span style={{ color: '#818cf8' }}>{config.count}</span>
                    </label>
                    <input type="range" min={3} max={20} value={config.count}
                      onChange={e => setConfig(c => ({ ...c, count: +e.target.value }))}
                      style={{ width: '100%', accentColor: '#6366f1' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 4 }}>
                      <span>3</span><span>20</span>
                    </div>
                  </div>

                  {/* Objective */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>
                      Objectif d'apprentissage
                    </label>
                    <input
                      value={config.objective}
                      onChange={e => setConfig(c => ({ ...c, objective: e.target.value }))}
                      className="input-field"
                      placeholder="Ex: Maîtriser les arbres AVL..."
                    />
                  </div>

                  <button
                    onClick={generate}
                    disabled={generating || config.types.length === 0}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}
                  >
                    {generating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                        Génération IA en cours...
                      </span>
                    ) : '✦ Générer les exercices'}
                  </button>
                </div>
              </div>

              {/* Preview panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="glass" style={{ borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Résumé</div>
                  {[
                    { label: 'Sujet', value: config.subject.split(' ')[0] + '...' },
                    { label: 'Difficulté', value: config.difficulty },
                    { label: 'Types', value: config.types.length + ' type(s)' },
                    { label: 'Questions', value: config.count.toString() },
                    { label: 'Durée estimée', value: `~${config.count * 2} min` },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, marginBottom: 6 }}>✦ IA Adaptative</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    Les questions sont générées en tenant compte de vos performances passées et de vos lacunes détectées.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {phase === 'exercise' && q && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
                Session d'exercices — {config.subject.split(' ')[0]}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} style={{
                    width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                    background: answers[questions[i].id] !== undefined
                      ? 'rgba(99,102,241,0.3)' : i === current
                      ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                    border: i === current ? '1.5px solid rgba(99,102,241,0.5)' : '1px solid transparent',
                    color: i === current ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 700,
                    transition: 'all 0.2s',
                  }}>{i + 1}</button>
                ))}
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 16, padding: 32, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <span className="badge badge-indigo">Q{current + 1}/{questions.length}</span>
                <span className="badge badge-violet">
                  {{ mcq: 'QCM', tf: 'Vrai/Faux', open: 'Question ouverte', code: 'Code' }[q.type]}
                </span>
                <span style={{ fontSize: 11, color: diffColor[config.difficulty], fontWeight: 600 }}>● {config.difficulty}</span>
              </div>

              <p style={{ fontSize: 17, color: '#f1f5f9', lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>{q.text}</p>

              {q.type === 'mcq' && q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))} style={{
                      padding: '13px 18px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      background: answers[q.id] === opt ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      border: answers[q.id] === opt ? '1.5px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: answers[q.id] === opt ? '#818cf8' : '#cbd5e1',
                      fontSize: 14, fontWeight: answers[q.id] === opt ? 600 : 400, transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `1.5px solid ${answers[q.id] === opt ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                        background: answers[q.id] === opt ? '#6366f1' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {answers[q.id] === opt && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'tf' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ label: '✓ Vrai', val: true }, { label: '✗ Faux', val: false }].map(o => (
                    <button key={o.label} onClick={() => setAnswers(a => ({ ...a, [q.id]: o.val }))} style={{
                      flex: 1, padding: '16px', borderRadius: 12, cursor: 'pointer',
                      background: answers[q.id] === o.val ? (o.val ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.04)',
                      border: answers[q.id] === o.val ? `1.5px solid ${o.val ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` : '1px solid rgba(255,255,255,0.08)',
                      color: answers[q.id] === o.val ? (o.val ? '#34d399' : '#f87171') : '#64748b',
                      fontSize: 16, fontWeight: 700, transition: 'all 0.2s',
                    }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {(q.type === 'open' || q.type === 'code') && (
                <textarea
                  value={String(answers[q.id] || '')}
                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  placeholder={q.type === 'code' ? '# Écrivez votre code Python ici...' : 'Votre réponse...'}
                  rows={6}
                  className="input-field"
                  style={{
                    resize: 'vertical', fontFamily: q.type === 'code' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
                    fontSize: 13, lineHeight: 1.6,
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                className="btn-secondary" disabled={current === 0}
                style={{ padding: '10px 18px', fontSize: 13 }}
              >← Précédente</button>

              <div style={{ fontSize: 13, color: '#64748b' }}>
                {Object.keys(answers).length}/{questions.length} répondues
              </div>

              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c + 1)} className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
                  Suivante →
                </button>
              ) : (
                <button onClick={submitAll} className="btn-primary" style={{ padding: '10px 20px', fontSize: 13, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  ✓ Terminer et corriger
                </button>
              )}
            </div>
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
              Exercice terminé !
            </h2>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 56, fontWeight: 900, color: score >= questions.length * 0.7 ? '#10b981' : '#f59e0b', margin: '16px 0' }}>
              {score}/{questions.length}
            </div>
            <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 28 }}>
              {score >= questions.length * 0.8 ? 'Excellent travail ! Vous maîtrisez bien ce sujet.' :
               score >= questions.length * 0.6 ? 'Bon résultat ! Quelques points à revoir.' :
               'Continuez à pratiquer, vous progressez !'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setPhase('config')} className="btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }}>
                Nouvel exercice
              </button>
              <button onClick={() => { setPhase('exercise'); setCurrent(0); }} className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
                Voir les corrections
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
