interface DevelopmentModalProps {
  feature: string
  onClose: () => void
}

function DevelopmentModal({ feature, onClose }: DevelopmentModalProps) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex animate-[fade-in_0.2s] items-center justify-center bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-[90%] max-w-md animate-[slide-up_0.3s_ease] overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="m-0 text-xl text-slate-800">Tính năng đang phát triển</h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded text-2xl text-slate-500 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="mb-4 text-6xl">🚧</div>
          <p className="my-2 text-sm text-slate-500">
            Tính năng <strong className="text-slate-800">{feature}</strong> đang được phát triển.
          </p>
          <p className="text-sm text-slate-500">Vui lòng quay lại sau!</p>
        </div>
        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button type="button" className="btn-primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default DevelopmentModal
