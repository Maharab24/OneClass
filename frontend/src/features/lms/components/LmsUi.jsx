import React from 'react';
import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';

export function Stars({ value = 0, count }) {
  const rating = Number(value) || 0;
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'fill-amber-400' : 'opacity-30'}`} />
      ))}
      <span className="text-xs text-slate-300 ml-1">{rating.toFixed(1)}</span>
      {typeof count === 'number' && <span className="text-xs text-slate-500">({count})</span>}
    </div>
  );
}

export function CourseCard({ course, to, action }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-indigo-500/40 transition-all flex flex-col">
      <div className="h-36 bg-slate-800 relative">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-indigo-300">
            <BookOpen className="w-10 h-10" />
          </div>
        )}
        <span className="absolute top-3 left-3 text-[11px] font-mono font-bold bg-slate-950/80 border border-white/10 px-2 py-1 rounded-lg text-indigo-200">
          {course.courseCode}
        </span>
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-bold text-white leading-snug">{course.title}</h3>
        <p className="text-xs text-slate-400">{course.instructorName} · {course.subject || course.category || 'General'}</p>
        <Stars value={course.averageRating} count={course.reviewCount} />
        <p className="text-sm font-semibold text-emerald-300">
          {Number(course.price) === 0 ? 'Free' : `${course.currency || 'USD'} ${course.price}`}
        </p>
        <div className="pt-2 mt-auto flex gap-2">
          {to && (
            <Link to={to} className="flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-white/10 hover:bg-white/20">
              Details
            </Link>
          )}
          {action}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500';

export const btnPrimary =
  'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold disabled:opacity-50';

export const btnGhost =
  'px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold';

export function Panel({ title, action, children }) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-white">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

export function ErrorBanner({ error }) {
  if (!error) return null;
  return <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm">{error}</div>;
}

export function StatusPill({ status }) {
  const map = {
    PENDING: 'bg-amber-500/20 text-amber-200',
    APPROVED: 'bg-emerald-500/20 text-emerald-200',
    REJECTED: 'bg-rose-500/20 text-rose-200',
    LIVE: 'bg-emerald-500/20 text-emerald-200',
    SCHEDULED: 'bg-sky-500/20 text-sky-200',
    ENDED: 'bg-slate-500/20 text-slate-300',
    GRADED: 'bg-emerald-500/20 text-emerald-200',
    SUBMITTED: 'bg-indigo-500/20 text-indigo-200',
    IN_PROGRESS: 'bg-amber-500/20 text-amber-200',
  };
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${map[status] || 'bg-white/10 text-slate-200'}`}>
      {status}
    </span>
  );
}
