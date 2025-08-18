/**
 * Authentication Context
 * Provides authentication state management for the entire app
 */

import { createContext, useContext, useState, useEffect } from 'react'
import apiService from './apiService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      if (apiService.auth.isAuthenticated()) {
        // Validate the token with the server
        const validation = await apiService.auth.validateToken()
        setIsAuthenticated(true)
        setUser(validation.teacher || validation.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth validation failed:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const { token, teacher } = await apiService.auth.login(email, password)
      
      if (token) {
        setIsAuthenticated(true)
        setUser(teacher)
        return { success: true, user: teacher }
      } else {
        throw new Error('No token received')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setIsAuthenticated(false)
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiService.auth.logout()
    } catch (error) {
      console.warn('Logout API call failed:', error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext