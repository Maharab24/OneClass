import axiosInstance from '../../../common/api/axiosInstance';

export const lmsApi = {
  classrooms: () => axiosInstance.get('/lms/classrooms').then((r) => r.data),
  classroom: (id) => axiosInstance.get(`/lms/classrooms/${id}`).then((r) => r.data),
  createClassroom: (payload) => axiosInstance.post('/lms/classrooms', payload).then((r) => r.data),
  updateClassroom: (id, payload) => axiosInstance.put(`/lms/classrooms/${id}`, payload).then((r) => r.data),
  activity: (id) => axiosInstance.get(`/lms/classrooms/${id}/activity`).then((r) => r.data),

  teachers: (id) => axiosInstance.get(`/lms/classrooms/${id}/teachers`).then((r) => r.data),
  addTeacher: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/teachers`, payload).then((r) => r.data),
  updatePermissions: (id, userId, permissions) =>
    axiosInstance.put(`/lms/classrooms/${id}/teachers/${userId}/permissions`, { permissions }).then((r) => r.data),
  removeTeacher: (id, userId) => axiosInstance.delete(`/lms/classrooms/${id}/teachers/${userId}`),

  students: (id) => axiosInstance.get(`/lms/classrooms/${id}/students`).then((r) => r.data),
  addStudent: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/students`, payload).then((r) => r.data),
  removeStudent: (id, userId) => axiosInstance.delete(`/lms/classrooms/${id}/students/${userId}`),

  enrollments: (classroomId) => axiosInstance.get(`/lms/classrooms/${classroomId}/enrollments`).then((r) => r.data),
  myEnrollments: () => axiosInstance.get('/lms/enrollments/mine').then((r) => r.data),
  enroll: (courseId, payload) => axiosInstance.post(`/lms/courses/${courseId}/enroll`, payload).then((r) => r.data),
  approveEnrollment: (id, reviewNote) => axiosInstance.post(`/lms/enrollments/${id}/approve`, { reviewNote }).then((r) => r.data),
  rejectEnrollment: (id, reviewNote) => axiosInstance.post(`/lms/enrollments/${id}/reject`, { reviewNote }).then((r) => r.data),

  searchCourses: (params) => axiosInstance.get('/lms/courses', { params }).then((r) => r.data),
  enrolledCourses: () => axiosInstance.get('/lms/courses/enrolled').then((r) => r.data),
  myCourses: () => axiosInstance.get('/lms/courses/mine').then((r) => r.data),
  classroomCourses: (classroomId) => axiosInstance.get(`/lms/classrooms/${classroomId}/courses`).then((r) => r.data),
  course: (id) => axiosInstance.get(`/lms/courses/${id}`).then((r) => r.data),
  createCourse: (payload) => axiosInstance.post('/lms/courses', payload).then((r) => r.data),
  updateCourse: (id, payload) => axiosInstance.put(`/lms/courses/${id}`, payload).then((r) => r.data),
  deleteCourse: (id) => axiosInstance.delete(`/lms/courses/${id}`),
  reviews: (id) => axiosInstance.get(`/lms/courses/${id}/reviews`).then((r) => r.data),
  upsertReview: (id, payload) => axiosInstance.post(`/lms/courses/${id}/reviews`, payload).then((r) => r.data),

  cart: () => axiosInstance.get('/lms/cart').then((r) => r.data),
  addToCart: (courseId) => axiosInstance.post(`/lms/cart/${courseId}`).then((r) => r.data),
  removeFromCart: (courseId) => axiosInstance.delete(`/lms/cart/${courseId}`),

  liveClasses: (id) => axiosInstance.get(`/lms/classrooms/${id}/live-classes`).then((r) => r.data),
  currentLive: async (id) => {
    const r = await axiosInstance.get(`/lms/classrooms/${id}/live-classes/current`, {
      validateStatus: (s) => s === 204 || (s >= 200 && s < 300),
    });
    return r.status === 204 ? null : r.data;
  },
  createLive: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/live-classes`, payload).then((r) => r.data),
  startLiveNow: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/live-classes/start`, payload).then((r) => r.data),
  startLive: (id, liveId) => axiosInstance.post(`/lms/classrooms/${id}/live-classes/${liveId}/start`).then((r) => r.data),
  endLive: (id, liveId) => axiosInstance.post(`/lms/classrooms/${id}/live-classes/${liveId}/end`).then((r) => r.data),

  classes: (id) => axiosInstance.get(`/lms/classrooms/${id}/classes`).then((r) => r.data),
  createClass: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/classes`, payload).then((r) => r.data),

  assignments: (id) => axiosInstance.get(`/lms/classrooms/${id}/assignments`).then((r) => r.data),
  createAssignment: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/assignments`, payload).then((r) => r.data),
  updateAssignment: (id, assignmentId, payload) =>
    axiosInstance.put(`/lms/classrooms/${id}/assignments/${assignmentId}`, payload).then((r) => r.data),
  submitAssignment: (id, assignmentId, payload) =>
    axiosInstance.post(`/lms/classrooms/${id}/assignments/${assignmentId}/submit`, payload).then((r) => r.data),
  submissions: (id, assignmentId) =>
    axiosInstance.get(`/lms/classrooms/${id}/assignments/${assignmentId}/submissions`).then((r) => r.data),
  gradeSubmission: (id, submissionId, payload) =>
    axiosInstance.post(`/lms/classrooms/${id}/submissions/${submissionId}/grade`, payload).then((r) => r.data),

  quizzes: (id) => axiosInstance.get(`/lms/classrooms/${id}/quizzes`).then((r) => r.data),
  createQuiz: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/quizzes`, payload).then((r) => r.data),
  updateQuiz: (id, quizId, payload) => axiosInstance.put(`/lms/classrooms/${id}/quizzes/${quizId}`, payload).then((r) => r.data),
  startQuiz: (id, quizId) => axiosInstance.post(`/lms/classrooms/${id}/quizzes/${quizId}/start`).then((r) => r.data),
  submitQuiz: (id, attemptId, payload) =>
    axiosInstance.post(`/lms/classrooms/${id}/quiz-attempts/${attemptId}/submit`, payload).then((r) => r.data),
  quizAttempts: (id, quizId) => axiosInstance.get(`/lms/classrooms/${id}/quizzes/${quizId}/attempts`).then((r) => r.data),
  gradeQuiz: (id, attemptId, grades) =>
    axiosInstance.post(`/lms/classrooms/${id}/quiz-attempts/${attemptId}/grade`, grades).then((r) => r.data),

  calendar: (id) => axiosInstance.get(`/lms/classrooms/${id}/calendar`).then((r) => r.data),
  createEvent: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/calendar`, payload).then((r) => r.data),
  deleteEvent: (id, eventId) => axiosInstance.delete(`/lms/classrooms/${id}/calendar/${eventId}`),

  announcements: (id) => axiosInstance.get(`/lms/classrooms/${id}/announcements`).then((r) => r.data),
  createAnnouncement: (id, payload) => axiosInstance.post(`/lms/classrooms/${id}/announcements`, payload).then((r) => r.data),

  notifications: () => axiosInstance.get('/lms/notifications').then((r) => r.data),
  markRead: (id) => axiosInstance.post(`/lms/notifications/${id}/read`),
  markAllRead: () => axiosInstance.post('/lms/notifications/read-all'),

  uploadFile: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axiosInstance.post('/lms/files', fd);
    return res.data;
  },
};

export const PERMISSIONS = [
  'ADMIN',
  'MANAGE_TEACHERS',
  'MANAGE_STUDENTS',
  'MANAGE_COURSES',
  'MANAGE_LIVE',
  'MANAGE_ASSIGNMENTS',
  'MANAGE_QUIZZES',
  'MANAGE_CALENDAR',
  'MANAGE_ANNOUNCEMENTS',
  'MANAGE_SETTINGS',
];

export function errMsg(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

export function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInputDate(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}
