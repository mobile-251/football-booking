import { useState, useEffect } from 'react'
import './FieldRegister.css'
import BasicInfoStep from './BasicInfoStep'
import LocationStep from './LocationStep'
import PricingImagesStep from './PricingImagesStep'
import StepProgress from './StepProgress'
import FormActions from './FormActions'
import ContactStep from './ContactStep'
import PreviewModal from './PreviewModal'
import venueApi from '../../api/venueApi'
import toast from 'react-hot-toast'
import type { FieldFormData, PricingData } from './types'

const pricingSuggestions = {
  field5: {
    weekdays: [
      { startTime: '06:00', endTime: '16:00', price: 200000 },
      { startTime: '16:00', endTime: '22:00', price: 350000 },
      { startTime: '22:00', endTime: '23:00', price: 150000 },
    ],
    weekends: [
      { startTime: '06:00', endTime: '16:00', price: 250000 },
      { startTime: '16:00', endTime: '22:00', price: 400000 },
      { startTime: '22:00', endTime: '23:00', price: 150000 },
    ]
  },
  field7: {
    weekdays: [
      { startTime: '06:00', endTime: '16:00', price: 300000 },
      { startTime: '16:00', endTime: '22:00', price: 500000 },
      { startTime: '22:00', endTime: '23:00', price: 250000 },
    ],
    weekends: [
      { startTime: '06:00', endTime: '16:00', price: 350000 },
      { startTime: '16:00', endTime: '22:00', price: 550000 },
      { startTime: '22:00', endTime: '23:00', price: 250000 },
    ]
  },
  field11: {
    weekdays: [
      { startTime: '06:00', endTime: '16:00', price: 900000 },
      { startTime: '16:00', endTime: '22:00', price: 1000000 },
      { startTime: '22:00', endTime: '23:00', price: 800000 },
    ],
    weekends: [
      { startTime: '06:00', endTime: '16:00', price: 950000 },
      { startTime: '16:00', endTime: '22:00', price: 1100000 },
      { startTime: '22:00', endTime: '23:00', price: 800000 },
    ]
  }
}

const INITIAL_FORM_DATA = {
  fieldName: '',
  fieldTypes: {
    field5: { selected: false, count: 0 },
    field7: { selected: false, count: 0 },
    field11: { selected: false, count: 0 },
  },
  description: '',
  address: '',
  city: '',
  district: '',
  latitude: 10.762622,
  longitude: 106.660172,
  phoneNumber: '',
  email: '',
  pricing: {} as PricingData,
  images: [] as File[],
}

function FieldRegister() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  // Cấu hình các bước đăng ký
  const steps = [
    { id: 1, title: 'Thông tin cơ bản', subtitle: 'Tên, loại sân, mô tả' },
    { id: 2, title: 'Địa chỉ & Liên hệ', subtitle: 'Vị trí, số điện thoại và tọa độ' },
    { id: 3, title: 'Hình ảnh & Giá', subtitle: 'Bảng giá và hình ảnh sân' },
    { id: 4, title: 'Thông tin liên hệ', subtitle: 'Số điện thoại và email' },
  ]

  // Tự động cập nhật pricing khi thay đổi loại sân
  useEffect(() => {
    const newPricing = { ...formData.pricing }
    let updated = false

    const selectedTypes = (['field5', 'field7', 'field11'] as const).filter(
      type => formData.fieldTypes[type].selected
    )

    // Xóa các loại sân không còn được chọn khỏi dữ liệu pricing
    Object.keys(newPricing).forEach(key => {
      const typeKey = key as keyof typeof formData.fieldTypes
      if (!formData.fieldTypes[typeKey]?.selected) {
        delete newPricing[key as keyof typeof formData.pricing]
        updated = true
      }
    })

    // Thêm gợi ý cho các loại sân mới được chọn (nếu chưa có giá)
    selectedTypes.forEach(type => {
      if (!newPricing[type]) {
        newPricing[type] = (pricingSuggestions as any)[type]
        updated = true
      }
    })

    if (updated) {
      setFormData(prev => ({ ...prev, pricing: newPricing }))
    }
  }, [formData.fieldTypes])

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
    if (!formData.city.trim()) {
      toast.error('Vui lòng chọn Thành phố/Tỉnh')
      return false
    }
    return true
  }

  const validateStep4 = () => {
    const { phoneNumber, email } = formData

    // Validate phone: 10 digits
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại liên hệ')
      return false
    }
    if (!phoneRegex.test(phoneNumber.trim())) {
      toast.error('Số điện thoại không hợp lệ (cần 10 chữ số)')
      return false
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      toast.error('Vui lòng nhập email liên hệ')
      return false
    }
    if (!emailRegex.test(email.trim())) {
      toast.error('Email không hợp lệ')
      return false
    }

    return true
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return
    }

    if (currentStep === 2 && !validateStep2()) return

    if (currentStep === 4) {
      if (!validateStep4()) return
      console.log('Registering venue with data:', formData);

      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const ownerId = user?.id;

        if (!ownerId) {
          toast.error('Không tìm thấy thông tin chủ sân. Vui lòng đăng nhập lại.');
          return;
        }

        // Chuyển đổi dữ liệu sang format BE yêu cầu (CreateVenueDto)
        const payload = {
          name: formData.fieldName,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          district: formData.district || undefined,
          latitude: formData.latitude,
          longitude: formData.longitude,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          ownerId: ownerId,
          fieldTypes: formData.fieldTypes,
          pricing: formData.pricing,
        };

        const response = await venueApi.create(payload);
        console.log('API Response:', response);
        toast.success('Đăng ký sân thành công!');

        // Reset form về trạng thái ban đầu
        setFormData(INITIAL_FORM_DATA);
        setCurrentStep(1);

      } catch (error: any) {
        console.error('API Error:', error);
        const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký!';
        toast.error(msg);
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
