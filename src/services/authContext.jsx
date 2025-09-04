/**
 * Authentication Context
 * Provides authentication state management for the entire app
 * Features:
 * - Debounced authentication validation
 * - Authentication state caching
 * - React Strict Mode compatibility
 * - Token refresh mechanism
 * - Proper error recovery
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
  
  // Authentication state management
  const [authError, setAuthError] = useState(null)
  const [lastValidation, setLastValidation] = useState(null)
  const isValidatingRef = useRef(false)
  const validationTimeoutRef = useRef(null)
  const mountedRef = useRef(true)

  // Check authentication status on app start with proper cleanup
  useEffect(() => {
    mountedRef.current = true
    
    // Debounced initial check to prevent multiple calls in React Strict Mode
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        checkAuthStatus()
      }
    }, 100)
    
    return () => {
      mountedRef.current = false
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
      clearTimeout(timeoutId)
    }
  }, [])

  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous validation calls
    if (isValidatingRef.current && !forceRefresh) {
      console.log('🔐 AUTH CONTEXT - Validation already in progress, skipping')
      return
    }
    
    // Check cache first (valid for 30 seconds)
    const now = Date.now()
    if (!forceRefresh && lastValidation && (now - lastValidation) < 30000) {
      console.log('🔐 AUTH CONTEXT - Using cached authentication status')
      return
    }
    
    isValidatingRef.current = true
    setAuthError(null)
    
    try {
      if (apiService.auth.isAuthenticated()) {
        console.log('🔐 AUTH CONTEXT - Token found, validating with server')
        
        // Validate the token with the server
        const validation = await apiService.auth.validateToken()
        
        if (!mountedRef.current) return
        
        // Extract user data from various possible response structures
        const userData = validation.teacher || 
                         validation.user || 
                         validation.data?.teacher || 
                         validation.data?.user ||
                         validation.data ||
                         validation
        
        console.log('🔐 AUTH CONTEXT - Token validation successful:', {
          hasUserData: !!userData,
          userRole: userData?.role || userData?.roles,
          userId: userData?.teacherId || userData?.id
        })
        
        setIsAuthenticated(true)
        setUser(userData)
        setLastValidation(now)
      } else {
        console.log('🔐 AUTH CONTEXT - No valid token found')
        setIsAuthenticated(false)
        setUser(null)
        setLastValidation(now)
      }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Auth validation failed:', error)
      
      if (!mountedRef.current) return
      
      setAuthError(error.message)
      setIsAuthenticated(false)
      setUser(null)
      setLastValidation(now)
      
      // If validation fails due to token expiry, try to refresh
      if (error.message.includes('Authentication failed') && apiService.auth.isAuthenticated()) {
        console.log('🔐 AUTH CONTEXT - Attempting token refresh')
        // Token refresh logic will be implemented next
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
      isValidatingRef.current = false
    }
  }, [lastValidation])

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      setAuthError(null)
      
      const loginResponse = await apiService.auth.login(email, password)
      
      if (!mountedRef.current) return
      
      console.log('🔐 AUTH CONTEXT - Login successful:', {
        hasToken: !!loginResponse.token,
        hasUserData: !!(loginResponse.teacher || loginResponse.user)
      })
      
      const { token } = loginResponse
      // Extract user data from various possible response structures
      const userData = loginResponse.teacher || 
                       loginResponse.user || 
                       loginResponse.data?.teacher || 
                       loginResponse.data?.user ||
                       loginResponse.data
      
      if (token && userData) {
        setIsAuthenticated(true)
        setUser(userData)
        setLastValidation(Date.now())
        return { success: true, user: userData }
      } else {
        throw new Error('Invalid login response: missing token or user data')
      }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Login failed:', error)
      
      if (mountedRef.current) {
        setAuthError(error.message)
        setIsAuthenticated(false)
        setUser(null)
      }
      throw error
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await apiService.auth.logout()
      console.log('🔐 AUTH CONTEXT - Logout successful')
    } catch (error) {
      console.warn('🔐 AUTH CONTEXT - Logout API call failed:', error)
    } finally {
      if (mountedRef.current) {
        setIsAuthenticated(false)
        setUser(null)
        setAuthError(null)
        setLastValidation(null)
        setIsLoading(false)
      }
    }
  }
  
  // Token refresh mechanism
  const refreshToken = useCallback(async () => {
    try {
      console.log('🔐 AUTH CONTEXT - Attempting token refresh')
      
      // For now, we'll implement a basic refresh by re-validating
      // This can be enhanced when backend supports refresh tokens
      await checkAuthStatus(true)
      
      return isAuthenticated
    } catch (error) {
      console.error('🔐 AUTH CONTEXT - Token refresh failed:', error)
      await logout()
      return false
    }
  }, [isAuthenticated])

  // Debug helper for testing improvements
  const debugAuth = useCallback(() => {
    return {
      isAuthenticated,
      isLoading,
      user: user ? { id: user.teacherId || user.id, role: user.role } : null,
      authError,
      lastValidation: lastValidation ? new Date(lastValidation).toISOString() : null,
      isValidating: isValidatingRef.current,
      cacheAge: lastValidation ? Date.now() - lastValidation : null
    }
  }, [isAuthenticated, isLoading, user, authError, lastValidation])

  const value = {
    isAuthenticated,
    isLoading,
    user,
    authError,
    login,
    logout,
    checkAuthStatus,
    refreshToken,
    debugAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext