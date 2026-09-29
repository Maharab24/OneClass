import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../common/context/AuthContext';
import axiosInstance from '../../../common/api/axiosInstance';
import { Presentation, ArrowRight, Sparkles, BookOpen, AlertCircle, Loader2, ShoppingCart } from 'lucide-react';
import { lmsApi, errMsg, formatWhen } from '../api/lmsApi';
import { CourseCard, Empty, ErrorBanner, Field, Stars, StatusPill, btnGhost, btnPrimary, inputClass } from '../components/LmsUi';

export default function StudentHome() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [liveRooms, setLiveRooms] = useState([]);

  useEffect(() => {
    lmsApi.classrooms().then(setClassrooms).catch(() => {});
    lmsApi.searchCourses({}).then((c) => setCourses(c.slice(0, 6))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classrooms.length) return;
    Promise.all(classrooms.map((c) => lmsApi.currentLive(c.id).then((live) => ({ classroom: c, live }))))
      .then((rows) => setLiveRooms(rows.filter((r) => r.live?.status === 'LIVE')))
      .catch(() => {});
  }, [classrooms]);

  const handleJoinDirect = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await axiosInstance.post('/rooms/join', {
        roomCode: roomCode.trim().toUpperCase(),
        userName: auth?.fullName,
        requestedRole: 'CAN_WATCH',
      });
      navigate('/whiteboard', { state: { room: res.data, currentUser: res.data.currentUser, returnTo: '/student/dashboard' } });
    } catch (err) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Room not found or unable to join.';
      setJoinError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateStudyBoard = async () => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await axiosInstance.post('/rooms/create', { hostName: auth?.fullName });
      navigate('/whiteboard', { state: { room: res.data, currentUser: res.data.currentUser, returnTo: '/student/dashboard' } });
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create study board.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-blue-600/30 border border-white/10 p-8 md:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5" /> Student learning workspace
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">{auth?.fullName || 'Student'}</span>
          </h2>
          <p className="text-slate-300 text-sm md:text-base">
            Browse courses, enroll with your payment phone number, and join live whiteboard classes after approval.
          </p>
          <form onSubmit={handleJoinDirect} className="pt-4 flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-char Room Code"
              maxLength={6}
              className={`${inputClass} flex-1 tracking-wider uppercase font-mono`}
            />
            <button type="submit" disabled={isJoining || !roomCode.trim()} className={`${btnPrimary} flex items-center justify-center gap-2`}>
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Join Board <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          {joinError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {joinError}
            </div>
          )}
          {createError && <p className="text-rose-300 text-xs">{createError}</p>}
        </div>
      </div>

      {liveRooms.length > 0 && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 space-y-2">
          <p className="font-bold text-emerald-200">Live classes available now</p>
          {liveRooms.map(({ classroom, live }) => (
            <div key={classroom.id} className="flex justify-between items-center gap-3">
              <p className="text-sm">{classroom.name}: {live.title}</p>
              <Link className={btnPrimary} to={`/student/dashboard/classrooms/${classroom.id}?tab=live`}>Join</Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <button onClick={handleCreateStudyBoard} className="text-left p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 space-y-3">
          <Presentation className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold">Create Collaborative Study Board</h3>
          <p className="text-slate-400 text-sm">Launch your own whiteboard and share the room code with peers.</p>
          <span className="text-xs font-semibold text-purple-400">{isCreating ? 'Creating Board...' : 'Launch Board →'}</span>
        </button>
        <Link to="/student/dashboard/courses" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 space-y-3">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold">All Courses</h3>
          <p className="text-slate-400 text-sm">Search by name, Course ID, keywords, subject, or category.</p>
        </Link>
      </div>

      <div>
        <div className="flex justify-between mb-3">
          <h3 className="font-bold">My classrooms</h3>
          <Link to="/student/dashboard/enrollments" className="text-xs text-indigo-300">Enrollment status</Link>
        </div>
        {classrooms.length === 0 && <Empty>No approved classrooms yet. Browse All Courses and request enrollment.</Empty>}
        <div className="grid md:grid-cols-2 gap-3">
          {classrooms.map((c) => (
            <Link key={c.id} to={`/student/dashboard/classrooms/${c.id}`} className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-slate-400">{c.subject || 'Classroom'} {c.hasLiveClass ? '· LIVE' : ''}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-3">
          <h3 className="font-bold">Catalog highlights</h3>
          <Link to="/student/dashboard/courses" className="text-xs text-indigo-300">Browse all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              to={`/student/dashboard/courses/${c.id}`}
              action={
                <button className="text-xs px-3 py-2 rounded-xl bg-indigo-600" onClick={() => lmsApi.addToCart(c.id)}>
                  Cart
                </button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AllCoursesPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    try {
      setItems(await lmsApi.searchCourses({ q, category, subject }));
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">All Courses</h2>
      <ErrorBanner error={error} />
      <form onSubmit={search} className="grid md:grid-cols-4 gap-3">
        <input className={inputClass} placeholder="Search name, Course ID, keywords..." value={q} onChange={(e) => setQ(e.target.value)} />
        <input className={inputClass} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className={inputClass} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <button className={btnPrimary} type="submit">Search</button>
      </form>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            to={`/student/dashboard/courses/${c.id}`}
            action={
              <button
                className="text-xs px-3 py-2 rounded-xl bg-white/10"
                onClick={async () => {
                  await lmsApi.addToCart(c.id);
                }}
              >
                Add to cart
              </button>
            }
          />
        ))}
      </div>
      {items.length === 0 && <Empty>No published courses match that search.</Empty>}
    </div>
  );
}

export function CourseDetailsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setCourse(await lmsApi.course(courseId));
    setReviews(await lmsApi.reviews(courseId));
  };

  useEffect(() => {
    load().catch((e) => setError(errMsg(e)));
  }, [courseId]);

  if (!course) return <ErrorBanner error={error} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <ErrorBanner error={error} />
      {message && <p className="text-emerald-300 text-sm">{message}</p>}
      <div className="rounded-3xl overflow-hidden border border-white/10">
        <div className="h-48 bg-slate-800">
          {course.thumbnailUrl && <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-6 space-y-3">
          <p className="font-mono text-sm text-indigo-300">Course ID: {course.courseCode}</p>
          <h2 className="text-3xl font-extrabold">{course.title}</h2>
          <p className="text-sm text-slate-300">{course.instructorName} · {course.classroomName}</p>
          <Stars value={course.averageRating} count={course.reviewCount} />
          <p className="text-emerald-300 font-semibold">{Number(course.price) === 0 ? 'Free' : `${course.currency} ${course.price}`}</p>
          <p className="text-sm text-slate-300">{course.description}</p>
          <p className="text-xs text-slate-500">{course.subject} · {course.category} · {course.keywords}</p>
          {course.enrolled && <StatusPill status="APPROVED" />}
          {course.myEnrollmentStatus && !course.enrolled && <StatusPill status={course.myEnrollmentStatus} />}
        </div>
      </div>

      {!course.enrolled && course.myEnrollmentStatus !== 'PENDING' && (
        <form
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await lmsApi.enroll(course.id, { paymentPhone: phone, studentNote: note });
              setMessage('Enrollment request sent. You will get access after teacher/admin approval.');
              load();
            } catch (err) {
              setError(errMsg(err));
            }
          }}
        >
          <h3 className="font-bold">Request enrollment</h3>
          <Field label="Payment phone number">
            <input required className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label="Note (optional)">
            <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <button className={btnPrimary} type="submit">Submit request</button>
            <button type="button" className={btnGhost} onClick={() => lmsApi.addToCart(course.id).then(() => setMessage('Added to cart'))}>
              Add to cart
            </button>
          </div>
        </form>
      )}

      {course.enrolled && (
        <div className="space-y-3 rounded-2xl border border-white/10 p-5">
          <Link className={btnPrimary} to={`/student/dashboard/classrooms/${course.classroomId}`}>Open classroom</Link>
          <form
            className="space-y-2 pt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await lmsApi.upsertReview(course.id, { rating: Number(rating), comment });
              load();
            }}
          >
            <h3 className="font-bold">Rate this course</h3>
            <select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} stars</option>
              ))}
            </select>
            <textarea className={inputClass} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Review" />
            <button className={btnGhost}>Save review</button>
          </form>
        </div>
      )}

      <div>
        <h3 className="font-bold mb-2">Reviews</h3>
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-white/10 py-3">
            <Stars value={r.rating} />
            <p className="text-sm">{r.comment}</p>
            <p className="text-xs text-slate-500">{r.studentName} · {formatWhen(r.createdAt)}</p>
          </div>
        ))}
        {reviews.length === 0 && <Empty>No reviews yet.</Empty>}
      </div>
    </div>
  );
}

export function CartPage() {
  const [items, setItems] = useState([]);
  const load = () => lmsApi.cart().then(setItems);
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Course cart</h2>
      {items.length === 0 && <Empty>Your cart is empty.</Empty>}
      {items.map((c) => (
        <div key={c.id} className="rounded-2xl border border-white/10 p-4 flex flex-wrap justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-indigo-300">Course ID: {c.courseCode}</p>
            <p className="font-bold">{c.title}</p>
            <p className="text-xs text-slate-400">{c.instructorName} · {c.classroomName}</p>
            <Stars value={c.averageRating} count={c.reviewCount} />
            <p className="text-sm text-emerald-300">{Number(c.price) === 0 ? 'Free' : `${c.currency} ${c.price}`}</p>
            {c.myEnrollmentStatus && <StatusPill status={c.myEnrollmentStatus} />}
          </div>
          <div className="flex gap-2 items-start">
            <Link className={btnPrimary} to={`/student/dashboard/courses/${c.id}`}>Enroll</Link>
            <button className={btnGhost} onClick={() => lmsApi.removeFromCart(c.id).then(load)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudentEnrollmentsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    lmsApi.myEnrollments().then(setItems);
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">My enrollments</h2>
      {items.map((e) => (
        <div key={e.id} className="rounded-xl border border-white/10 p-4">
          <p className="font-semibold">{e.courseTitle} <span className="font-mono text-xs text-indigo-300">{e.courseCode}</span></p>
          <p className="text-xs text-slate-400">Payment phone {e.paymentPhone} · {formatWhen(e.createdAt)}</p>
          <StatusPill status={e.status} />
          {e.status === 'APPROVED' && (
            <Link className="block text-sm text-indigo-300 mt-2" to={`/student/dashboard/classrooms/${e.classroomId}`}>
              Open classroom
            </Link>
          )}
        </div>
      ))}
      {items.length === 0 && <Empty>No enrollment requests yet.</Empty>}
    </div>
  );
}
