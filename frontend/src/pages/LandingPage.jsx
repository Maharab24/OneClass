import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import bannerImage from '../assets/images/banner.png';
import logo from '../assets/images/logo.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mouse = { x: null, y: null };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.shape = Math.random() > 0.7 ? 'book' : 'circle';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150) {
            const force = (150 - distance) / 150;
            this.speedX += (dx / distance) * force * 0.02;
            this.speedY += (dy / distance) * force * 0.02;
          }
        }
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        if (this.shape === 'book') {
          ctx.fillStyle = '#4a90d9';
          ctx.shadowColor = '#4a90d9';
          ctx.shadowBlur = 10;
          ctx.fillRect(-8, -6, 16, 12);
          ctx.fillStyle = '#6ba3e0';
          ctx.fillRect(-6, -4, 12, 8);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = this.opacity * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.lineTo(0, 4);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#8b5cf6';
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#a78bfa';
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(100, (canvas.width * canvas.height) / 10000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(74, 144, 217, ${0.15 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.03)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      ctx.font = '20px sans-serif';
      ctx.globalAlpha = 0.05;
      const symbols = ['⨯', '∑', 'π', '√', '∫', '∞', 'Δ', 'θ'];
      symbols.forEach((symbol, i) => {
        const x = (canvas.width / symbols.length) * i + Math.sin(time + i) * 50;
        const y = 50 + Math.sin(time * 0.5 + i * 0.7) * 30;
        ctx.fillText(symbol, x, y);
      });
      ctx.globalAlpha = 1;

      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      connectParticles();

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    resizeCanvas();
    initParticles();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* Floating Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-float-slow">
          <div className="text-6xl opacity-20 text-blue-400">⨯</div>
        </div>
        <div className="absolute top-40 right-20 animate-float-medium">
          <div className="text-5xl opacity-15 text-purple-400">∑</div>
        </div>
        <div className="absolute bottom-32 left-20 animate-float-fast">
          <div className="text-7xl opacity-10 text-blue-300">π</div>
        </div>
        <div className="absolute bottom-40 right-32 animate-float-slow">
          <div className="text-6xl opacity-15 text-purple-300">√</div>
        </div>
        <div className="absolute top-1/2 left-1/4 animate-float-medium">
          <div className="text-5xl opacity-10 text-indigo-400">∫</div>
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float-slow">
          <div className="text-4xl opacity-15 text-blue-500">∞</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Section - Text Content */}
            <div className="text-center lg:text-left">
              <div className="relative">
                {/* Logo */}
                <div className="flex justify-center lg:justify-start mb-6 animate-fade-up">
                  <img
                    src={logo}
                    alt="OneClass Logo"
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                </div>

                {/* Main Heading */}
                <div className="mb-6 animate-fade-up animation-delay-200">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white">
                    OneClass
                  </h1>
                </div>

                {/* Subtitle */}
                <div className="mb-8 animate-fade-up animation-delay-300">
                  <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed">
                    A centralized virtual learning platform for teachers and students.
                  </p>
                </div>

                {/* Decorative Line */}
                <div className="w-24 h-1 mx-auto lg:mx-0 mb-8 bg-blue-500 rounded-full animate-pulse-slow" />

                {/* Features - Updated with #FF5722 color */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-fade-up animation-delay-400">
                  <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="text-2xl mb-2 text-[#FF5722] font-semibold group-hover:scale-110 transition-transform">For Teachers</div>
                    <p className="text-sm text-gray-400">Create & manage courses</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="text-2xl mb-2 text-[#FF5722] font-semibold group-hover:scale-110 transition-transform">For Students</div>
                    <p className="text-sm text-gray-400">Learn & collaborate</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="text-2xl mb-2 text-[#FF5722] font-semibold group-hover:scale-110 transition-transform">Community</div>
                    <p className="text-sm text-gray-400">Connect & grow together</p>
                  </div>
                </div>

                {/* CTA Button - Enhanced with FF5722, F44336, 643633 color combination */}
                <button
                  onClick={() => navigate('/select-role')}
                  className="relative px-10 py-4 text-lg font-semibold text-white rounded-full
                    bg-linear-to-r from-[#FF5722] via-[#F44336] to-[#D32F2F]
                    hover:from-[#F4511E] hover:via-[#D32F2F] hover:to-[#D32F2F]
                    transition-all duration-300 transform hover:scale-105
                    animate-fade-up animation-delay-600
                    shadow-[0_0_25px_rgba(255,87,34,0.6)]
                    hover:shadow-[0_0_50px_rgba(255,87,34,0.9)]
                    hover:shadow-[0_0_80px_rgba(244,67,54,0.7)]
                    before:absolute before:inset-0 before:rounded-full
                    before:bg-linear-to-r before:from-[#FF5722] before:via-[#F44336] before:to-[#D32F2F]
                    before:blur-2xl before:opacity-60 before:transition-opacity
                    hover:before:opacity-90 before:-z-10
                    border border-white/20"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>

                {/* Additional Text */}
                <p className="mt-6 text-xs text-gray-500 animate-fade-up animation-delay-800">
                  Join thousands of students and teachers already using OneClass
                </p>
              </div>
            </div>

            {/* Right Section - Banner Image */}
            <div className="animate-fade-up animation-delay-300">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-2xl opacity-20 animate-pulse-slow"></div>
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 shadow-2xl hover:shadow-blue-500/10 transition-shadow duration-300">
                  <img
                    src={bannerImage}
                    alt="OneClass Platform Overview"
                    className="w-full h-auto rounded-xl"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect width="600" height="400" fill="%231e1b4b"/%3E%3Ctext x="300" y="200" text-anchor="middle" fill="%2360a5fa" font-size="24" font-family="Arial"%3EOneClass Platform%3C/text%3E%3Ctext x="300" y="230" text-anchor="middle" fill="%2393bbfc" font-size="16" font-family="Arial"%3EVirtual Learning Environment%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                {/* Decorative badges */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#FF5722] to-[#F44336] rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg animate-float-slow shadow-orange-500/30">
                  All in one
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-40px) rotate(10deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
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
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 8s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-fade-up {
          opacity: 0;
          animation: fade-up 0.8s ease forwards;
        }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
      `}</style>
    </div>
  );
}