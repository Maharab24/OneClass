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
import TeacherHome, { TeacherClassrooms, TeacherCourses, NotificationsPage } from '../features/lms/pages/TeacherPages';
import StudentHome, { AllCoursesPage, CourseDetailsPage, CartPage, StudentEnrollmentsPage } from '../features/lms/pages/StudentPages';
import ClassroomWorkspace from '../features/lms/pages/ClassroomWorkspace';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/select-role" element={<RoleSelectPage />} />

      {/* Auth Routes — unchanged */}
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
      >
        <Route index element={<TeacherHome />} />
        <Route path="classrooms" element={<TeacherClassrooms />} />
        <Route path="classrooms/:classroomId" element={<ClassroomWorkspace mode="teacher" />} />
        <Route path="courses" element={<TeacherCourses />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="courses" element={<AllCoursesPage />} />
        <Route path="courses/:courseId" element={<CourseDetailsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="enrollments" element={<StudentEnrollmentsPage />} />
        <Route path="classrooms/:classroomId" element={<ClassroomWorkspace mode="student" />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route
        path="/whiteboard"
        element={
          <ProtectedRoute>
            <WhiteboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
