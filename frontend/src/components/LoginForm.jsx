import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../api/authApi'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginForm({ role }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginUser({ ...form, role })
      login(data)
      navigate(role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const registerPath = role === 'TEACHER' ? '/teacher/register' : '/student/register'

  return (
    <div className="auth-card">
      <h2>{role === 'TEACHER' ? 'Teacher Login' : 'Student Login'}</h2>
      <form onSubmit={handleSubmit}>
        <label>Email or Phone</label>
        <input
          name="identifier"
          value={form.identifier}
          onChange={handleChange}
          placeholder="you@example.com or 01XXXXXXXXX"
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="switch-link">
        Don&apos;t have an account? <Link to={registerPath}>Register here</Link>
      </p>
    </div>
  )
}
