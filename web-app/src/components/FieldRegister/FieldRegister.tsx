import { useState } from 'react'
import './FieldRegister.css'
import BasicInfoStep from './BasicInfoStep'
import LocationStep from './LocationStep'
import PricingImagesStep from './PricingImagesStep'
import StepProgress from './StepProgress'
import FormActions from './FormActions'
import ContactStep from './ContactStep'
import PreviewModal from './PreviewModal'
import AxiosClient from '../../api/AxiosClient'
import toast, { Toaster } from 'react-hot-toast'
import type { FieldFormData, PricingData } from './types'

function FieldRegister() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldTypes: {
      field5: { selected: false, count: 0 },
      field7: { selected: false, count: 0 },
      field11: { selected: false, count: 0 },
    },
    description: '',
    address: '',
    latitude: 10.762622,
    longitude: 106.660172,
    phone: '',
    email: '',
    pricing: {} as PricingData,
    images: [] as File[],
  })

  // Mẫu giá gợi ý cho các loại sân
  const pricingSuggestions = {
    field5: {
      weekdays: [
        { startTime: '05:00', endTime: '16:00', price: 200000 },
        { startTime: '16:00', endTime: '22:00', price: 350000 },
        { startTime: '22:00', endTime: '05:00', price: 150000 },
      ],
      weekends: [
        { startTime: '05:00', endTime: '22:00', price: 400000 },
        { startTime: '22:00', endTime: '05:00', price: 200000 },
      ]
    },
    field7: {
      weekdays: [
        { startTime: '05:00', endTime: '16:00', price: 300000 },
        { startTime: '16:00', endTime: '22:00', price: 500000 },
        { startTime: '22:00', endTime: '05:00', price: 250000 },
      ],
      weekends: [
        { startTime: '05:00', endTime: '22:00', price: 600000 },
        { startTime: '22:00', endTime: '05:00', price: 300000 },
      ]
    },
    field11: {
      weekdays: [
        { startTime: '05:00', endTime: '16:00', price: 500000 },
        { startTime: '16:00', endTime: '22:00', price: 800000 },
        { startTime: '22:00', endTime: '05:00', price: 400000 },
      ],
      weekends: [
        { startTime: '05:00', endTime: '22:00', price: 1000000 },
        { startTime: '22:00', endTime: '05:00', price: 500000 },
      ]
    }
  }

  // Cấu hình các bước đăng ký
  const steps = [
    { id: 1, title: 'Thông tin cơ bản', subtitle: 'Tên, loại sân, mô tả' },
    { id: 2, title: 'Địa chỉ & Liên hệ', subtitle: 'Vị trí, số điện thoại và tọa độ' },
    { id: 3, title: 'Hình ảnh & Giá', subtitle: 'Bảng giá và hình ảnh sân' },
    { id: 4, title: 'Thông tin liên hệ', subtitle: 'Số điện thoại và email' },
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

  const validateStep2 = () => {
    const { address } = formData
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ cụ thể')
      return false
    }
    return true
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return

      // Khởi tạo pricing dựa trên lựa chọn ở Bước 1
      const newPricing = { ...formData.pricing }
      let updated = false

      const selectedTypes = (['field5', 'field7', 'field11'] as const).filter(
        type => formData.fieldTypes[type].selected
      )

      // Xóa các loại sân không còn được chọn khỏi dữ liệu pricing
      Object.keys(newPricing).forEach(key => {
        if (!formData.fieldTypes[key as keyof typeof formData.fieldTypes].selected) {
          delete newPricing[key as keyof typeof formData.pricing]
          updated = true
        }
      })

      // Thêm gợi ý cho các loại sân mới được chọn (nếu chưa có giá)
      selectedTypes.forEach(type => {
        if (!newPricing[type]) {
          newPricing[type] = pricingSuggestions[type]
          updated = true
        }
      })

      if (updated) {
        setFormData(prev => ({ ...prev, pricing: newPricing }))
      }
    }

    if (currentStep === 2 && !validateStep2()) return

    if (currentStep === 4) {
      console.log('Registering venue with data:', formData);

      try {
        // Gọi API /venue method POST sử dụng async/await
        const response = await AxiosClient.post('/venue', formData);
        console.log('API Response:', response);
        toast.success('Đăng ký sân thành công!');
      } catch (error) {
        console.error('API Error:', error);
        toast.error('Có lỗi xảy ra khi đăng ký!');
      }

      return
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleStepClick = (stepId: number) => {
    if (stepId === currentStep) return

    if (stepId < currentStep) {
      setCurrentStep(stepId)
      return
    }

    if (stepId === currentStep + 1) {
      if (currentStep === 1 && !validateStep1()) return
      if (currentStep === 2 && !validateStep2()) return
      setCurrentStep(stepId)
    }

    if (stepId > currentStep + 1) {
      if (currentStep === 1 && !validateStep1()) return
      if (currentStep === 2 && !validateStep2()) return
      setCurrentStep(stepId)
    }
  }

  const handlePreview = () => {
    setIsPreviewOpen(true)
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
          {currentStep === 1 && (
            <BasicInfoStep
              formData={formData as FieldFormData}
              onChange={(newData) => setFormData(newData as any)}
            />
          )}
          {currentStep === 2 && (
            <LocationStep
              formData={formData as FieldFormData}
              onChange={(newData) => setFormData(newData as any)}
            />
          )}
          {currentStep === 3 && (
            <PricingImagesStep
              formData={formData as FieldFormData}
              onChange={(newData) => setFormData(newData as any)}
            />
          )}

          {currentStep === 4 && (
            <ContactStep
              formData={formData as FieldFormData}
              onChange={(newData) => setFormData(newData as any)}
            />
          )}
        </div>

        <FormActions
          onPreview={handlePreview}
          onNext={handleNext}
          onBack={handleBack}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      </div>

      <PreviewModal
        formData={formData as FieldFormData}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

export default FieldRegister
