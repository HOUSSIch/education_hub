import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

const sections = ['Profil', 'Sécurité', 'Notifications', 'Apparence', 'Confidentialité', 'Comptes connectés'];

export default function Profile() {
  const [activeSection, setActiveSection] = useState('Profil');
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const displayName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || user?.username || '';
  const roleLabel = user?.role === 'ADMIN' ? 'Administrateur' : user?.role === 'ENSEIGNANT' ? 'Enseignant' : 'Étudiant';

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Input = ({ label, defaultValue, type = 'text', hint }: { label: string; defaultValue?: string; type?: string; hint?: string }) => (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>{label}</label>
      <input type={type} defaultValue={defaultValue} className="input-field" />
      {hint && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const Toggle = ({ label, desc, defaultChecked = true }: { label: string; desc: string; defaultChecked?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{desc}</div>
      </div>
      <label style={{ cursor: 'pointer', position: 'relative', display: 'block', width: 44, height: 24 }}>
        <input type="checkbox" defaultChecked={defaultChecked} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
          background: defaultChecked ? '#6366f1' : 'rgba(255,255,255,0.1)',
          borderRadius: 100, transition: 'all 0.3s',
        }}>
          <span style={{
            position: 'absolute', left: defaultChecked ? 22 : 2, top: 2, width: 20, height: 20,
            background: 'white', borderRadius: '50%', transition: 'all 0.3s',
          }} />
        </span>
      </label>
    </div>
  );

  return (
    <AppLayout role="learner">
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Section sidebar */}
        <div style={{ width: 220, background: '#0c0c18', borderRight: '1px solid rgba(99,102,241,0.08)', padding: '20px 12px' }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, padding: '0 6px 10px', letterSpacing: '0.06em' }}>PARAMÈTRES</div>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              background: activeSection === s ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: activeSection === s ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
              color: activeSection === s ? '#818cf8' : '#94a3b8', fontSize: 13, fontWeight: 500,
              marginBottom: 2, transition: 'all 0.15s',
            }}>{s}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }} className="scrollbar-custom">
          {activeSection === 'Profil' && (
            <div style={{ maxWidth: 580 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>Informations personnelles</h2>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: 'white', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{displayName}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>{roleLabel}</div>
                  <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Changer la photo</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input label="Prénom" defaultValue={user?.first_name} />
                  <Input label="Nom" defaultValue={user?.last_name} />
                </div>
                <Input label="Adresse email" defaultValue={user?.email} type="email" />
                <Input label="Numéro de téléphone" defaultValue="+33 6 12 34 56 78" type="tel" />
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>Bio</label>
                  <textarea className="input-field" rows={3} defaultValue="Étudiante en Master Informatique, passionnée par l'IA et les algorithmes." style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>Langue préférée</label>
                    <select className="input-field" style={{ cursor: 'pointer' }}>
                      {['Français', 'English', 'Español', 'العربية'].map(l => <option key={l} style={{ background: '#0d0d1a' }}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>Fuseau horaire</label>
                    <select className="input-field" style={{ cursor: 'pointer' }}>
                      {['Europe/Paris (UTC+1)', 'UTC', 'America/New_York'].map(t => <option key={t} style={{ background: '#0d0d1a' }}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }}>Annuler</button>
                <button onClick={save} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13 }}>
                  {saved ? '✓ Enregistré !' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'Sécurité' && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>Sécurité du compte</h2>
              <div className="glass" style={{ borderRadius: 14, padding: 22, marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Changer le mot de passe</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input label="Mot de passe actuel" type="password" />
                  <Input label="Nouveau mot de passe" type="password" hint="Minimum 8 caractères, majuscules, chiffres et symboles" />
                  <Input label="Confirmer le nouveau mot de passe" type="password" />
                </div>
                <button onClick={save} className="btn-primary" style={{ marginTop: 16, padding: '10px 20px', fontSize: 13 }}>
                  {saved ? '✓ Modifié !' : 'Modifier le mot de passe'}
                </button>
              </div>
              <div className="glass" style={{ borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Authentification à deux facteurs</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>Ajoutez une couche de sécurité supplémentaire à votre compte.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>Activer la 2FA</button>
                  <span className="badge badge-amber" style={{ alignSelf: 'center' }}>Non activé</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'Notifications' && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>Préférences de notifications</h2>
              <div className="glass" style={{ borderRadius: 14, padding: '4px 20px' }}>
                <Toggle label="Recommandations IA" desc="Nouvelles suggestions personnalisées de l'IA" />
                <Toggle label="Résultats d'évaluation" desc="Notification quand vos notes sont disponibles" />
                <Toggle label="Mises à jour des cours" desc="Nouveau contenu dans vos cours inscrits" />
                <Toggle label="Rappels d'examen" desc="Rappel 48h et 24h avant une évaluation" />
                <Toggle label="Badges et achievements" desc="Notification quand vous déverrouillez un badge" />
                <Toggle label="Résumé hebdomadaire" desc="Rapport de vos progrès chaque lundi matin" />
                <Toggle label="Emails marketing" desc="Nouvelles fonctionnalités et offres spéciales" defaultChecked={false} />
              </div>
            </div>
          )}

          {activeSection === 'Apparence' && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>Apparence</h2>
              <div className="glass" style={{ borderRadius: 14, padding: 22, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Thème</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { name: 'Sombre', bg: '#07070f', active: true },
                    { name: 'Clair', bg: '#f8fafc', active: false },
                    { name: 'Système', bg: 'linear-gradient(135deg, #07070f 50%, #f8fafc 50%)', active: false },
                  ].map(t => (
                    <button key={t.name} style={{
                      padding: '14px', borderRadius: 12, cursor: 'pointer',
                      background: t.active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      border: t.active ? '1.5px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ width: 32, height: 20, borderRadius: 6, background: t.bg, margin: '0 auto 8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <div style={{ fontSize: 12, color: t.active ? '#818cf8' : '#64748b', fontWeight: 600 }}>{t.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Couleur d'accentuation</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'].map(c => (
                    <button key={c} style={{
                      width: 32, height: 32, borderRadius: '50%', border: c === '#6366f1' ? '3px solid white' : '3px solid transparent',
                      background: c, cursor: 'pointer', transition: 'all 0.2s',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeSection === 'Confidentialité' || activeSection === 'Comptes connectés') && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>{activeSection}</h2>
              {activeSection === 'Confidentialité' ? (
                <div className="glass" style={{ borderRadius: 14, padding: '4px 20px' }}>
                  <Toggle label="Profil public" desc="Votre profil est visible par les autres apprenants" defaultChecked={false} />
                  <Toggle label="Partager les progrès" desc="Votre progression est visible dans le classement" />
                  <Toggle label="Collecte de données analytiques" desc="Aide à améliorer l'expérience d'apprentissage" />
                  <Toggle label="Personnalisation IA" desc="L'IA utilise vos données pour personnaliser les recommandations" />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { name: 'Google', icon: 'G', connected: true },
                    { name: 'Microsoft', icon: 'M', connected: false },
                    { name: 'GitHub', icon: 'GH', connected: true },
                    { name: 'LinkedIn', icon: 'in', connected: false },
                  ].map(acc => (
                    <div key={acc.name} className="glass" style={{ borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{acc.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{acc.name}</div>
                        <div style={{ fontSize: 12, color: acc.connected ? '#10b981' : '#64748b' }}>{acc.connected ? '✓ Connecté' : 'Non connecté'}</div>
                      </div>
                      <button className={acc.connected ? 'btn-secondary' : 'btn-primary'} style={{ padding: '6px 14px', fontSize: 12 }}>
                        {acc.connected ? 'Déconnecter' : 'Connecter'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
