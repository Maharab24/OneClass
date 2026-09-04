import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../features/landing/pages/LandingPage';
import RoleSelectPage from '../features/auth/pages/RoleSelectPage';
import TeacherLoginPage from '../features/auth/pages/TeacherLoginPage';
import TeacherRegisterPage from '../features/auth/pages/TeacherRegisterPage';
import StudentLoginPage from '../features/auth/pages/StudentLoginPage';
import StudentRegisterPage from '../features/auth/pages/StudentRegisterPage';
import VerifyOtpPage from '../features/auth/pages/VerifyOtpPage';
import TeacherDashboard from '../features/dashboard/pages/TeacherDashboard';
import StudentDashboard from '../features/dashboard/pages/StudentDashboard';
import WhiteboardPage from '../features/whiteboard/pages/WhiteboardPage';
import ProtectedRoute from '../common/components/ProtectedRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/select-role" element={<RoleSelectPage />} />

      {/* Auth Routes */}
      <Route path="/teacher/login" element={<TeacherLoginPage />} />
      <Route path="/teacher/register" element={<TeacherRegisterPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/student/register" element={<StudentRegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      {/* Role-Protected Dashboards */}
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

      {/* Collaborative Whiteboard Classroom */}
      <Route path="/whiteboard" element={<WhiteboardPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
