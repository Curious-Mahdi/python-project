import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('sm_token') || null,
  username: localStorage.getItem('sm_username') || null,
  userId: localStorage.getItem('sm_userId') || null,
  isAuthenticated: !!localStorage.getItem('sm_token'),

  login: (token, username, userId) => {
    localStorage.setItem('sm_token', token)
    localStorage.setItem('sm_username', username)
    localStorage.setItem('sm_userId', String(userId))
    set({ token, username, userId: String(userId), isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_username')
    localStorage.removeItem('sm_userId')
    set({ token: null, username: null, userId: null, isAuthenticated: false })
  },
}))

export default useAuthStore
