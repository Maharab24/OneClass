import { Routes, Route } from 'react-router-dom'
import LandingPage from '../features/landing/pages/LandingPage.jsx'
import RoleSelectPage from '../features/auth/pages/RoleSelectPage.jsx'
import TeacherLoginPage from '../features/auth/pages/TeacherLoginPage.jsx'
import TeacherRegisterPage from '../features/auth/pages/TeacherRegisterPage.jsx'
import StudentLoginPage from '../features/auth/pages/StudentLoginPage.jsx'
import StudentRegisterPage from '../features/auth/pages/StudentRegisterPage.jsx'
import TeacherDashboard from '../features/dashboard/pages/TeacherDashboard.jsx'
import StudentDashboard from '../features/dashboard/pages/StudentDashboard.jsx'
import VerifyOtpPage from '../features/auth/pages/VerifyOtpPage.jsx'
import ProtectedRoute from '../common/components/ProtectedRoute.jsx'


export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/select-role" element={<RoleSelectPage />} />

      <Route path="/teacher/login" element={<TeacherLoginPage />} />
      <Route path="/teacher/register" element={<TeacherRegisterPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/student/register" element={<StudentRegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
