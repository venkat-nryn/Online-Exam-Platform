import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/slices/authSlice'
import authService from '../services/authService'
import toast from 'react-hot-toast'

const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, userType, loading } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    authService.logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const hasPermission = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true
    return allowedRoles.includes(userType)
  }

  return {
    user,
    isAuthenticated,
    userType,
    loading,
    logout: handleLogout,
    hasPermission
  }
}

export default useAuth