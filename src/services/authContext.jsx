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
        
        // The user data might be directly in the response or nested differently
        // Let's try multiple possible locations based on the API structure
        const userData = validation.teacher || 
                         validation.user || 
                         validation.data?.teacher || 
                         validation.data?.user ||
                         validation.data ||
                         validation
        
        console.log('🔐 AUTH CONTEXT - Token validation result:', {
          validationResponse: validation,
          validationKeys: Object.keys(validation || {}),
          extractedUser: userData,
          hasTeacher: !!validation.teacher,
          hasUser: !!validation.user,
          hasDataTeacher: !!validation.data?.teacher,
          hasDataUser: !!validation.data?.user,
          hasData: !!validation.data,
          userRoles: userData?.roles,
          userRole: userData?.role
        })
        
        setIsAuthenticated(true)
        setUser(userData)
      } else {
        console.log('🔐 AUTH CONTEXT - No valid token found')
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Auth validation failed:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const loginResponse = await apiService.auth.login(email, password)
      
      console.log('🔐 AUTH CONTEXT - Login response:', {
        fullResponse: loginResponse,
        responseKeys: Object.keys(loginResponse || {}),
        hasToken: !!loginResponse.token,
        hasTeacher: !!loginResponse.teacher,
        hasUser: !!loginResponse.user,
        hasData: !!loginResponse.data,
        teacherData: loginResponse.teacher,
        teacherRoles: loginResponse.teacher?.roles,
        teacherRole: loginResponse.teacher?.role
      })
      
      const { token } = loginResponse
      // Try multiple possible locations for user data
      const userData = loginResponse.teacher || 
                       loginResponse.user || 
                       loginResponse.data?.teacher || 
                       loginResponse.data?.user ||
                       loginResponse.data
      
      if (token) {
        setIsAuthenticated(true)
        setUser(userData)
        return { success: true, user: userData }
      } else {
        throw new Error('No token received')
      }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Login failed:', error)
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