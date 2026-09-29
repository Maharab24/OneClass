import React from 'react';
import { LayoutDashboard, BookOpen, ShoppingCart, ClipboardList, Bell } from 'lucide-react';
import DashboardShell from '../../lms/components/DashboardShell';

export default function StudentDashboard() {
  return (
    <DashboardShell
      brand="Student Portal"
      accent="from-purple-600 to-pink-600"
      bellTo="/student/dashboard/notifications"
      nav={[
        { to: '/student/dashboard', end: true, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/student/dashboard/courses', label: 'All Courses', icon: <BookOpen className="w-4 h-4" /> },
        { to: '/student/dashboard/cart', label: 'Course cart', icon: <ShoppingCart className="w-4 h-4" /> },
        { to: '/student/dashboard/enrollments', label: 'Enrollments', icon: <ClipboardList className="w-4 h-4" /> },
        { to: '/student/dashboard/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      ]}
    />
  );
}
