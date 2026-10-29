import { AppLayout } from '../components/AppLayout';

export default function RolePlaceholder({ title }: { title: string }) {
  return (
    <AppLayout>
      <div style={{ padding: '28px 32px', maxWidth: 900 }}>
        <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
          <h1 style={{ color: '#f1f5f9', fontSize: 28, margin: '0 0 10px', fontFamily: 'Outfit, sans-serif' }}>{title}</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Cette page n’existe pas dans votre espace. Utilisez la navigation pour accéder aux fonctionnalités autorisées.</p>
        </div>
      </div>
    </AppLayout>
  );
}
