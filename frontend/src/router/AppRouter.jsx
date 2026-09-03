import { Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage.jsx'
import RoleSelectPage from '../pages/RoleSelectPage.jsx'
import TeacherLoginPage from '../pages/TeacherLoginPage.jsx'
import TeacherRegisterPage from '../pages/TeacherRegisterPage.jsx'
import StudentLoginPage from '../pages/StudentLoginPage.jsx'
import StudentRegisterPage from '../pages/StudentRegisterPage.jsx'
import TeacherDashboard from '../pages/TeacherDashboard.jsx'
import StudentDashboard from '../pages/StudentDashboard.jsx'
import VerifyOtpPage from '../pages/VerifyOtpPage.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'

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
