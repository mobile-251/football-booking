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
import { Toaster } from 'react-hot-toast'

const Dashboard = () => {
  // Khởi tạo state từ localStorage nếu có, nếu không mặc định là 'Tổng quan'
  const [activeMenuItem, setActiveMenuItem] = useState(() => {
    return localStorage.getItem('activeMenuItem') || 'Tổng quan'
  })
  const [showModal, setShowModal] = useState(false)
  const [modalFeature, setModalFeature] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Lưu activeMenuItem vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('activeMenuItem', activeMenuItem)
  }, [activeMenuItem])

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMenuItemClick = (menuItem: string) => {
    if (menuItem === 'Đăng ký sân' || menuItem === 'Lịch đặt sân') {
      setActiveMenuItem(menuItem)
      setShowModal(false)
    } else if (menuItem !== 'Tổng quan') {
      setModalFeature(menuItem)
      setShowModal(true)
    } else {
      setActiveMenuItem(menuItem)
      setShowModal(false)
    }

    // Close mobile sidebar after selection
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
    localStorage.setItem('logout_success', 'true')
    window.location.href = '/login'
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
      />


      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-content">
        <Header onToggleSidebar={toggleSidebar} isMobile={isMobile} />
        <div className="content-area">
          {activeMenuItem === 'Đăng ký sân' && <FieldRegister />}
          {activeMenuItem === 'Lịch đặt sân' && <BookingSchedule />}
          {activeMenuItem === 'Tổng quan' && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
              <h2>Tổng quan Dashboard</h2>
              <p>Chào mừng đến với hệ thống quản lý sân bóng</p>
            </div>
          )}
        </div>
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

// Hợp phần kiểm tra đã đăng nhập hay chưa
const isAuthenticated = () => !!localStorage.getItem('access_token');

// Route chỉ dành cho khách (chưa đăng nhập)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <Navigate to="/app" replace /> : <>{children}</>;
};

// Route yêu cầu phải đăng nhập
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

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
          path="/app/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  )
}


export default App