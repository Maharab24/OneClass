import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api/authApi'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterForm({ role }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await registerUser({ ...form, role })
      login(data)
      navigate(role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const loginPath = role === 'TEACHER' ? '/teacher/login' : '/student/login'

  return (
    <div className="auth-card">
      <h2>{role === 'TEACHER' ? 'Teacher Registration' : 'Student Registration'}</h2>
      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input name="fullName" value={form.fullName} onChange={handleChange} required />

        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />

        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} required />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          minLength={6}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="switch-link">
        Already have an account? <Link to={loginPath}>Login here</Link>
      </p>
    </div>
  )
}
