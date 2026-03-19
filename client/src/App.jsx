import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { Spinner } from 'react-bootstrap'

// Auth Pages
import Login from './pages/auth/Login'
import Unauthorized from './pages/auth/Unauthorized'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminGroups from './pages/admin/AdminGroups'
import AdminStudents from './pages/admin/AdminStudents'
import AdminExams from './pages/admin/AdminExams'
import AdminReports from './pages/admin/AdminReports'
import AdminResults from './pages/admin/AdminResults'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import StudentExams from './pages/student/StudentExams'
import TakeExam from './pages/student/TakeExam'
import StudentResults from './pages/student/StudentResults'

// Components
import PrivateRoute from './components/common/PrivateRoute'
import Header from './components/common/Header'
import Sidebar from './components/common/Sidebar'
import Loader from './components/common/Loader'
import authService from './services/authService'
import { loginSuccess, logout } from './store/slices/authSlice'

function App() {
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.ui)
  const { user, isAuthenticated, userType, authChecked, token } = useSelector((state) => state.auth)

  // On mount: if a token exists but auth hasn't been verified yet, call /auth/me
  // to restore the session or clear a stale/expired token.
  useEffect(() => {
    if (token && !authChecked) {
      authService.getCurrentUser()
        .then((res) => {
          dispatch(loginSuccess({
            user: res.user,
            token,
            userType: res.userType
          }))
        })
        .catch(() => {
          dispatch(logout())
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show a full-screen spinner while we're validating an existing token
  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Restoring session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="d-flex">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {isAuthenticated && <Sidebar userType={userType} />}
      
      <div className="flex-grow-1">
        {isAuthenticated && <Header user={user} userType={userType} />}
        
        <main className="p-4">
          {loading && <Loader />}
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/groups" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminGroups />
              </PrivateRoute>
            } />
            <Route path="/admin/students" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminStudents />
              </PrivateRoute>
            } />
            <Route path="/admin/exams" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminExams />
              </PrivateRoute>
            } />
            <Route path="/admin/reports" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminReports />
              </PrivateRoute>
            } />
            <Route path="/admin/results" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminResults />
              </PrivateRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboard />
              </PrivateRoute>
            } />
            <Route path="/student/exams" element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentExams />
              </PrivateRoute>
            } />
            <Route path="/student/take-exam/:examId" element={
              <PrivateRoute allowedRoles={['student']}>
                <TakeExam />
              </PrivateRoute>
            } />
            <Route path="/student/results" element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentResults />
              </PrivateRoute>
            } />
            
            {/* Default Redirect */}
            <Route path="/" element={
              <Navigate to={isAuthenticated ? `/${userType}` : '/login'} />
            } />

            {/* Fallback Route */}
            <Route path="*" element={
              <Navigate to={isAuthenticated ? `/${userType}` : '/login'} replace />
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App