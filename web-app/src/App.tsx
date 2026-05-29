import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import DevelopmentModal from './components/DevelopmentModal/DevelopmentModal'
import FieldRegister from './components/FieldRegister/FieldRegister'
import LoginPage from './components/Login/LoginPage'
import RegisterPage from './components/Register/RegisterPage'
import BookingSchedule from './components/BookingSchedule/BookingSchedule'
import ChangePasswordPage from './components/ChangePassword/ChangePasswordPage'
import OverviewDashboard from './components/Overview/OverviewDashboard'
import VenueManagerList from './components/VenueManagerList/VenueManagerList'
import { VenueProvider } from './contexts/CurrentVenueContext'
import { useCurrentVenue } from './hooks/useCurrentVenue'
import { getStoredUser, isOwner, isPortalUser } from './types/auth'
import { Toaster } from 'react-hot-toast'

const IMPLEMENTED_MENUS = [
  'Tổng quan',
  'Đăng ký sân',
  'Lịch đặt sân',
  'Quản lý nhân viên',
]

const Dashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState(() => {
    return localStorage.getItem('activeMenuItem') || 'Tổng quan'
  })
  const [showModal, setShowModal] = useState(false)
  const [modalFeature, setModalFeature] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { currentVenueId } = useCurrentVenue()
  const user = getStoredUser()

  useEffect(() => {
    localStorage.setItem('activeMenuItem', activeMenuItem)
  }, [activeMenuItem])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMenuItemClick = (menuItem: string) => {
    if (IMPLEMENTED_MENUS.includes(menuItem)) {
      setActiveMenuItem(menuItem)
      setShowModal(false)
    } else if (menuItem !== 'Tổng quan') {
      setModalFeature(menuItem)
      setShowModal(true)
    } else {
      setActiveMenuItem(menuItem)
      setShowModal(false)
    }

    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentVenueId')
    localStorage.setItem('logout_success', 'true')
    window.location.href = '/login'
  }

  const needsVenue =
    activeMenuItem !== 'Đăng ký sân' &&
    activeMenuItem !== 'Tổng quan' &&
    !currentVenueId

  const renderContent = () => {
    if (needsVenue) {
      return (
        <div style={{ padding: '24px', color: '#6B7280', textAlign: 'center' }}>
          <p>Vui lòng chọn sân ở menu bên trái hoặc tại mục Tổng quan.</p>
        </div>
      )
    }

    switch (activeMenuItem) {
      case 'Đăng ký sân':
        return <FieldRegister />
      case 'Lịch đặt sân':
        return <BookingSchedule key={currentVenueId ?? 'none'} />
      case 'Quản lý nhân viên':
        return <VenueManagerList />
      case 'Tổng quan':
      default:
        return (
          <OverviewDashboard
            onNavigateRegister={
              user && isOwner(user)
                ? () => setActiveMenuItem('Đăng ký sân')
                : undefined
            }
          />
        )
    }
  }

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        collapsed={sidebarCollapsed}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
        hideOwnerOnlyItems={user ? !isOwner(user) : false}
      />

      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-content">
        <Header onToggleSidebar={toggleSidebar} isMobile={isMobile} />
        <div className="content-area">{renderContent()}</div>
      </div>
      {showModal && (
        <DevelopmentModal
          feature={modalFeature}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

const DashboardWithVenue = () => (
  <VenueProvider>
    <Dashboard />
  </VenueProvider>
)

const isAuthenticated = () => !!localStorage.getItem('access_token')

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getStoredUser()
  if (!isAuthenticated()) {
    return <>{children}</>
  }
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }
  return <Navigate to="/app" replace />
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  const user = getStoredUser()
  if (!user || !isPortalUser(user)) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }
  return <>{children}</>
}

const ChangePasswordRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  const user = getStoredUser()
  if (!user || !isPortalUser(user)) {
    return <Navigate to="/login" replace />
  }
  if (!user.mustChangePassword) {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ChangePasswordRoute>
              <ChangePasswordPage />
            </ChangePasswordRoute>
          }
        />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <DashboardWithVenue />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  )
}

export default App
