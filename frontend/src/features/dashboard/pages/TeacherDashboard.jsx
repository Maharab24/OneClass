import React from 'react';
import { LayoutDashboard, Users, BookOpen, Bell } from 'lucide-react';
import DashboardShell from '../../lms/components/DashboardShell';

export default function TeacherDashboard() {
  return (
    <DashboardShell
      brand="Teacher Portal"
      accent="from-blue-600 to-indigo-600"
      bellTo="/teacher/dashboard/notifications"
      nav={[
        { to: '/teacher/dashboard', end: true, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/teacher/dashboard/classrooms', label: 'Classrooms', icon: <Users className="w-4 h-4" /> },
        { to: '/teacher/dashboard/courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
        { to: '/teacher/dashboard/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      ]}
    />
  );
}
