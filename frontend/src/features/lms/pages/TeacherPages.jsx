import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../common/context/AuthContext';
import axiosInstance from '../../../common/api/axiosInstance';
import { Presentation, Users, BookOpen, Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { lmsApi, errMsg } from '../api/lmsApi';
import { ErrorBanner, Empty, btnPrimary, btnGhost, inputClass } from '../components/LmsUi';

export default function TeacherHome() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    lmsApi.classrooms().then(setClassrooms).catch(() => {});
    lmsApi.notifications().then((n) => setPending(n.filter((x) => !x.read).length)).catch(() => {});
  }, []);

  const handleCreateWhiteboard = async () => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await axiosInstance.post('/rooms/create', { hostName: auth?.fullName });
      navigate('/whiteboard', { state: { room: res.data, currentUser: res.data.currentUser, returnTo: '/teacher/dashboard' } });
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create whiteboard room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await axiosInstance.post('/rooms/join', {
        roomCode: joinCode.trim().toUpperCase(),
        userName: auth?.fullName,
        requestedRole: 'CAN_WATCH',
      });
      navigate('/whiteboard', { state: { room: res.data, currentUser: res.data.currentUser, returnTo: '/teacher/dashboard' } });
    } catch (err) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Room not found or unable to join.';
      setJoinError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-purple-600/30 border border-white/10 p-8 md:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5" /> Teacher workspace
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{auth?.fullName || 'Teacher'}</span>
          </h2>
          <p className="text-slate-300 text-sm md:text-base">
            Manage classrooms, approve enrollments, run live whiteboard classes, assignments, and quizzes — without changing how you sign in.
          </p>
          {createError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2 max-w-md">
              <AlertCircle className="w-4 h-4" /> {createError}
            </div>
          )}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button onClick={handleCreateWhiteboard} disabled={isCreating} className={`${btnPrimary} flex items-center justify-center gap-2`}>
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Presentation className="w-5 h-5" />}
              Launch New Whiteboard
            </button>
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter 6-char Code" maxLength={6} className={`${inputClass} w-44 text-center font-mono tracking-wider`} />
              <button type="submit" disabled={isJoining || !joinCode.trim()} className={btnGhost}>
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Join <ArrowRight className="w-4 h-4 inline" /></>}
              </button>
            </form>
          </div>
          {joinError && <p className="text-rose-300 text-xs">{joinError}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/teacher/dashboard/classrooms" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50">
          <Users className="w-6 h-6 text-blue-400 mb-3" />
          <h3 className="font-bold">Classrooms</h3>
          <p className="text-sm text-slate-400">{classrooms.length} classroom{classrooms.length === 1 ? '' : 's'}</p>
        </Link>
        <Link to="/teacher/dashboard/notifications" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50">
          <BookOpen className="w-6 h-6 text-indigo-400 mb-3" />
          <h3 className="font-bold">Inbox</h3>
          <p className="text-sm text-slate-400">{pending} unread notification{pending === 1 ? '' : 's'}</p>
        </Link>
        <button onClick={handleCreateWhiteboard} className="text-left p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50">
          <Presentation className="w-6 h-6 text-emerald-400 mb-3" />
          <h3 className="font-bold">Interactive whiteboard</h3>
          <p className="text-sm text-slate-400">Same collaborative canvas as before.</p>
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Your classrooms</h3>
          <Link to="/teacher/dashboard/classrooms" className="text-xs text-indigo-300">View all</Link>
        </div>
        {classrooms.length === 0 && <Empty>Create a classroom to start managing courses and students.</Empty>}
        <div className="grid md:grid-cols-2 gap-3">
          {classrooms.slice(0, 4).map((c) => (
            <Link key={c.id} to={`/teacher/dashboard/classrooms/${c.id}`} className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-slate-400">{c.studentCount} students · {c.pendingEnrollments} pending {c.hasLiveClass ? '· LIVE' : ''}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeacherClassrooms() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const load = () => lmsApi.classrooms().then(setItems).catch((e) => setError(errMsg(e)));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">Classrooms</h2>
      <ErrorBanner error={error} />
      <form
        className="grid md:grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await lmsApi.createClassroom({ name, subject, description, published: true });
            setName('');
            setSubject('');
            setDescription('');
            load();
          } catch (e) {
            setError(errMsg(e));
          }
        }}
      >
        <input className={inputClass} required placeholder="Classroom name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <input className={inputClass} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className={btnPrimary} type="submit">Create classroom (you become admin)</button>
      </form>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((c) => (
          <Link key={c.id} to={`/teacher/dashboard/classrooms/${c.id}`} className="rounded-2xl border border-white/10 p-5 hover:border-indigo-500/40">
            <p className="text-xs text-indigo-300">{c.subject || 'Classroom'}</p>
            <h3 className="text-lg font-bold">{c.name}</h3>
            <p className="text-sm text-slate-400 mt-1">{c.description}</p>
            <p className="text-xs text-slate-500 mt-3">{c.studentCount} students · {c.pendingEnrollments} requests {c.admin ? '· Admin' : ''}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TeacherCourses() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    lmsApi.myCourses().then(setItems);
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Courses</h2>
      <p className="text-sm text-slate-400">Create courses from a classroom so they receive a unique Course ID and appear in the student catalog.</p>
      {items.map((c) => (
        <div key={c.id} className="rounded-xl border border-white/10 p-4">
          <p className="font-mono text-xs text-indigo-300">{c.courseCode}</p>
          <p className="font-bold">{c.title}</p>
          <p className="text-xs text-slate-400">{c.classroomName} · {c.published ? 'Published' : 'Draft'}</p>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPage({ home }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const load = () => lmsApi.notifications().then(setItems);
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-extrabold">Notifications</h2>
        <button className={btnGhost} onClick={() => lmsApi.markAllRead().then(load)}>Mark all read</button>
      </div>
      {items.map((n) => (
        <button
          key={n.id}
          className={`w-full text-left rounded-xl border p-4 ${n.read ? 'border-white/10' : 'border-indigo-400/40 bg-indigo-500/10'}`}
          onClick={async () => {
            await lmsApi.markRead(n.id);
            if (n.link) navigate(n.link);
            else load();
          }}
        >
          <p className="text-xs text-indigo-300">{n.type}</p>
          <p className="font-semibold">{n.title}</p>
          <p className="text-sm text-slate-300">{n.body}</p>
        </button>
      ))}
      {items.length === 0 && <Empty>No notifications yet.</Empty>}
    </div>
  );
}
