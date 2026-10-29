import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { OrbCanvas } from '../components/OrbCanvas';
import { Logo } from '../components/Logo';

const sections = [
  {
    headline: ['Learn Smarter.', 'Create More.', 'Progress Further.'],
    sub: 'La plateforme éducative IA qui combine assistance intelligente, apprentissage personnalisé, exercices automatiques et évaluation adaptative.',
    tag: 'Nouvelle génération EdTech',
  },
  {
    headline: ['Your AI', 'Learning', 'Assistant.'],
    sub: 'Posez vos questions, obtenez des explications claires, générez des exercices et analysez vos documents en temps réel.',
    tag: 'Intelligence Artificielle',
  },
  {
    headline: ['Understand', 'Your Courses', 'Instantly.'],
    sub: 'Téléchargez vos PDFs et documents. Notre IA extrait les concepts clés, génère des résumés et identifie vos lacunes.',
    tag: 'Analyse Documentaire',
  },
  {
    headline: ['Generate', 'Exercises', 'Automatically.'],
    sub: 'Des QCM, vrai/faux et questions ouvertes générés sur mesure selon votre niveau et vos objectifs d\'apprentissage.',
    tag: 'Génération d\'Exercices',
  },
  {
    headline: ['Evaluate', 'Your', 'Knowledge.'],
    sub: 'Des évaluations adaptatives avec correction intelligente, explications détaillées et identification de vos points faibles.',
    tag: 'Évaluation Intelligente',
  },
  {
    headline: ['Track Your', 'Learning', 'Journey.'],
    sub: 'Visualisez vos progrès, maîtrisez vos compétences et recevez des recommandations personnalisées basées sur vos performances.',
    tag: 'Analyse des Progrès',
  },
  {
    headline: ['Everything', 'You Need To', 'Learn Smarter.'],
    sub: 'Un écosystème d\'apprentissage complet pour les apprenants, formateurs et administrateurs. Commencez gratuitement dès aujourd\'hui.',
    tag: 'Plateforme Complète',
  },
];

const stats = [
  { value: '50K+', label: 'Apprenants actifs', icon: '👥' },
  { value: '2M+', label: 'Exercices générés', icon: '⚡' },
  { value: '98%', label: 'Satisfaction', icon: '⭐' },
  { value: '500+', label: 'Cours disponibles', icon: '📚' },
];

const features = [
  {
    icon: '✦',
    title: 'Assistant IA Multimodal',
    desc: 'Conversations naturelles, analyse de PDF, génération d\'exercices et explications intelligentes.',
    color: '#6366f1',
  },
  {
    icon: '📄',
    title: 'Analyse Documentaire',
    desc: 'Extraction automatique des concepts clés, résumés intelligents et identification des compétences.',
    color: '#8b5cf6',
  },
  {
    icon: '⚡',
    title: 'Exercices Adaptatifs',
    desc: 'Génération automatique de QCM, vrai/faux et questions ouvertes adaptés à votre niveau.',
    color: '#06b6d4',
  },
  {
    icon: '📊',
    title: 'Analytics Avancées',
    desc: 'Tableaux de bord détaillés, suivi des progrès et recommandations personnalisées en temps réel.',
    color: '#10b981',
  },
  {
    icon: '🏆',
    title: 'Gamification',
    desc: 'XP, niveaux, badges et classements pour maintenir la motivation et l\'engagement.',
    color: '#f59e0b',
  },
  {
    icon: '🎯',
    title: 'Parcours Personnalisé',
    desc: 'IA qui adapte le contenu, la difficulté et les recommandations à votre profil unique.',
    color: '#ec4899',
  },
];

const testimonials = [
  {
    name: 'Sophie Marchand',
    role: 'Étudiante en Master IA',
    text: 'Hub Éducatif a révolutionné ma façon d\'étudier. L\'assistant IA m\'explique les concepts complexes en quelques secondes.',
    avatar: 'S',
    rating: 5,
  },
  {
    name: 'Dr. Ahmed Benali',
    role: 'Professeur Université Paris',
    text: 'En tant que formateur, la génération automatique d\'exercices m\'économise des heures chaque semaine. Impressionnant.',
    avatar: 'A',
    rating: 5,
  },
  {
    name: 'Lucas Petit',
    role: 'Développeur en reconversion',
    text: 'Les recommandations personnalisées m\'ont aidé à combler mes lacunes rapidement. Je progresse 3x plus vite.',
    avatar: 'L',
    rating: 5,
  },
];

export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSection, setVisibleSection] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const prevSection = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const maxScroll = window.innerHeight * 6;
          const prog = Math.min(1, Math.max(0, window.scrollY / maxScroll));
          setScrollProgress(prog);
          const sec = Math.min(6, Math.floor(prog * 7));
          if (sec !== prevSection.current) {
            setTextVisible(false);
            setTimeout(() => {
              setVisibleSection(sec);
              setTextVisible(true);
              prevSection.current = sec;
            }, 200);
          }
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sec = sections[visibleSection];
  const orbX = visibleSection === 0 ? 52 : visibleSection <= 2 ? 62 : visibleSection <= 4 ? 60 : 50;
  const orbScale = 1 + visibleSection * 0.04;
  const orbY = Math.sin(visibleSection * 0.8) * 4;

  return (
    <div style={{ background: '#07070f', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 68,
        background: 'rgba(7,7,15,0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo size="icon" style={{ width: 26, height: 34 }} />
          <span style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14,
            color: '#FFFFFF', letterSpacing: '0.03em',
          }}>Hub Éducatif <span style={{ color: '#D9A93A' }}>Multimodal</span></span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['Accueil', 'Fonctionnalités', 'IA', 'Apprentissage', 'À propos'].map(item => (
            <a key={item} href="#" style={{
              color: '#94a3b8', fontSize: 13, fontWeight: 500, padding: '6px 14px',
              borderRadius: 8, textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >{item}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/auth" style={{
            color: '#94a3b8', fontSize: 13, fontWeight: 500, padding: '8px 16px',
            borderRadius: 9, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            transition: 'all 0.2s',
          }}>Connexion</Link>
          <Link to="/auth?mode=register" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
            Commencer maintenant →
          </Link>
        </div>
      </nav>

      {/* Scroll storytelling section */}
      <div style={{ height: '700vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {/* Background gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 60% at 60% 50%, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
            transition: 'all 1s ease',
          }} />

          {/* Floating particles background */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${10 + (i * 4.5) % 85}%`,
                top: `${15 + (i * 7.3) % 70}%`,
                width: 2, height: 2,
                borderRadius: '50%',
                background: `rgba(${i % 2 === 0 ? '99,102,241' : '167,139,250'},${0.2 + (i % 3) * 0.1})`,
                animation: `sparkle ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${(i * 0.3) % 2}s`,
              }} />
            ))}
          </div>

          {/* 3D Orb */}
          <div style={{
            position: 'absolute',
            left: `${orbX - 20}%`,
            top: `${10 + orbY}%`,
            width: '45%',
            height: '80%',
            transition: 'left 1.2s cubic-bezier(0.4,0,0.2,1), transform 1.2s cubic-bezier(0.4,0,0.2,1)',
            transform: `scale(${orbScale})`,
          }}>
            <OrbCanvas morphState={visibleSection} />
          </div>

          {/* Section text */}
          <div style={{
            position: 'absolute',
            left: '6%',
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: visibleSection === 0 ? 560 : 480,
            opacity: textVisible ? 1 : 0,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
            {/* Tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 100, padding: '5px 14px',
              marginBottom: 24,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', letterSpacing: '0.05em' }}>
                {sec.tag}
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(40px, 5.5vw, 80px)',
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: 24,
              letterSpacing: '-0.03em',
            }}>
              {sec.headline.map((line, i) => (
                <span key={i} style={{ display: 'block' }}>
                  {i === 0 ? (
                    <span style={{
                      background: 'linear-gradient(135deg, #f1f5f9, #818cf8)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>{line}</span>
                  ) : i === 1 ? (
                    <span className="gradient-text">{line}</span>
                  ) : (
                    <span style={{ color: '#cbd5e1' }}>{line}</span>
                  )}
                </span>
              ))}
            </h1>

            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
              {sec.sub}
            </p>

            {visibleSection === 0 && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/auth?mode=register" className="btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
                  Commencer maintenant →
                </Link>
                <Link to="/dashboard" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  color: '#94a3b8', fontSize: 15, fontWeight: 500, padding: '13px 24px',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  textDecoration: 'none', transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)',
                }}>▶ Découvrir</Link>
              </div>
            )}

            {visibleSection === 6 && (
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/auth?mode=register" className="btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
                  Start Learning →
                </Link>
              </div>
            )}

            {/* Feature bullets for sections 1-5 */}
            {visibleSection > 0 && visibleSection < 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['✦ Conversations naturelles en français', '⚡ Génération d\'exercices instantanée', '📄 Analyse de PDF et documents'],
                  ['📊 Extraction des concepts clés', '🎯 Résumés intelligents en 1 clic', '🔍 Identification des lacunes'],
                  ['📝 QCM adaptatifs', '✓ Vrai/Faux contextualisés', '💡 Questions ouvertes guidées'],
                  ['⭐ Score détaillé par compétence', '💬 Explications pour chaque erreur', '📈 Recommandations immédiates'],
                  ['📊 Graphiques de progression', '🎯 Analyse des forces/faiblesses', '🏆 Streaks et achievements'],
                ][visibleSection - 1]?.map(item => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: '#cbd5e1', fontSize: 14,
                  }}>
                    <span style={{ color: '#6366f1', fontSize: 13 }}>{item.split(' ')[0]}</span>
                    <span>{item.slice(item.indexOf(' ') + 1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scroll indicator */}
          {visibleSection === 0 && (
            <div style={{
              position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              color: '#475569', fontSize: 12,
            }}>
              <span style={{ letterSpacing: '0.1em', fontWeight: 500 }}>SCROLL</span>
              <div style={{
                width: 1, height: 40,
                background: 'linear-gradient(180deg, rgba(99,102,241,0.5), transparent)',
                animation: 'float 2s ease-in-out infinite',
              }} />
            </div>
          )}

          {/* Section progress dots */}
          <div style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {sections.map((_, i) => (
              <div key={i} style={{
                width: i === visibleSection ? 3 : 2,
                height: i === visibleSection ? 20 : 8,
                borderRadius: 2,
                background: i === visibleSection ? '#6366f1' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats section */}
      <section style={{ padding: '100px 48px', borderTop: '1px solid rgba(99,102,241,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 100, padding: '5px 18px', marginBottom: 20,
              fontSize: 12, fontWeight: 600, color: '#818cf8', letterSpacing: '0.05em',
            }}>LA PLATEFORME EN CHIFFRES</div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(30px, 4vw, 52px)',
              fontWeight: 800, letterSpacing: '-0.02em',
            }}>
              Des résultats <span className="gradient-text">mesurables</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {stats.map(s => (
              <div key={s.value} className="glass card-lift" style={{ borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                <div style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 42, fontWeight: 800,
                  background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{s.value}</div>
                <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '80px 48px', background: 'rgba(12,12,24,0.5)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 100, padding: '5px 18px', marginBottom: 20,
              fontSize: 12, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.05em',
            }}>FONCTIONNALITÉS</div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(30px, 4vw, 52px)',
              fontWeight: 800, letterSpacing: '-0.02em',
            }}>
              Tout ce dont vous avez besoin<br />
              <span className="gradient-text">pour apprendre autrement</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} className="glass card-lift" style={{ borderRadius: 16, padding: 28 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 18,
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700,
                  marginBottom: 10, color: '#f1f5f9',
                }}>{f.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(30px, 4vw, 52px)',
              fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16,
            }}>Comment ça <span className="gradient-text">fonctionne</span></h2>
            <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Trois étapes simples pour transformer votre apprentissage
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
            {[
              { step: '01', title: 'Créez votre profil', desc: 'Indiquez votre niveau, vos objectifs et vos domaines d\'étude. L\'IA adapte immédiatement l\'expérience.', icon: '👤' },
              { step: '02', title: 'Apprenez et pratiquez', desc: 'Suivez vos cours, utilisez l\'assistant IA, analysez vos documents et générez des exercices personnalisés.', icon: '📚' },
              { step: '03', title: 'Progressez avec l\'IA', desc: 'Recevez des corrections intelligentes, des recommandations adaptées et suivez vos performances en temps réel.', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                {i < 2 && (
                  <div style={{
                    position: 'absolute', top: 30, left: '60%', width: '60%',
                    height: 1, background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)',
                  }} />
                )}
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                  border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, position: 'relative',
                }}>
                  {item.icon}
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                    color: '#6366f1', background: '#07070f',
                    border: '1px solid rgba(99,102,241,0.3)', borderRadius: '50%',
                    width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                </div>
                <h3 style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700,
                  marginBottom: 10, color: '#f1f5f9',
                }}>{item.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 48px', background: 'rgba(12,12,24,0.5)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(30px, 4vw, 48px)',
              fontWeight: 800, letterSpacing: '-0.02em',
            }}>Ce qu'ils en pensent</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {testimonials.map(t => (
              <div key={t.name} className="glass card-lift" style={{ borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.65, marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'white',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '120px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 100, padding: '5px 18px', marginBottom: 24,
            fontSize: 12, fontWeight: 600, color: '#818cf8',
          }}>COMMENCER GRATUITEMENT</div>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px, 5vw, 62px)',
            fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20,
          }}>
            Prêt à apprendre<br />
            <span className="gradient-text">autrement ?</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 17, lineHeight: 1.6, marginBottom: 36 }}>
            Rejoignez 50 000+ apprenants qui transforment leur façon d'étudier avec l'intelligence artificielle.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth?mode=register" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              Commencer maintenant — Gratuit →
            </Link>
            <Link to="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: '#94a3b8', fontSize: 16, fontWeight: 500, padding: '14px 28px',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
              textDecoration: 'none', background: 'rgba(255,255,255,0.03)',
              transition: 'all 0.2s',
            }}>Voir la démo</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(99,102,241,0.1)',
        padding: '48px 48px 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Logo size="icon" style={{ width: 22, height: 28 }} />
                <span style={{
                  fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13,
                  color: '#FFFFFF', letterSpacing: '0.03em',
                }}>Hub Éducatif <span style={{ color: '#D9A93A' }}>Multimodal</span></span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
                La plateforme d'apprentissage IA de nouvelle génération pour apprenants, formateurs et institutions.
              </p>
            </div>
            {[
              { title: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Sécurité', 'Roadmap'] },
              { title: 'Ressources', links: ['Documentation', 'API', 'Blog', 'Support'] },
              { title: 'Légal', links: ['Confidentialité', 'CGU', 'Cookies', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', marginBottom: 14 }}>{col.title}</div>
                {col.links.map(l => (
                  <a key={l} href="#" style={{
                    display: 'block', color: '#64748b', fontSize: 13, marginBottom: 8,
                    textDecoration: 'none', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                  >{l}</a>
                ))}
              </div>
            ))}
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ color: '#475569', fontSize: 12 }}>
              © 2026 Hub Éducatif Multimodal. Tous droits réservés.
            </div>
            <div style={{ color: '#475569', fontSize: 12 }}>
              Construit avec ✦ et Intelligence Artificielle
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
