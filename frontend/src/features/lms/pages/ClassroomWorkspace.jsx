import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../common/context/AuthContext';
import axiosInstance from '../../../common/api/axiosInstance';
import { lmsApi, errMsg, formatWhen, fromInputDate, PERMISSIONS } from '../api/lmsApi';
import { CourseCard, Empty, ErrorBanner, Field, Panel, StatusPill, btnGhost, btnPrimary, inputClass } from '../components/LmsUi';
import { Loader2, Radio, ArrowLeft } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'classes', label: 'Classes' },
  { id: 'live', label: 'Live Class' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'courses', label: 'Courses' },
  { id: 'people', label: 'People' },
  { id: 'enrollments', label: 'Enrollments' },
  { id: 'settings', label: 'Settings' },
];

export default function ClassroomWorkspace({ mode }) {
  const { classroomId } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const isTeacher = mode === 'teacher';

  const [classroom, setClassroom] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const reloadClassroom = useCallback(async () => {
    const data = await lmsApi.classroom(classroomId);
    setClassroom(data);
  }, [classroomId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await lmsApi.classroom(classroomId);
        if (!cancelled) setClassroom(data);
      } catch (e) {
        if (!cancelled) setError(errMsg(e, 'Unable to load classroom'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  const visibleTabs = useMemo(() => {
    if (isTeacher) return TABS;
    return TABS.filter((t) => !['people', 'enrollments', 'settings'].includes(t.id));
  }, [isTeacher]);

  const joinWhiteboard = async (roomCode, asHostRoom) => {
    if (asHostRoom) {
      navigate('/whiteboard', {
        state: { room: asHostRoom, currentUser: asHostRoom.currentUser, returnTo: window.location.pathname + window.location.search },
      });
      return;
    }
    const res = await axiosInstance.post('/rooms/join', {
      roomCode,
      userName: auth?.fullName,
      requestedRole: isTeacher ? 'CAN_EDIT' : 'CAN_WATCH',
    });
    navigate('/whiteboard', {
      state: {
        room: res.data,
        currentUser: res.data.currentUser,
        returnTo: `${isTeacher ? '/teacher' : '/student'}/dashboard/classrooms/${classroomId}?tab=live`,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading classroom...
      </div>
    );
  }

  if (error) return <ErrorBanner error={error} />;
  if (!classroom) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(isTeacher ? '/teacher/dashboard/classrooms' : '/student/dashboard')}
        className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/25 to-slate-900 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">{classroom.subject || 'Classroom'}</p>
            <h2 className="text-3xl font-extrabold mt-1">{classroom.name}</h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">{classroom.description || 'No description yet.'}</p>
            <p className="text-xs text-slate-400 mt-3">
              Admin: {classroom.creatorName} · {classroom.studentCount} students · {classroom.teacherCount} teachers
              {classroom.inviteCode ? ` · Invite ${classroom.inviteCode}` : ''}
            </p>
          </div>
          {classroom.hasLiveClass && (
            <button
              onClick={() => setTab('live')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm font-semibold animate-pulse"
            >
              <Radio className="w-4 h-4" /> Live class in progress
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
              tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab classroomId={classroomId} isTeacher={isTeacher} />}
      {tab === 'classes' && <ClassesTab classroomId={classroomId} isTeacher={isTeacher} />}
      {tab === 'live' && (
        <LiveTab classroomId={classroomId} isTeacher={isTeacher} joinWhiteboard={joinWhiteboard} classroom={classroom} />
      )}
      {tab === 'assignments' && <AssignmentsTab classroomId={classroomId} isTeacher={isTeacher} />}
      {tab === 'quizzes' && <QuizzesTab classroomId={classroomId} isTeacher={isTeacher} />}
      {tab === 'calendar' && <CalendarTab classroomId={classroomId} isTeacher={isTeacher} />}
      {tab === 'announcements' && <AnnouncementsTab classroomId={classroomId} isTeacher={isTeacher} />}
      {tab === 'courses' && <CoursesTab classroomId={classroomId} isTeacher={isTeacher} />}
      {tab === 'people' && isTeacher && <PeopleTab classroomId={classroomId} classroom={classroom} />}
      {tab === 'enrollments' && isTeacher && <EnrollmentsTab classroomId={classroomId} />}
      {tab === 'settings' && isTeacher && <SettingsTab classroom={classroom} onSaved={reloadClassroom} />}
    </div>
  );
}

function OverviewTab({ classroomId, isTeacher }) {
  const [activity, setActivity] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  useEffect(() => {
    lmsApi.activity(classroomId).then(setActivity).catch(() => {});
    lmsApi.announcements(classroomId).then(setAnnouncements).catch(() => {});
  }, [classroomId]);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Panel title="Classroom activity">
        {activity ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Students" value={activity.approvedStudents} />
            <Stat label="Pending" value={activity.pendingEnrollments} />
            <Stat label="Assignments" value={activity.assignmentCount} />
            <Stat label="Quizzes" value={activity.quizCount} />
          </div>
        ) : (
          <Empty>No activity yet.</Empty>
        )}
      </Panel>
      <Panel title="Announcements">
        {announcements.length === 0 && <Empty>No announcements.</Empty>}
        <div className="space-y-3">
          {announcements.slice(0, 4).map((a) => (
            <div key={a.id} className="text-sm">
              <p className="font-semibold">{a.title}</p>
              <p className="text-slate-400">{a.body}</p>
            </div>
          ))}
        </div>
        {isTeacher && <p className="text-xs text-slate-500">Post from the Announcements tab.</p>}
      </Panel>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ClassesTab({ classroomId, isTeacher }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', startsAt: '', endsAt: '', meetingNote: '' });

  const load = () => lmsApi.classes(classroomId).then(setItems).catch((e) => setError(errMsg(e)));
  useEffect(() => {
    load();
  }, [classroomId]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await lmsApi.createClass(classroomId, {
        ...form,
        startsAt: fromInputDate(form.startsAt),
        endsAt: fromInputDate(form.endsAt),
      });
      setForm({ title: '', description: '', startsAt: '', endsAt: '', meetingNote: '' });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-4">
      <ErrorBanner error={error} />
      {isTeacher && (
        <form onSubmit={create} className="grid md:grid-cols-2 gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
          <Field label="Class title">
            <input className={inputClass} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Starts">
            <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </Field>
          <Field label="Ends">
            <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </Field>
          <Field label="Notes">
            <input className={inputClass} value={form.meetingNote} onChange={(e) => setForm({ ...form, meetingNote: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <button className={btnPrimary} type="submit">Add class</button>
          </div>
        </form>
      )}
      {items.length === 0 && <Empty>No scheduled classes.</Empty>}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/10 p-4">
            <p className="font-semibold">{c.title}</p>
            <p className="text-xs text-slate-400">{formatWhen(c.startsAt)} — {formatWhen(c.endsAt)}</p>
            {c.description && <p className="text-sm text-slate-300 mt-1">{c.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveTab({ classroomId, isTeacher, joinWhiteboard }) {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(null);
  const [title, setTitle] = useState('Live class');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [list, live] = await Promise.all([lmsApi.liveClasses(classroomId), lmsApi.currentLive(classroomId)]);
    setItems(list);
    setCurrent(live);
  };

  useEffect(() => {
    load().catch((e) => setError(errMsg(e)));
    const t = setInterval(() => load().catch(() => {}), 8000);
    return () => clearInterval(t);
  }, [classroomId]);

  const startNow = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await lmsApi.startLiveNow(classroomId, { title });
      await joinWhiteboard(res.liveClass?.whiteboardRoomCode, res.room);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const startExisting = async (id) => {
    setBusy(true);
    try {
      const res = await lmsApi.startLive(classroomId, id);
      await joinWhiteboard(res.liveClass?.whiteboardRoomCode, res.room);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorBanner error={error} />
      {current?.status === 'LIVE' && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-emerald-200">Live now: {current.title}</p>
            <p className="text-xs text-slate-300">Whiteboard code {current.whiteboardRoomCode}</p>
          </div>
          <div className="flex gap-2">
            <button className={btnPrimary} onClick={() => joinWhiteboard(current.whiteboardRoomCode)}>Join whiteboard</button>
            {isTeacher && (
              <button className={btnGhost} onClick={() => lmsApi.endLive(classroomId, current.id).then(load)}>End</button>
            )}
          </div>
        </div>
      )}
      {isTeacher && (
        <div className="flex flex-wrap gap-2">
          <input className={`${inputClass} max-w-sm`} value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className={btnPrimary} disabled={busy} onClick={startNow}>
            {busy ? 'Starting...' : 'Start interactive live class'}
          </button>
        </div>
      )}
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="rounded-xl border border-white/10 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="text-xs text-slate-400">{formatWhen(s.scheduledAt || s.startedAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={s.status} />
              {isTeacher && s.status !== 'LIVE' && s.status !== 'ENDED' && (
                <button className={btnGhost} onClick={() => startExisting(s.id)}>Start</button>
              )}
              {s.status === 'LIVE' && (
                <button className={btnPrimary} onClick={() => joinWhiteboard(s.whiteboardRoomCode)}>Join</button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <Empty>No live classes yet. Teachers can start one at any time.</Empty>}
      </div>
    </div>
  );
}

function AssignmentsTab({ classroomId, isTeacher }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', maxMarks: 100, published: true });
  const [openId, setOpenId] = useState(null);
  const [subs, setSubs] = useState([]);

  const load = () => lmsApi.assignments(classroomId).then(setItems).catch((e) => setError(errMsg(e)));
  useEffect(() => {
    load();
  }, [classroomId]);

  const uploadQuestion = async (file) => {
    const stored = await lmsApi.uploadFile(file);
    setForm((f) => ({ ...f, questionFileName: stored.originalName, questionFileUrl: stored.url }));
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await lmsApi.createAssignment(classroomId, { ...form, deadline: fromInputDate(form.deadline) });
      setForm({ title: '', description: '', deadline: '', maxMarks: 100, published: true });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const submit = async (assignment) => {
    const content = window.prompt('Submission text');
    if (content == null) return;
    try {
      await lmsApi.submitAssignment(classroomId, assignment.id, { content });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const submitFile = async (assignment, file) => {
    try {
      const stored = await lmsApi.uploadFile(file);
      await lmsApi.submitAssignment(classroomId, assignment.id, {
        content: 'File submission',
        fileName: stored.originalName,
        fileUrl: stored.url,
      });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const openSubs = async (id) => {
    setOpenId(id);
    setSubs(await lmsApi.submissions(classroomId, id));
  };

  const grade = async (submission) => {
    const grade = window.prompt('Grade', submission.grade || '');
    if (grade == null) return;
    const feedback = window.prompt('Feedback', submission.feedback || '') || '';
    await lmsApi.gradeSubmission(classroomId, submission.id, { grade: Number(grade), feedback });
    openSubs(openId);
    load();
  };

  return (
    <div className="space-y-4">
      <ErrorBanner error={error} />
      {isTeacher && (
        <form onSubmit={create} className="grid md:grid-cols-2 gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
          <Field label="Title">
            <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Deadline">
            <input type="datetime-local" className={inputClass} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <Field label="Max marks">
            <input type="number" className={inputClass} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} />
          </Field>
          <Field label="Question file">
            <input type="file" className="text-xs" onChange={(e) => e.target.files[0] && uploadQuestion(e.target.files[0])} />
          </Field>
          <div className="md:col-span-2">
            <textarea className={inputClass} rows={3} placeholder="Instructions" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className={btnPrimary} type="submit">Publish assignment</button>
        </form>
      )}
      {items.map((a) => (
        <div key={a.id} className="rounded-2xl border border-white/10 p-4 space-y-2">
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-bold">{a.title}</p>
              <p className="text-xs text-slate-400">Due {formatWhen(a.deadline)} · {a.maxMarks || 0} marks · {a.submissionCount} submissions</p>
            </div>
            {isTeacher && <button className={btnGhost} onClick={() => openSubs(a.id)}>Review</button>}
          </div>
          <p className="text-sm text-slate-300">{a.description}</p>
          {a.questionFileUrl && (
            <a className="text-xs text-indigo-300" href={a.questionFileUrl} target="_blank" rel="noreferrer">
              {a.questionFileName || 'Question file'}
            </a>
          )}
          {!isTeacher && (
            <div className="flex flex-wrap gap-2 items-center">
              <button className={btnPrimary} onClick={() => submit(a)}>Submit text</button>
              <input type="file" className="text-xs" onChange={(e) => e.target.files[0] && submitFile(a, e.target.files[0])} />
              {a.mySubmission && (
                <span className="text-xs text-emerald-300">
                  Submitted {formatWhen(a.mySubmission.submittedAt)}
                  {a.mySubmission.grade != null ? ` · Grade ${a.mySubmission.grade}` : ''}
                </span>
              )}
            </div>
          )}
          {openId === a.id && isTeacher && (
            <div className="space-y-2 pt-2">
              {subs.map((s) => (
                <div key={s.id} className="rounded-xl bg-black/20 p-3 text-sm">
                  <p className="font-semibold">{s.studentName} · {s.studentEmail}</p>
                  <p className="text-slate-300">{s.content}</p>
                  {s.fileUrl && <a className="text-indigo-300 text-xs" href={s.fileUrl}>{s.fileName}</a>}
                  <p className="text-xs text-slate-400">Grade: {s.grade ?? '—'} {s.feedback ? `· ${s.feedback}` : ''}</p>
                  <button className="text-xs text-indigo-300 mt-1" onClick={() => grade(s)}>Grade</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuizzesTab({ classroomId, isTeacher }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    durationMinutes: 20,
    maxAttempts: 1,
    deadline: '',
    scheduledAt: '',
    published: true,
    showResultsToStudents: true,
    questions: [{ type: 'MCQ', prompt: '', marks: 1, options: ['', '', '', ''], correctOptionIndex: 0 }],
  });
  const [taking, setTaking] = useState(null);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState([]);

  const load = () => lmsApi.quizzes(classroomId).then(setItems).catch((e) => setError(errMsg(e)));
  useEffect(() => {
    load();
  }, [classroomId]);

  const addQuestion = (type) => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        type === 'SHORT'
          ? { type: 'SHORT', prompt: '', marks: 2, sampleAnswer: '' }
          : { type: 'MCQ', prompt: '', marks: 1, options: ['', '', '', ''], correctOptionIndex: 0 },
      ],
    });
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await lmsApi.createQuiz(classroomId, {
        ...form,
        deadline: fromInputDate(form.deadline),
        scheduledAt: fromInputDate(form.scheduledAt),
        questions: form.questions.map((q, i) => ({ ...q, sortOrder: i })),
      });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const start = async (quiz) => {
    try {
      const attempt = await lmsApi.startQuiz(classroomId, quiz.id);
      setTaking({ quiz, attempt });
      setAnswers({});
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const submit = async () => {
    const payload = {
      answers: taking.quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: answers[q.id]?.selectedOptionIndex ?? null,
        shortAnswer: answers[q.id]?.shortAnswer || '',
      })),
    };
    try {
      await lmsApi.submitQuiz(classroomId, taking.attempt.id, payload);
      setTaking(null);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const openAttempts = async (quizId) => {
    setAttempts(await lmsApi.quizAttempts(classroomId, quizId));
  };

  const gradeAttempt = async (attempt) => {
    const grades = [];
    for (const a of attempt.answers.filter((x) => x.questionType === 'SHORT')) {
      const marks = window.prompt(`Marks for: ${a.prompt}`, a.marksAwarded || 0);
      if (marks == null) return;
      grades.push({ answerId: a.id, marksAwarded: Number(marks) });
    }
    await lmsApi.gradeQuiz(classroomId, attempt.id, grades);
    openAttempts(attempt.quizId);
  };

  if (taking) {
    return (
      <div className="space-y-4">
        <ErrorBanner error={error} />
        <h3 className="text-xl font-bold">{taking.quiz.title}</h3>
        {taking.quiz.questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border border-white/10 p-4 space-y-2">
            <p className="font-semibold">{idx + 1}. {q.prompt} <span className="text-xs text-slate-400">({q.marks} marks · {q.type})</span></p>
            {q.type === 'MCQ' &&
              (q.options || []).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    onChange={() => setAnswers({ ...answers, [q.id]: { selectedOptionIndex: i } })}
                  />
                  {opt}
                </label>
              ))}
            {q.type === 'SHORT' && (
              <textarea
                className={inputClass}
                rows={3}
                onChange={(e) => setAnswers({ ...answers, [q.id]: { shortAnswer: e.target.value } })}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <button className={btnPrimary} onClick={submit}>Submit quiz</button>
          <button className={btnGhost} onClick={() => setTaking(null)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ErrorBanner error={error} />
      {isTeacher && (
        <form onSubmit={create} className="space-y-3 rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Title"><input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Duration (min)"><input type="number" className={inputClass} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></Field>
            <Field label="Attempts"><input type="number" className={inputClass} value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })} /></Field>
            <Field label="Deadline"><input type="datetime-local" className={inputClass} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            <Field label="Schedule publish"><input type="datetime-local" className={inputClass} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></Field>
          </div>
          {form.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-white/10 p-3 space-y-2">
              <p className="text-xs font-bold text-indigo-300">{q.type}</p>
              <input className={inputClass} placeholder="Question" value={q.prompt} onChange={(e) => {
                const questions = [...form.questions];
                questions[i] = { ...q, prompt: e.target.value };
                setForm({ ...form, questions });
              }} />
              {q.type === 'MCQ' && q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  <input type="radio" checked={q.correctOptionIndex === oi} onChange={() => {
                    const questions = [...form.questions];
                    questions[i] = { ...q, correctOptionIndex: oi };
                    setForm({ ...form, questions });
                  }} />
                  <input className={inputClass} placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => {
                    const questions = [...form.questions];
                    const options = [...q.options];
                    options[oi] = e.target.value;
                    questions[i] = { ...q, options };
                    setForm({ ...form, questions });
                  }} />
                </div>
              ))}
              {q.type === 'SHORT' && (
                <input className={inputClass} placeholder="Sample answer (teacher only)" value={q.sampleAnswer || ''} onChange={(e) => {
                  const questions = [...form.questions];
                  questions[i] = { ...q, sampleAnswer: e.target.value };
                  setForm({ ...form, questions });
                }} />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={() => addQuestion('MCQ')}>Add MCQ</button>
            <button type="button" className={btnGhost} onClick={() => addQuestion('SHORT')}>Add short question</button>
            <button type="submit" className={btnPrimary}>Save quiz</button>
          </div>
        </form>
      )}
      {items.map((q) => (
        <div key={q.id} className="rounded-2xl border border-white/10 p-4 space-y-2">
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-bold">{q.title}</p>
              <p className="text-xs text-slate-400">
                {q.durationMinutes || 0} min · {q.maxAttempts} attempts · deadline {formatWhen(q.deadline)} · {q.open ? 'Open' : 'Closed'}
              </p>
            </div>
            <div className="flex gap-2">
              {!isTeacher && q.open && <button className={btnPrimary} onClick={() => start(q)}>Take quiz</button>}
              {isTeacher && <button className={btnGhost} onClick={() => openAttempts(q.id)}>Evaluate</button>}
            </div>
          </div>
          {q.latestAttempt && (
            <p className="text-xs text-emerald-300">
              Last attempt: {q.latestAttempt.status}
              {q.latestAttempt.score != null ? ` · ${q.latestAttempt.score}/${q.latestAttempt.maxScore}` : ''}
            </p>
          )}
        </div>
      ))}
      {attempts.length > 0 && (
        <Panel title="Attempts">
          {attempts.map((a) => (
            <div key={a.id} className="text-sm border-b border-white/10 py-2">
              <p>{a.studentName} · attempt {a.attemptNumber} · <StatusPill status={a.status} /> · {a.score ?? '—'}/{a.maxScore ?? '—'}</p>
              {a.answers?.filter((x) => x.questionType === 'SHORT').map((ans) => (
                <p key={ans.id} className="text-slate-400">Q: {ans.prompt} — {ans.shortAnswer}</p>
              ))}
              {a.status !== 'GRADED' && <button className="text-xs text-indigo-300" onClick={() => gradeAttempt(a)}>Grade short answers</button>}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

function CalendarTab({ classroomId, isTeacher }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'OTHER', startsAt: '', endsAt: '', description: '' });
  const load = () => lmsApi.calendar(classroomId).then(setItems).catch((e) => setError(errMsg(e)));
  useEffect(() => {
    load();
  }, [classroomId]);
  const create = async (e) => {
    e.preventDefault();
    try {
      await lmsApi.createEvent(classroomId, {
        ...form,
        startsAt: fromInputDate(form.startsAt),
        endsAt: fromInputDate(form.endsAt),
      });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };
  return (
    <div className="space-y-4">
      <ErrorBanner error={error} />
      {isTeacher && (
        <form onSubmit={create} className="grid md:grid-cols-2 gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
          <Field label="Title"><input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Type">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['LIVE_CLASS', 'ASSIGNMENT', 'QUIZ', 'EXAM', 'CLASS', 'OTHER'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Starts"><input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
          <Field label="Ends"><input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          <button type="submit" className={btnPrimary}>Add event</button>
        </form>
      )}
      {items.map((e) => (
        <div key={e.id} className="rounded-xl border border-white/10 p-3 flex justify-between">
          <div>
            <p className="font-semibold">{e.title}</p>
            <p className="text-xs text-slate-400">{e.type} · {formatWhen(e.startsAt)}</p>
          </div>
          {isTeacher && <button className="text-xs text-rose-300" onClick={() => lmsApi.deleteEvent(classroomId, e.id).then(load)}>Remove</button>}
        </div>
      ))}
    </div>
  );
}

function AnnouncementsTab({ classroomId, isTeacher }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', pinned: false });
  const load = () => lmsApi.announcements(classroomId).then(setItems);
  useEffect(() => {
    load();
  }, [classroomId]);
  return (
    <div className="space-y-4">
      {isTeacher && (
        <form
          className="space-y-2 rounded-2xl bg-white/5 border border-white/10 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await lmsApi.createAnnouncement(classroomId, form);
            setForm({ title: '', body: '', pinned: false });
            load();
          }}
        >
          <input className={inputClass} placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className={inputClass} rows={3} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <label className="text-xs flex gap-2 items-center"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin</label>
          <button className={btnPrimary}>Post</button>
        </form>
      )}
      {items.map((a) => (
        <div key={a.id} className="rounded-xl border border-white/10 p-4">
          <p className="font-bold">{a.pinned ? '📌 ' : ''}{a.title}</p>
          <p className="text-sm text-slate-300">{a.body}</p>
          <p className="text-xs text-slate-500 mt-1">{a.createdByName} · {formatWhen(a.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function CoursesTab({ classroomId, isTeacher }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', subject: '', keywords: '', price: 0, description: '', published: true });
  const load = () => lmsApi.classroomCourses(classroomId).then(setItems);
  useEffect(() => {
    load();
  }, [classroomId]);
  return (
    <div className="space-y-4">
      {isTeacher && (
        <form
          className="grid md:grid-cols-2 gap-3 rounded-2xl bg-white/5 border border-white/10 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await lmsApi.createCourse({ ...form, classroomId, price: Number(form.price) });
            load();
          }}
        >
          <Field label="Title"><input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Category"><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Subject"><input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Keywords"><input className={inputClass} value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></Field>
          <Field label="Price"><input type="number" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Thumbnail">
            <input type="file" className="text-xs" onChange={async (e) => {
              if (!e.target.files[0]) return;
              const f = await lmsApi.uploadFile(e.target.files[0]);
              setForm((prev) => ({ ...prev, thumbnailUrl: f.url }));
            }} />
          </Field>
          <div className="md:col-span-2"><textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button className={btnPrimary} type="submit">Create course (unique Course ID assigned)</button>
        </form>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </div>
  );
}

function PeopleTab({ classroomId, classroom }) {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [email, setEmail] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const load = async () => {
    setTeachers(await lmsApi.teachers(classroomId));
    setStudents(await lmsApi.students(classroomId));
  };
  useEffect(() => {
    load();
  }, [classroomId]);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Panel title="Teachers" action={classroom.admin ? <span className="text-xs text-slate-400">Admin controls</span> : null}>
        {classroom.admin && (
          <form
            className="flex gap-2 mb-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await lmsApi.addTeacher(classroomId, { email });
              setEmail('');
              load();
            }}
          >
            <input className={inputClass} placeholder="Teacher email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className={btnPrimary}>Add</button>
          </form>
        )}
        {teachers.map((t) => (
          <div key={t.id} className="py-2 border-b border-white/10 text-sm">
            <p className="font-semibold">{t.fullName} {t.admin && <StatusPill status="ADMIN" />}</p>
            <p className="text-xs text-slate-400">{t.email}</p>
            {classroom.admin && !t.admin && (
              <div className="flex flex-wrap gap-1 mt-1">
                {PERMISSIONS.filter((p) => p !== 'ADMIN').map((p) => {
                  const on = t.permissions?.includes(p);
                  return (
                    <button
                      key={p}
                      className={`text-[10px] px-2 py-1 rounded ${on ? 'bg-indigo-600' : 'bg-white/10'}`}
                      onClick={async () => {
                        const next = new Set(t.permissions || []);
                        if (on) next.delete(p);
                        else next.add(p);
                        await lmsApi.updatePermissions(classroomId, t.userId, [...next]);
                        load();
                      }}
                    >
                      {p.replace('MANAGE_', '')}
                    </button>
                  );
                })}
                <button className="text-[10px] text-rose-300" onClick={() => lmsApi.removeTeacher(classroomId, t.userId).then(load)}>Remove</button>
              </div>
            )}
          </div>
        ))}
      </Panel>
      <Panel title="Students">
        <form
          className="flex gap-2 mb-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await lmsApi.addStudent(classroomId, { email: studentEmail });
            setStudentEmail('');
            load();
          }}
        >
          <input className={inputClass} placeholder="Student email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
          <button className={btnPrimary}>Add</button>
        </form>
        {students.map((s) => (
          <div key={s.id} className="py-2 border-b border-white/10 text-sm flex justify-between">
            <div>
              <p className="font-semibold">{s.fullName}</p>
              <p className="text-xs text-slate-400">{s.email} · {s.paymentPhone || 'no payment phone'}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={s.status} />
              <button className="text-xs text-rose-300" onClick={() => lmsApi.removeStudent(classroomId, s.userId).then(load)}>Remove</button>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function EnrollmentsTab({ classroomId }) {
  const [items, setItems] = useState([]);
  const load = () => lmsApi.enrollments(classroomId).then(setItems);
  useEffect(() => {
    load();
  }, [classroomId]);
  return (
    <div className="space-y-3">
      {items.length === 0 && <Empty>No enrollment requests.</Empty>}
      {items.map((e) => (
        <div key={e.id} className="rounded-xl border border-white/10 p-4 flex flex-wrap justify-between gap-3">
          <div>
            <p className="font-semibold">{e.studentName} · {e.studentEmail}</p>
            <p className="text-xs text-slate-400">
              {e.courseTitle} ({e.courseCode}) · payment phone {e.paymentPhone} · {formatWhen(e.createdAt)}
            </p>
            {e.studentNote && <p className="text-sm text-slate-300">{e.studentNote}</p>}
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={e.status} />
            {e.status === 'PENDING' && (
              <>
                <button className={btnPrimary} onClick={() => lmsApi.approveEnrollment(e.id).then(load)}>Accept</button>
                <button className={btnGhost} onClick={() => lmsApi.rejectEnrollment(e.id).then(load)}>Reject</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ classroom, onSaved }) {
  const [form, setForm] = useState({
    name: classroom.name,
    description: classroom.description || '',
    subject: classroom.subject || '',
    timezone: classroom.timezone || 'UTC',
    allowStudentDiscussion: classroom.allowStudentDiscussion,
    published: classroom.published,
  });
  return (
    <form
      className="space-y-3 max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        await lmsApi.updateClassroom(classroom.id, form);
        onSaved();
      }}
    >
      <Field label="Name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Subject"><input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
      <Field label="Description"><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.allowStudentDiscussion} onChange={(e) => setForm({ ...form, allowStudentDiscussion: e.target.checked })} /> Allow student discussion</label>
      <button className={btnPrimary}>Save settings</button>
    </form>
  );
}
