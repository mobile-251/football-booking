import { useState } from 'react'
import './FieldRegister.css'
import BasicInfoStep from './BasicInfoStep'
import StepProgress from './StepProgress'
import FormActions from './FormActions'
import toast, { Toaster } from 'react-hot-toast'

function FieldRegister() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldTypes: {
      field5: { selected: false, count: 0 },
      field7: { selected: false, count: 0 },
      field11: { selected: false, count: 0 },
    },
    description: '',
  })

  // Cấu hình các bước đăng ký
  const steps = [
    { id: 1, title: 'Thông tin cơ bản', subtitle: 'Tên, loại sân, mô tả' },
    { id: 2, title: 'Địa chỉ & Liên hệ', subtitle: 'Vị trí, số điện thoại' },
    { id: 3, title: 'Tiện ích & Quy định', subtitle: 'Dịch vụ, nội quy sân' },
    { id: 4, title: 'Hình ảnh & Giá', subtitle: 'Review, mức giá thuê' },
  ]

  const validateStep1 = () => {
    const { fieldName, fieldTypes } = formData
    const isNameValid = fieldName.trim() !== ''
    const isTypeSelected = Object.values(fieldTypes).some(type => type.selected && type.count > 0)

    if (!isNameValid) {
      toast.error('Vui lòng nhập tên sân')
      return false
    }
    if (!isTypeSelected) {
      toast.error('Vui lòng chọn ít nhất một loại sân')
      return false
    }

    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const handleStepClick = (stepId: number) => {
    if (stepId === currentStep) return

    if (stepId < currentStep) {
      setCurrentStep(stepId)
      return
    }

    if (stepId === currentStep + 1) {
      if (currentStep === 1 && !validateStep1()) {
        return
      }
      setCurrentStep(stepId)
    }
  }

  const handlePreview = () => {
    console.log('Preview data:', formData)
    toast.success('Đang chuẩn bị bản xem trước...')
  }

  return (
    <div className="field-register-container">
      <Toaster position="top-right" />
      <div className="field-register-card">
        <h1 className="field-register-title">Đăng Ký Sân Mới</h1>
        <p className="field-register-subtitle">
          Điền đầy đủ thông tin để đăng ký sân bóng của bạn
        </p>

        <StepProgress
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        <div className="form-content">
          {currentStep === 1 && <BasicInfoStep formData={formData} onChange={setFormData} />}

          {currentStep > 1 && (
            <div className="coming-soon">
              <h3>Bước {currentStep} đang được phát triển</h3>
              <p>Nội dung của {steps[currentStep - 1].title} sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>

        <FormActions
          onPreview={handlePreview}
          onNext={handleNext}
        />
      </div>
    </div>
  )
}

export default FieldRegister
