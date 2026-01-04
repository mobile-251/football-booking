import './DevelopmentModal.css'

interface DevelopmentModalProps {
  feature: string
  onClose: () => void
}

function DevelopmentModal({ feature, onClose }: DevelopmentModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tính năng đang phát triển</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-icon">🚧</div>
          <p>Tính năng <strong>"{feature}"</strong> đang được phát triển.</p>
          <p>Vui lòng quay lại sau!</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

export default DevelopmentModal