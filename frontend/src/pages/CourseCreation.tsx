import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';

export default function CourseCreation() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [difficulty, setDifficulty] = useState('Intermédiaire');
  const [chapters, setChapters] = useState([
    { id: 1, title: 'Introduction', lessons: 3, expanded: true },
    { id: 2, title: 'Concepts fondamentaux', lessons: 0, expanded: false },
  ]);
  const [generating, setGenerating] = useState(false);
  const [published, setPublished] = useState(false);

  const addChapter = () => setChapters(c => [...c, { id: Date.now(), title: 'Nouveau chapitre', lessons: 0, expanded: false }]);

  const generateExercises = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const publish = () => setPublished(true);

  return (
    <AppLayout role="teacher">
      <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Créer un cours
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>Construisez votre cours et générez des exercices avec l'IA</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" style={{ padding: '9px 18px', fontSize: 13 }}>Enregistrer brouillon</button>
            <button onClick={publish} className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>
              {published ? '✓ Publié' : 'Publier →'}
            </button>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {['Informations', 'Contenu', 'Exercices', 'Paramètres'].map((s, i) => (
            <button key={s} onClick={() => setStep(i + 1)} style={{
              flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: step === i + 1 ? 'rgba(99,102,241,0.2)' : 'none',
              color: step === i + 1 ? '#818cf8' : '#64748b',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            }}>{i + 1}. {s}</button>
          ))}
        </div>

        {step === 1 && (
          <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 22 }}>Informations générales</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>Titre du cours *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Ex: Introduction aux réseaux de neurones" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} className="input-field" rows={4} placeholder="Décrivez les objectifs, le public cible et le contenu..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>Difficulté</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                    {['Débutant', 'Intermédiaire', 'Avancé'].map(d => <option key={d} style={{ background: '#0d0d1a' }}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>Catégorie</label>
                  <select className="input-field" style={{ cursor: 'pointer' }}>
                    {['Informatique', 'IA/ML', 'Mathématiques', 'Sciences', 'Langues'].map(d => <option key={d} style={{ background: '#0d0d1a' }}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>Durée estimée</label>
                  <input className="input-field" placeholder="Ex: 20h" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>Compétences enseignées</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {['Python', 'TensorFlow', 'Deep Learning'].map(t => (
                    <span key={t} className="badge badge-indigo" style={{ cursor: 'pointer' }}>{t} ×</span>
                  ))}
                </div>
                <input className="input-field" placeholder="Ajouter une compétence..." />
              </div>

              {/* AI assist */}
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span>✦</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', marginBottom: 4 }}>Assistant IA</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>L'IA peut générer automatiquement une description, des objectifs et des compétences basés sur le titre de votre cours.</div>
                  <button className="btn-secondary" style={{ marginTop: 8, padding: '5px 12px', fontSize: 12, borderRadius: 8 }}>
                    ✦ Générer avec l'IA
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
                Suivant : Contenu →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Structure du cours</h2>
              <button onClick={addChapter} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>+ Chapitre</button>
            </div>

            {chapters.map(ch => (
              <div key={ch.id} className="glass" style={{ borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ color: '#64748b', cursor: 'grab', fontSize: 16 }}>⠿</span>
                  <input
                    defaultValue={ch.title}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 15, fontWeight: 700 }}
                  />
                  <span className="badge badge-indigo">{ch.lessons} leçons</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14 }}>✏</button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14 }}>🗑</button>
                </div>
                <div style={{ padding: '8px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {ch.lessons > 0 ? Array.from({ length: ch.lessons }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#475569', fontSize: 14 }}>⠿</span>
                      <span style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>Leçon {i + 1}</span>
                      <span className="badge badge-indigo" style={{ fontSize: 10 }}>Texte</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 12 }}>✏</button>
                    </div>
                  )) : (
                    <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Aucune leçon</div>
                  )}
                  <button className="btn-secondary" style={{ marginTop: 10, padding: '7px 14px', fontSize: 12, borderRadius: 8 }}>
                    + Ajouter une leçon
                  </button>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }}>← Retour</button>
              <button onClick={() => setStep(3)} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>Suivant : Exercices →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 22 }}>
              ✦ Génération d'exercices par IA
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Nombre de QCM', value: '20' },
                { label: 'Nombre de Vrai/Faux', value: '10' },
                { label: 'Questions ouvertes', value: '5' },
                { label: 'Exercices de code', value: '3' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>{f.label}</label>
                  <input defaultValue={f.value} className="input-field" type="number" min={0} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>
                Instructions pour l'IA
              </label>
              <textarea className="input-field" rows={3} defaultValue="Générez des exercices progressifs adaptés aux étudiants de niveau intermédiaire en informatique. Incluez des exemples concrets et des cas pratiques." style={{ resize: 'vertical' }} />
            </div>

            <button onClick={generateExercises} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginBottom: 20 }} disabled={generating}>
              {generating ? '⏳ Génération en cours...' : '✦ Générer tous les exercices'}
            </button>

            {!generating && (
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>✓ 38 exercices générés</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>20 QCM · 10 V/F · 5 questions ouvertes · 3 de code</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
              <button onClick={() => setStep(2)} className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }}>← Retour</button>
              <button onClick={() => setStep(4)} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>Suivant : Paramètres →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 22 }}>Paramètres de publication</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Accès', options: ['Public', 'Privé', 'Sur invitation'] },
                { label: 'Langue', options: ['Français', 'Anglais', 'Espagnol'] },
              ].map(s => (
                <div key={s.label}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>{s.label}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {s.options.map(o => (
                      <button key={o} style={{ flex: 1, padding: '9px', borderRadius: 9, cursor: 'pointer', background: o === s.options[0] ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: o === s.options[0] ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.07)', color: o === s.options[0] ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 600 }}>{o}</button>
                    ))}
                  </div>
                </div>
              ))}
              {[
                'Activer les commentaires étudiants',
                'Permettre le téléchargement du contenu',
                'Générer un certificat à la complétion',
                'Notifier les étudiants à la publication',
              ].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: '#6366f1' }} />
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{opt}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(3)} className="btn-secondary" style={{ padding: '11px 20px', fontSize: 13 }}>← Retour</button>
              <button onClick={publish} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: 14, background: published ? 'linear-gradient(135deg, #10b981, #059669)' : undefined }}>
                {published ? '✓ Cours publié !' : 'Publier le cours →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
