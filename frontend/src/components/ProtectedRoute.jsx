import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Wraps a dashboard route. Redirects to the right login page if
// there's no token, or if the logged-in role doesn't match the route.
export default function ProtectedRoute({ children, requiredRole }) {
  const { auth } = useAuth()

  if (!auth) {
    return <Navigate to="/select-role" replace />
  }

  if (requiredRole && auth.role !== requiredRole) {
    return <Navigate to="/select-role" replace />
  }

  return children
}
