import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import DevelopmentModal from './components/DevelopmentModal/DevelopmentModal'

function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('Tổng quan')
  const [showModal, setShowModal] = useState(false)
  const [modalFeature, setModalFeature] = useState('')

  const handleMenuItemClick = (menuItem: string) => {
    if (menuItem !== 'Tổng quan') {
      setModalFeature(menuItem)
      setShowModal(true)
    } else {
      setActiveMenuItem(menuItem)
    }
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
      />
      <div className="main-content">
        <Header />
        <div className="content-area">
          {/* Content sẽ được thêm sau */}
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