import { useNavigate } from 'react-router-dom';

export default function RoleSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full relative">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-20 left-0 text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="text-center">
          {/* Header */}
          <div className="mb-12 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Select Your Role
            </h2>
            <div className="w-20 h-1 mx-auto bg-blue-500 rounded-full"></div>
            <p className="mt-4 text-gray-400 text-lg">
              Choose how you want to use OneClass
            </p>
          </div>

          {/* Role Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto animate-fade-up animation-delay-200">
            {/* Teacher Card */}
            <div
              onClick={() => navigate('/teacher/login')}
              className="group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-105 hover:border-blue-500/50"
            >
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-300">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Teacher</h3>
                <p className="text-gray-400 text-sm mb-4">Create and manage courses, track student progress</p>
                <div className="inline-flex items-center text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                  Get Started
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Student Card */}
            <div
              onClick={() => navigate('/student/login')}
              className="group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-105 hover:border-purple-500/50"
            >
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-300">
                  <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Student</h3>
                <p className="text-gray-400 text-sm mb-4">Join classes, submit assignments, track your learning</p>
                <div className="inline-flex items-center text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
                  Get Started
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="mt-8 text-xs text-gray-500 animate-fade-up animation-delay-400">
            Already have an account? Sign in to continue
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          opacity: 0;
          animation: fade-up 0.8s ease forwards;
        }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}