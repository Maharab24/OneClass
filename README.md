# OneClass — Authentication Module (Full Roadmap + Scaffold)

This package contains a runnable Spring Boot + React scaffold covering
**Landing Page → Role Select → Teacher/Student Login & Register → Dashboard**,
backed by PostgreSQL and JWT auth. No classroom/chat/whiteboard features yet —
those come after this foundation, using Java Sockets + Multithreading as planned.

## 1. Prerequisites
- Java 17+, Maven
- Node.js 18+
- PostgreSQL 14+

## 2. Database setup
```sql
CREATE DATABASE oneclass_db;
CREATE USER oneclass_user WITH PASSWORD 'oneclass_pass';
GRANT ALL PRIVILEGES ON DATABASE oneclass_db TO oneclass_user;
```
Update `backend/src/main/resources/application.yml` if you use different credentials.

## 3. Run the backend
```bash
cd backend
mvn spring-boot:run
```
Runs on http://localhost:8080. Tables are auto-created via `ddl-auto: update`.

## 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 (Vite dev server proxies `/api` to the backend).

## 5. Auth flow implemented
- `POST /api/auth/register` — fullName, email, phone, password, role(TEACHER|STUDENT)
- `POST /api/auth/login` — identifier(email or phone), password, role
- Both return a JWT + user info. Frontend stores the token in localStorage and
  attaches it as `Authorization: Bearer <token>` on every request (axios interceptor).
- Passwords hashed with BCrypt. Spring Security validates JWT on protected routes
  (`/api/teacher/**` requires ROLE_TEACHER, `/api/student/**` requires ROLE_STUDENT).
- React routes: `/` → `/select-role` → `/teacher/login|register` or
  `/student/login|register` → `/teacher/dashboard` or `/student/dashboard`,
  guarded by `ProtectedRoute`.

## 6. Roadmap beyond this scaffold
1. **Auth hardening**: refresh tokens, email/phone verification (OTP), forgot-password flow, rate limiting.
2. **Domain entities**: Classroom, Enrollment, Assignment, Attendance, Resource, Group — as per OneClass feature list.
3. **Real-time layer**: raw Java `ServerSocket`/`Socket` service (separate from the REST API port) for chat, whiteboard sync, and voice signaling; one thread (or thread-pool task) per connected client session via `ExecutorService`.
4. **Concurrency**: dedicated thread pools for chat processing, whiteboard broadcast, notification dispatch, attendance logging, and file upload/download — avoid blocking the main socket-accept loop.
5. **File I/O layer**: structured storage for assignments, recordings, whiteboard snapshots, profile images, attendance/log files — likely local disk + metadata rows in Postgres initially, swappable for S3-compatible storage later.
6. **Notification/Calendar**: aggregate events across a student's classrooms (poll or push via the socket layer).
7. **Frontend**: classroom pages, whiteboard canvas, chat UI, group study rooms — built on top of the auth context already in place.

## File structure

backend/
  pom.xml
  src/main/java/com/oneclass/backend/
    OneclassBackendApplication.java
    config/SecurityConfig.java
    security/JwtUtil.java, JwtAuthFilter.java, CustomUserDetailsService.java
    entity/User.java, Role.java
    repository/UserRepository.java
    dto/RegisterRequest.java, LoginRequest.java, AuthResponse.java, ApiError.java
    service/AuthService.java
    controller/AuthController.java, DashboardController.java
    exception/GlobalExceptionHandler.java, UserAlreadyExistsException.java, InvalidCredentialsException.java
  src/main/resources/application.yml

frontend/
  package.json, vite.config.js, index.html
  src/
    main.jsx, App.jsx
    api/axiosInstance.js, authApi.js
    context/AuthContext.jsx
    components/ProtectedRoute.jsx, LoginForm.jsx, RegisterForm.jsx
    pages/LandingPage.jsx, RoleSelectPage.jsx,
          TeacherLoginPage.jsx, TeacherRegisterPage.jsx,
          StudentLoginPage.jsx, StudentRegisterPage.jsx,
          TeacherDashboard.jsx, StudentDashboard.jsx
    router/AppRouter.jsx
    styles/index.css
