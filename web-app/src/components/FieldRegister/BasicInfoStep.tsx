import React from 'react'
import type { FieldFormData } from './types'

interface BasicInfoStepProps {
    formData: FieldFormData
    onChange: (newData: FieldFormData) => void
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, onChange }) => {
    const handleFieldTypeChange = (
        type: 'field5' | 'field7' | 'field11',
        action: 'toggle' | 'increment' | 'decrement'
    ) => {
        const newFieldTypes = { ...formData.fieldTypes }
        const currentField = newFieldTypes[type]

        if (action === 'toggle') {
            const newSelected = !currentField.selected
            currentField.selected = newSelected
            // Nếu bỏ chọn thì reset về 0, nếu chọn thì set là 1 nếu đang là 0
            if (!newSelected) {
                currentField.count = 0
            } else if (currentField.count === 0) {
                currentField.count = 1
            }
        } else if (action === 'increment') {
            currentField.count += 1
            // Tự động tích chọn nếu tăng từ 0 lên 1
            if (currentField.count > 0) {
                currentField.selected = true
            }
        } else if (action === 'decrement') {
            if (currentField.count > 0) {
                currentField.count -= 1
                // Nếu giảm về 0 thì tự động bỏ chọn
                if (currentField.count === 0) {
                    currentField.selected = false
                }
            }
        }

        onChange({ ...formData, fieldTypes: newFieldTypes })
    }


    const getTotalFields = () =>
        Object.values(formData.fieldTypes).reduce(
            (total, t) => total + (t.selected ? t.count : 0),
            0
        )

    return (
        <div className="form-step">
            {/* Tên Sân */}
            <div className="form-group">
                <label htmlFor="fieldName" className="form-label">
                    Tên Sân <span className="required">*</span>
                </label>
                <input
                    id="fieldName"
                    type="text"
                    className="form-input"
                    placeholder="VD: Sân Bóng Đế Mini Quận 7"
                    value={formData.fieldName}
                    onChange={(e) => onChange({ ...formData, fieldName: e.target.value })}
                />
            </div>

            {/* Loại Sân */}
            <div className="form-group">
                <label className="form-label">
                    Loại Sân <span className="required">*</span>
                </label>
                <div className="field-types-grid">
                    {(['field5', 'field7', 'field11'] as const).map((type) => (
                        <div key={type} className="field-type-card">
                            <div className="field-type-header">
                                <span className="field-type-name">
                                    {type === 'field5' ? 'Sân 5 người' : type === 'field7' ? 'Sân 7 người' : 'Sân 11 người'}
                                </span>
                                <div className="field-type-controls">
                                    <button onClick={() => handleFieldTypeChange(type, 'decrement')} className="control-btn">
                                        −
                                    </button>
                                    <span className="field-count">{formData.fieldTypes[type].count}</span>
                                    <button onClick={() => handleFieldTypeChange(type, 'increment')} className="control-btn">
                                        +
                                    </button>
                                </div>
                            </div>
                            <button
                                className={`select-btn ${formData.fieldTypes[type].selected ? 'selected' : ''}`}
                                onClick={() => handleFieldTypeChange(type, 'toggle')}
                            >
                                {formData.fieldTypes[type].selected ? 'Đang chọn' : 'Chọn'}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="total-fields">
                    Tổng <span className="total-number">{getTotalFields()}</span> sân
                </div>
            </div>

            {/* Mô Tả */}
            <div className="form-group">
                <label htmlFor="description" className="form-label">
                    Mô Tả
                </label>
                <textarea
                    id="description"
                    className="form-input form-textarea"
                    placeholder="Mô tả chi tiết về sân bóng của bạn..."
                    value={formData.description}
                    onChange={(e) => onChange({ ...formData, description: e.target.value })}
                    rows={4}
                />
            </div>
        </div>
    )
}

export default BasicInfoStep
