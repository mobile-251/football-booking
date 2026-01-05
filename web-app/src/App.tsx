import { useState, useEffect } from 'react'
import './App.css'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import DevelopmentModal from './components/DevelopmentModal/DevelopmentModal'
import FieldRegister from './components/FieldRegister/FieldRegister'

function App() {
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
    if (menuItem === 'Đăng ký sân') {
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

  return (
    <div className={`app - container ${sidebarCollapsed ? 'sidebar-collapsed' : ''} `}>
      <Sidebar
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        collapsed={sidebarCollapsed}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-content">
        <Header onToggleSidebar={toggleSidebar} isMobile={isMobile} />
        <div className="content-area">
          {activeMenuItem === 'Đăng ký sân' && <FieldRegister />}
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

export default App