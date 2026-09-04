import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('oneclass_token')
    const role = localStorage.getItem('oneclass_role')
    const fullName = localStorage.getItem('oneclass_name')
    return token ? { token, role, fullName } : null
  })

  const login = (authResponse) => {
    localStorage.setItem('oneclass_token', authResponse.token)
    localStorage.setItem('oneclass_role', authResponse.role)
    localStorage.setItem('oneclass_name', authResponse.fullName)
    setAuth({
      token: authResponse.token,
      role: authResponse.role,
      fullName: authResponse.fullName,
    })
  }

  const logout = () => {
    localStorage.removeItem('oneclass_token')
    localStorage.removeItem('oneclass_role')
    localStorage.removeItem('oneclass_name')
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
