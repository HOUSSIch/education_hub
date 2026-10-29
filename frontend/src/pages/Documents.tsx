import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';

interface Doc {
  id: number;
  name: string;
  type: 'pdf' | 'img' | 'doc';
  size: string;
  date: string;
  status: 'processing' | 'ready' | 'uploading';
  progress?: number;
  pages?: number;
  concepts?: string[];
  skills?: string[];
  summary?: string;
}

const documents: Doc[] = [
  {
    id: 1,
    name: 'Algorithmes_Avancés_Chapitre3.pdf',
    type: 'pdf', size: '2.4 MB', date: '14 Jan 2026',
    status: 'ready', pages: 42,
    concepts: ['Arbres binaires', 'Complexité', 'Tri fusion', 'Hachage'],
    skills: ['Algorithmique', 'Structures de données', 'Optimisation'],
    summary: 'Ce chapitre couvre les structures de données avancées incluant les arbres binaires de recherche, les arbres AVL et les tables de hachage. Les algorithmes de tri sont analysés en détail avec leurs complexités respectives.',
  },
  {
    id: 2,
    name: 'Machine_Learning_Intro.pdf',
    type: 'pdf', size: '5.1 MB', date: '12 Jan 2026',
    status: 'ready', pages: 88,
    concepts: ['Régression linéaire', 'Classification', 'SVM', 'Neural Networks'],
    skills: ['Machine Learning', 'Statistiques', 'Python'],
    summary: 'Introduction complète au Machine Learning couvrant les algorithmes supervisés et non-supervisés, les techniques d\'évaluation et les meilleures pratiques.',
  },
  {
    id: 3,
    name: 'BDD_TP_Exercices.pdf',
    type: 'pdf', size: '0.8 MB', date: '10 Jan 2026',
    status: 'processing', progress: 68,
  },
  {
    id: 4,
    name: 'Cours_Probabilites_S5.pdf',
    type: 'pdf', size: '3.2 MB', date: '8 Jan 2026',
    status: 'processing', progress: 12,
  },
];

export default function Documents() {
  const [selected, setSelected] = useState<Doc>(documents[0]);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'concepts' | 'skills' | 'exercises'>('summary');

  const typeIcon = (t: string) => t === 'pdf' ? '📕' : t === 'img' ? '🖼' : '📄';

  return (
    <AppLayout role="learner">
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Left — doc list */}
        <div style={{
          width: 300, background: '#0c0c18',
          borderRight: '1px solid rgba(99,102,241,0.08)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          {/* Upload zone */}
          <div style={{ padding: 16 }}>
            <div
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDrop={() => setDragging(false)}
              onDragOver={e => e.preventDefault()}
              style={{
                border: `2px dashed ${dragging ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: 12, padding: '20px 16px', textAlign: 'center',
                background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
                Glisser & déposer
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                PDF, images, documents Word
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: 12 }}>
                Parcourir les fichiers
              </button>
            </div>
          </div>

          {/* Doc list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }} className="scrollbar-custom">
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, padding: '8px 6px 6px', letterSpacing: '0.06em' }}>
              MES DOCUMENTS
            </div>
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => doc.status === 'ready' && setSelected(doc)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 10px', borderRadius: 10,
                  background: selected?.id === doc.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                  border: selected?.id === doc.id ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
                  cursor: doc.status === 'ready' ? 'pointer' : 'default',
                  marginBottom: 4, transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{typeIcon(doc.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: '#f1f5f9',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3,
                    }}>{doc.name}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#475569' }}>
                      <span>{doc.size}</span>
                      <span>{doc.date}</span>
                    </div>
                    {doc.status === 'processing' && doc.progress !== undefined && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 3 }}>
                          <span>Analyse IA...</span>
                          <span>{doc.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${doc.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {doc.status === 'ready' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4, fontSize: 10, color: '#10b981' }}>
                        ✓ Analysé · {doc.pages} pages
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right — doc details */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }} className="scrollbar-custom">
          {selected && selected.status === 'ready' ? (
            <>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                  }}>📕</div>
                  <div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                      {selected.name}
                    </h1>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
                      <span>📅 {selected.date}</span>
                      <span>📄 {selected.pages} pages</span>
                      <span>💾 {selected.size}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>📥 Télécharger</button>
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>✦ Demander à l'IA</button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
                {(['summary', 'concepts', 'skills', 'exercises'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'none',
                      color: activeTab === tab ? '#818cf8' : '#64748b',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                    }}
                  >
                    {{ summary: '📝 Résumé', concepts: '💡 Concepts', skills: '🎯 Compétences', exercises: '⚡ Exercices' }[tab]}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="glass" style={{ borderRadius: 14, padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 16 }}>✦</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>Résumé IA</span>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>{selected.summary}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="glass" style={{ borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>📊 Points clés</div>
                      {['Structure hiérarchique des données', 'Invariants de rotation AVL', 'Analyse de complexité amortie', 'Résolution de collisions par chaînage'].map((k, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                          <span style={{ color: '#6366f1', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                          <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.4 }}>{k}</span>
                        </div>
                      ))}
                    </div>

                    <div className="glass" style={{ borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>⚠️ Points difficiles détectés</div>
                      {['Équilibrage d\'arbres AVL', 'Preuve de correction des algorithmes', 'Complexité des structures récursives'].map((k, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start',
                          padding: '6px 10px', borderRadius: 8,
                          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)',
                        }}>
                          <span style={{ color: '#f87171', fontSize: 12 }}>!</span>
                          <span style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.4 }}>{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'concepts' && (
                <div className="glass" style={{ borderRadius: 14, padding: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
                    Concepts extraits par l'IA
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {(selected.concepts || []).concat(['Complexité temporelle', 'Arbre rouge-noir', 'Tri heapsort', 'File de priorité', 'Graphe orienté', 'BFS/DFS']).map(concept => (
                      <div key={concept} style={{
                        padding: '8px 14px', borderRadius: 100,
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        fontSize: 13, color: '#818cf8', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}>{concept}</div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="glass" style={{ borderRadius: 14, padding: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
                    Compétences identifiées
                  </div>
                  {(selected.skills || []).map((skill, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎯</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{skill}</div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${60 + i * 12}%` }} />
                        </div>
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#818cf8', fontWeight: 600 }}>
                        {60 + i * 12}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'exercises' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>✦</span>
                    <span style={{ fontSize: 14, color: '#cbd5e1' }}>
                      L'IA a généré <strong style={{ color: '#818cf8' }}>12 exercices</strong> basés sur ce document
                    </span>
                    <button className="btn-primary" style={{ marginLeft: 'auto', padding: '7px 16px', fontSize: 12 }}>
                      Pratiquer maintenant
                    </button>
                  </div>
                  {['Quel est l\'invariant d\'un arbre AVL ?', 'Calculez la complexité de la recherche dans une table de hachage avec chaînage.', 'Implémentez la rotation gauche pour un arbre AVL déséquilibré.'].map((q, i) => (
                    <div key={i} className="glass" style={{ borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span className="badge badge-indigo" style={{ flexShrink: 0 }}>Q{i + 1}</span>
                        <span style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>{q}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: '#475569',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sélectionnez un document</div>
              <div style={{ fontSize: 14 }}>Cliquez sur un document analysé pour voir son contenu</div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
