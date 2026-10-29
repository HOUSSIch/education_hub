import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, homePathForRole } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseEditor from './pages/CourseEditor';
import Assignments from './pages/Assignments';
import AssignmentEditor from './pages/AssignmentEditor';
import AssignmentDetail from './pages/AssignmentDetail';
import Submissions from './pages/Submissions';
import SubmissionDetail from './pages/SubmissionDetail';
import Quizzes from './pages/Quizzes';
import QuizEditor from './pages/QuizEditor';
import QuizPlay from './pages/QuizPlay';
import Timetable from './pages/Timetable';
import AdminTimetables from './pages/AdminTimetables';
import AdminTimetableEditor from './pages/AdminTimetableEditor';
import TeacherPlanningComplaints from './pages/TeacherPlanningComplaints';
import AdminPlanningComplaints from './pages/AdminPlanningComplaints';
import Results from './pages/Results';
import Profile from './pages/Profile';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RolePlaceholder from './pages/RolePlaceholder';
import UserManagement from './pages/UserManagement';

function SessionRedirect() {
  const { loading, user } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homePathForRole(user.role) : '/auth'} replace />;
}

function PublicAuthRoute() {
  const { loading, user } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={homePathForRole(user.role)} replace /> : <Auth />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<SessionRedirect />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/auth" element={<PublicAuthRoute />} />

          <Route path="/dashboard" element={<ProtectedRoute roles={['ETUDIANT']}><Dashboard /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute roles={['ETUDIANT']}><Courses /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute roles={['ETUDIANT']}><CourseDetail /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute roles={['ETUDIANT']}><Assignments /></ProtectedRoute>} />
          <Route path="/assignments/:id" element={<ProtectedRoute roles={['ETUDIANT']}><AssignmentDetail /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute roles={['ETUDIANT']}><Quizzes /></ProtectedRoute>} />
          <Route path="/quizzes/:id/play" element={<ProtectedRoute roles={['ETUDIANT']}><QuizPlay /></ProtectedRoute>} />
          <Route path="/planning" element={<ProtectedRoute roles={['ETUDIANT']}><Timetable /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute roles={['ETUDIANT']}><Results /></ProtectedRoute>} />

          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['ENSEIGNANT']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/courses" element={<ProtectedRoute roles={['ENSEIGNANT']}><Courses /></ProtectedRoute>} />
          <Route path="/teacher/courses/new" element={<ProtectedRoute roles={['ENSEIGNANT']}><CourseEditor /></ProtectedRoute>} />
          <Route path="/teacher/courses/:id/edit" element={<ProtectedRoute roles={['ENSEIGNANT']}><CourseEditor /></ProtectedRoute>} />
          <Route path="/teacher/courses/:id" element={<ProtectedRoute roles={['ENSEIGNANT']}><CourseDetail /></ProtectedRoute>} />
          <Route path="/teacher/assignments" element={<ProtectedRoute roles={['ENSEIGNANT']}><Assignments /></ProtectedRoute>} />
          <Route path="/teacher/assignments/new" element={<ProtectedRoute roles={['ENSEIGNANT']}><AssignmentEditor /></ProtectedRoute>} />
          <Route path="/teacher/assignments/:id/edit" element={<ProtectedRoute roles={['ENSEIGNANT']}><AssignmentEditor /></ProtectedRoute>} />
          <Route path="/teacher/assignments/:id" element={<ProtectedRoute roles={['ENSEIGNANT']}><AssignmentDetail /></ProtectedRoute>} />
          <Route path="/teacher/quizzes" element={<ProtectedRoute roles={['ENSEIGNANT']}><Quizzes /></ProtectedRoute>} />
          <Route path="/teacher/quizzes/new" element={<ProtectedRoute roles={['ENSEIGNANT']}><QuizEditor /></ProtectedRoute>} />
          <Route path="/teacher/quizzes/:id/edit" element={<ProtectedRoute roles={['ENSEIGNANT']}><QuizEditor /></ProtectedRoute>} />
          <Route path="/teacher/results" element={<ProtectedRoute roles={['ENSEIGNANT']}><Results /></ProtectedRoute>} />
          <Route path="/teacher/planning" element={<ProtectedRoute roles={['ENSEIGNANT']}><Timetable /></ProtectedRoute>} />
          <Route path="/teacher/planning/complaints" element={<ProtectedRoute roles={['ENSEIGNANT']}><TeacherPlanningComplaints /></ProtectedRoute>} />
          <Route path="/teacher/submissions" element={<ProtectedRoute roles={['ENSEIGNANT']}><Submissions /></ProtectedRoute>} />
          <Route path="/teacher/submissions/:id" element={<ProtectedRoute roles={['ENSEIGNANT']}><SubmissionDetail /></ProtectedRoute>} />
          <Route path="/teacher/*" element={<ProtectedRoute roles={['ENSEIGNANT']}><RolePlaceholder title="Espace enseignant" /></ProtectedRoute>} />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute roles={['ADMIN']}><Courses /></ProtectedRoute>} />
          <Route path="/admin/courses/new" element={<ProtectedRoute roles={['ADMIN']}><CourseEditor /></ProtectedRoute>} />
          <Route path="/admin/courses/:id/edit" element={<ProtectedRoute roles={['ADMIN']}><CourseEditor /></ProtectedRoute>} />
          <Route path="/admin/courses/:id" element={<ProtectedRoute roles={['ADMIN']}><CourseDetail /></ProtectedRoute>} />
          <Route path="/admin/assignments" element={<ProtectedRoute roles={['ADMIN']}><Assignments /></ProtectedRoute>} />
          <Route path="/admin/assignments/new" element={<ProtectedRoute roles={['ADMIN']}><AssignmentEditor /></ProtectedRoute>} />
          <Route path="/admin/assignments/:id/edit" element={<ProtectedRoute roles={['ADMIN']}><AssignmentEditor /></ProtectedRoute>} />
          <Route path="/admin/assignments/:id" element={<ProtectedRoute roles={['ADMIN']}><AssignmentDetail /></ProtectedRoute>} />
          <Route path="/admin/submissions" element={<ProtectedRoute roles={['ADMIN']}><Submissions /></ProtectedRoute>} />
          <Route path="/admin/submissions/:id" element={<ProtectedRoute roles={['ADMIN']}><SubmissionDetail /></ProtectedRoute>} />
          <Route path="/admin/quizzes" element={<ProtectedRoute roles={['ADMIN']}><Quizzes /></ProtectedRoute>} />
          <Route path="/admin/quizzes/new" element={<ProtectedRoute roles={['ADMIN']}><QuizEditor /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id/edit" element={<ProtectedRoute roles={['ADMIN']}><QuizEditor /></ProtectedRoute>} />
          <Route path="/admin/results" element={<ProtectedRoute roles={['ADMIN']}><Results /></ProtectedRoute>} />
          <Route path="/admin/planning" element={<ProtectedRoute roles={['ADMIN']}><AdminTimetables /></ProtectedRoute>} />
          <Route path="/admin/planning/new" element={<ProtectedRoute roles={['ADMIN']}><AdminTimetableEditor /></ProtectedRoute>} />
          <Route path="/admin/planning/:id" element={<ProtectedRoute roles={['ADMIN']}><AdminTimetableEditor /></ProtectedRoute>} />
          <Route path="/admin/planning/complaints" element={<ProtectedRoute roles={['ADMIN']}><AdminPlanningComplaints /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute roles={['ADMIN']}><RolePlaceholder title="Administration" /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<SessionRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
