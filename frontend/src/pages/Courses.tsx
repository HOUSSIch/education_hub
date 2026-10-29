import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { deleteCourse, getCourses, updateCourse } from '../api/courses';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types/course';

const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) return 'Cette action n’est pas autorisée.';
    if (error.response?.status === 404) return 'Le cours demandé est introuvable.';
  }
  return 'Impossible de charger ou modifier les cours. Réessayez plus tard.';
}

function teacherName(course: Course): string {
  const name = `${course.enseignant.first_name} ${course.enseignant.last_name}`.trim();
  return name || course.enseignant.username;
}

export default function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [workingId, setWorkingId] = useState<number | null>(null);

  const canManage = user?.role === 'ENSEIGNANT' || user?.role === 'ADMIN';
  const basePath = user?.role === 'ENSEIGNANT' ? '/teacher/courses' : user?.role === 'ADMIN' ? '/admin/courses' : '/courses';

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await getCourses());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCourses(); }, [loadCourses]);

  const filteredCourses = useMemo(() => courses.filter((course) => `${course.titre} ${course.description}`.toLowerCase().includes(search.toLowerCase())), [courses, search]);

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Supprimer définitivement le cours « ${course.titre} » ?`)) return;
    setWorkingId(course.id);
    setError(null);
    try {
      await deleteCourse(course.id);
      setCourses((items) => items.filter((item) => item.id !== course.id));
      setMessage('Cours supprimé.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId(null);
    }
  };

  const togglePublication = async (course: Course) => {
    setWorkingId(course.id);
    setError(null);
    try {
      const updated = await updateCourse(course.id, { is_published: !course.is_published });
      setCourses((items) => items.map((item) => item.id === updated.id ? updated : item));
      setMessage(updated.is_published ? 'Cours publié.' : 'Cours dépublié.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 26 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{user?.role === 'ETUDIANT' ? 'Mes cours' : 'Cours'}</h1>
            <p style={{ color: '#94a3b8', margin: '7px 0 0', fontSize: 14 }}>{user?.role === 'ETUDIANT' ? 'Découvrez les cours publiés par vos enseignants.' : 'Gérez les cours autorisés par votre rôle.'}</p>
          </div>
          {canManage && <Link to={`${basePath}/new`} className="btn-primary" style={{ padding: '10px 18px', fontSize: 13 }}>+ Créer un cours</Link>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, padding: '9px 13px' }}><span>🔍</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un cours…" style={{ width: '100%', background: 'none', border: 0, outline: 0, color: '#f1f5f9' }} /></div>
          <button onClick={() => void loadCourses()} className="btn-secondary" style={{ padding: '9px 14px', fontSize: 13 }}>Actualiser</button>
        </div>

        {message && <div style={{ color: '#86efac', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 13px', marginBottom: 16 }}>{message}</div>}
        {error && <div role="alert" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 13px', marginBottom: 16 }}>{error}</div>}

        {loading ? <div className="glass" style={{ borderRadius: 16, padding: 32, color: '#94a3b8' }}>Chargement des cours…</div> : filteredCourses.length === 0 ? <div className="glass" style={{ borderRadius: 16, padding: 32, color: '#94a3b8' }}>{search ? 'Aucun cours ne correspond à votre recherche.' : 'Aucun cours disponible pour le moment.'}</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {filteredCourses.map((course, index) => {
            const color = colors[index % colors.length];
            const isWorking = workingId === course.id;
            return <article key={course.id} className="glass card-lift" style={{ borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', minHeight: 230 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}><div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${color}18`, border: `1px solid ${color}35`, fontSize: 20 }}>📚</div><span style={{ alignSelf: 'flex-start', color: course.is_published ? '#86efac' : '#fbbf24', background: course.is_published ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 700 }}>{course.is_published ? '● Publié' : '● Brouillon'}</span></div>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, fontFamily: 'Outfit, sans-serif', margin: '0 0 8px' }}>{course.titre}</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.55, margin: 0, flex: 1 }}>{course.description || 'Aucune description.'}</p>
              <div style={{ color: '#64748b', fontSize: 12, margin: '14px 0' }}>👤 {teacherName(course)} · Mis à jour le {new Date(course.date_modification).toLocaleDateString('fr-FR')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Link to={`${basePath}/${course.id}`} className="btn-primary" style={{ padding: '8px 12px', fontSize: 12 }}>Voir le cours</Link>
                {canManage && <><Link to={`${basePath}/${course.id}/edit`} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>Modifier</Link><button disabled={isWorking} onClick={() => void togglePublication(course)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>{course.is_published ? 'Dépublier' : 'Publier'}</button><button disabled={isWorking} onClick={() => void handleDelete(course)} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>Supprimer</button></>}
              </div>
            </article>;
          })}
        </div>}
      </div>
    </AppLayout>
  );
}
