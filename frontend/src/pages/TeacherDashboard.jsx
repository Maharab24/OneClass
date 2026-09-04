import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function TeacherDashboard() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="page-center">
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {auth?.fullName}!</p>
      <p className="muted">Authentication complete. Classroom features come next.</p>
      <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
    </div>
  )
}
