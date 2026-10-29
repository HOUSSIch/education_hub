import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { OrbCanvas } from '../components/OrbCanvas';
import { Logo } from '../components/Logo';
import { homePathForRole } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';

function messageForError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) return 'Nom d’utilisateur ou mot de passe incorrect.';
    if (!error.response) return 'Le serveur est inaccessible. Vérifiez que Django est démarré.';
  }
  return 'La connexion a échoué. Veuillez réessayer.';
}

export default function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username, password, remember);
      navigate(homePathForRole(user.role), { replace: true });
    } catch (requestError) {
      setError(messageForError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)', borderRight: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32 }}>
        <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><Logo size="icon" style={{ width: 30, height: 38 }} /><span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '0.03em' }}>Hub Éducatif <span style={{ color: '#D9A93A' }}>Multimodal</span></span></Link>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '80%', maxWidth: 400, aspectRatio: '1', position: 'relative' }}><OrbCanvas morphState={0} /><div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>« L’apprentissage augmenté par l’intelligence artificielle »</div></div></div>
        <div style={{display:'flex',gap:18,color:'#94a3b8',fontSize:12}}><span>Accès sécurisé</span><span>·</span><span>Plateforme pédagogique</span><span>·</span><span>Données Django</span></div>
      </div>
      <div style={{ width: 480, padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
        <div style={{ marginBottom: 36 }}><h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, color: '#f1f5f9' }}>Bon retour</h1><p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.5 }}>Connectez-vous pour continuer votre apprentissage.</p></div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>Nom d’utilisateur<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="input-field" placeholder="Votre nom d’utilisateur" style={{ marginTop: 7 }} /></label>
          <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, position: 'relative' }}>Mot de passe<input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required type={showPassword ? 'text' : 'password'} className="input-field" placeholder="Votre mot de passe" style={{ marginTop: 7, paddingRight: 42 }} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} style={{ position: 'absolute', right: 14, bottom: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} aria-label="Afficher ou masquer le mot de passe"><Icon name="profile" size={17}/></button></label>
          <label style={{display:'flex',alignItems:'center',gap:9,color:'#cbd5e1',fontSize:13,cursor:'pointer'}}><input type="checkbox" checked={remember} onChange={(event)=>setRemember(event.target.checked)}/> Se souvenir de moi</label>
          {error && <div role="alert" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 13, fontSize: 15, opacity: loading ? 0.7 : 1 }}>{loading ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#64748b' }}>Votre rôle est attribué par la plateforme après authentification.</div>
        <div style={{ marginTop: 32, padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="check" size={18} style={{color:'#86efac'}}/><span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>Connexion sécurisée par JWT. Les données affichées proviennent de votre compte Django.</span></div>
      </div>
    </div>
  );
}
