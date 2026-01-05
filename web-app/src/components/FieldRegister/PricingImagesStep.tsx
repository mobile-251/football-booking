import React, { useCallback } from 'react'
import type { FieldFormData, PriceSlot } from './types'
import DropIcon from '../../assets/drop.svg'
import DeleteIcon from '../../assets/delete.svg'

interface PricingImagesStepProps {
    formData: FieldFormData
    onChange: (newData: FieldFormData) => void
}

const PricingImagesStep: React.FC<PricingImagesStepProps> = ({ formData, onChange }) => {
    // Get active field types from formData
    const activeFieldTypes = (['field5', 'field7', 'field11'] as const).filter(
        type => formData.fieldTypes[type].selected
    )

    const handleAddPriceSlot = (fieldType: string, type: 'weekdays' | 'weekends') => {
        const fieldPricing = formData.pricing[fieldType as keyof typeof formData.pricing]
        if (!fieldPricing) return

        const newPricing = { ...formData.pricing }
        newPricing[fieldType as keyof typeof formData.pricing] = {
            ...fieldPricing,
            [type]: [...fieldPricing[type], { startTime: '00:00', endTime: '00:00', price: 0 }]
        }
        onChange({ ...formData, pricing: newPricing })
    }

    const handleRemovePriceSlot = (fieldType: string, type: 'weekdays' | 'weekends', index: number) => {
        const fieldPricing = formData.pricing[fieldType as keyof typeof formData.pricing]
        if (!fieldPricing) return

        const newPricing = { ...formData.pricing }
        newPricing[fieldType as keyof typeof formData.pricing] = {
            ...fieldPricing,
            [type]: fieldPricing[type].filter((_, i) => i !== index)
        }
        onChange({ ...formData, pricing: newPricing })
    }

    const handlePriceChange = (
        fieldType: string,
        type: 'weekdays' | 'weekends',
        index: number,
        field: keyof PriceSlot,
        value: string | number
    ) => {
        const fieldPricing = formData.pricing[fieldType as keyof typeof formData.pricing]
        if (!fieldPricing) return

        const newPricing = { ...formData.pricing }
        newPricing[fieldType as keyof typeof formData.pricing] = {
            ...fieldPricing,
            [type]: fieldPricing[type].map((slot, i) => {
                if (i === index) {
                    return { ...slot, [field]: field === 'price' ? Number(value) : value }
                }
                return slot
            })
        }
        onChange({ ...formData, pricing: newPricing })
    }

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer.files)
        const imageFiles = files.filter(file => file.type.startsWith('image/'))
        onChange({ ...formData, images: [...formData.images, ...imageFiles] })
    }, [formData, onChange])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            onChange({ ...formData, images: [...formData.images, ...files] })
        }
    }

    const removeImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index)
        onChange({ ...formData, images: newImages })
    }

    return (
        <div className="pricing-images-step">
            <div className="pricing-section">
                <h3 className="section-title">Bảng giá thuê sân</h3>

                {activeFieldTypes.length > 0 ? (
                    activeFieldTypes.map(fieldType => {
                        const pricing = formData.pricing[fieldType]
                        if (!pricing) return null

                        return (
                            <div key={fieldType} className="field-type-section">
                                <div className="field-header-card">
                                    {fieldType === 'field5' ? 'Sân 5 người' : fieldType === 'field7' ? 'Sân 7 người' : 'Sân 11 người'}
                                </div>

                                <div className="pricing-tables-wrapper">
                                    {/* Weekdays */}
                                    <div className="pricing-table-container">
                                        <div className="table-header">
                                            <h4>Thứ 2 - Thứ 6</h4>
                                            <button className="add-slot-btn" onClick={() => handleAddPriceSlot(fieldType, 'weekdays')}>
                                                + Thêm khung giờ
                                            </button>
                                        </div>
                                        <div className="pricing-grid header">
                                            <div>Bắt đầu</div>
                                            <div>Kết thúc</div>
                                            <div>Giá (VNĐ/giờ)</div>
                                            <div></div>
                                        </div>
                                        {pricing.weekdays.map((slot, index) => (
                                            <div key={index} className="pricing-grid">
                                                <input
                                                    type="time"
                                                    className="themed-input"
                                                    value={slot.startTime}
                                                    onChange={(e) => handlePriceChange(fieldType, 'weekdays', index, 'startTime', e.target.value)}
                                                />
                                                <input
                                                    type="time"
                                                    className="themed-input"
                                                    value={slot.endTime}
                                                    onChange={(e) => handlePriceChange(fieldType, 'weekdays', index, 'endTime', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    className="themed-input"
                                                    placeholder="VNĐ"
                                                    value={slot.price}
                                                    onChange={(e) => handlePriceChange(fieldType, 'weekdays', index, 'price', e.target.value)}
                                                />
                                                <button className="remove-btn" onClick={() => handleRemovePriceSlot(fieldType, 'weekdays', index)}>
                                                    <img src={DeleteIcon} alt="Delete" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Weekends */}
                                    <div className="pricing-table-container">
                                        <div className="table-header">
                                            <h4>Thứ 7 - Chủ Nhật</h4>
                                            <button className="add-slot-btn" onClick={() => handleAddPriceSlot(fieldType, 'weekends')}>
                                                + Thêm khung giờ
                                            </button>
                                        </div>
                                        <div className="pricing-grid header">
                                            <div>Bắt đầu</div>
                                            <div>Kết thúc</div>
                                            <div>Giá (VNĐ/giờ)</div>
                                            <div></div>
                                        </div>
                                        {pricing.weekends.map((slot, index) => (
                                            <div key={index} className="pricing-grid">
                                                <input
                                                    type="time"
                                                    className="themed-input"
                                                    value={slot.startTime}
                                                    onChange={(e) => handlePriceChange(fieldType, 'weekends', index, 'startTime', e.target.value)}
                                                />
                                                <input
                                                    type="time"
                                                    className="themed-input"
                                                    value={slot.endTime}
                                                    onChange={(e) => handlePriceChange(fieldType, 'weekends', index, 'endTime', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    className="themed-input"
                                                    placeholder="VNĐ"
                                                    value={slot.price}
                                                    onChange={(e) => handlePriceChange(fieldType, 'weekends', index, 'price', e.target.value)}
                                                />
                                                <button className="remove-btn" onClick={() => handleRemovePriceSlot(fieldType, 'weekends', index)}>
                                                    <img src={DeleteIcon} alt="Delete" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="no-selection">Vui lòng chọn loại sân ở bước 1</div>
                )}
            </div>

            {/* Hình ảnh sân */}
            <div className="images-section">
                <h3 className="section-title">Hình ảnh sân bóng</h3>
                <div
                    className="drag-drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        hidden
                    />
                    <label htmlFor="file-upload" className="upload-label">
                        <div className="upload-icon">
                            <img src={DropIcon} alt="Upload" />
                        </div>
                        <p>Kéo thả hình ảnh vào đây hoặc click để chọn tệp</p>
                        <span>Hỗ trợ: JPG, PNG, WEBP</span>
                    </label>
                </div>

                {formData.images.length > 0 && (
                    <div className="images-preview-grid">
                        {formData.images.map((file, index) => (
                            <div key={index} className="image-preview-card">
                                <img src={URL.createObjectURL(file)} alt={`preview-${index}`} />
                                <button className="remove-img-btn" onClick={() => removeImage(index)}>
                                    <img src={DeleteIcon} alt="Delete" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .pricing-images-step {
                    display: flex;
                    flex-direction: column;
                    gap: 48px;
                }
                .section-title {
                    color: #1F6650;
                    font-size: 1.25rem;
                    margin-bottom: 24px;
                    border-left: 5px solid #1F6650;
                    padding-left: 16px;
                    font-weight: 700;
                }
                .field-type-section {
                    margin-bottom: 40px;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .field-header-card {
                    background: linear-gradient(180deg, #1F6650 0%, #0F5132 100%);
                    color: white;
                    padding: 16px 24px;
                    font-size: 1.125rem;
                    font-weight: 700;
                    text-align: left;
                    letter-spacing: 0.5px;
                }
                .pricing-tables-wrapper {
                    padding: 24px;
                }
                .pricing-table-container {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                    border: 1px solid #e2e8f0;
                }
                .pricing-table-container:last-child {
                    margin-bottom: 0;
                }
                .table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .table-header h4 {
                    margin: 0;
                    color: #334155;
                    font-weight: 600;
                }
                .add-slot-btn {
                    background: #1F6650;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .add-slot-btn:hover {
                    opacity: 0.9;
                }
                .pricing-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1.5fr 44px;
                    gap: 12px;
                    margin-bottom: 12px;
                    align-items: center;
                }
                .pricing-grid.header {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: 600;
                    margin-bottom: 8px;
                    padding-left: 12px;
                }
                .themed-input {
                    padding: 12px 16px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    background: white !important;
                    color: #6F9A8D !important;
                    font-weight: 600;
                    outline: none;
                    width: 100%;
                    transition: border-color 0.2s;
                    appearance: none;
                }
                .themed-input[type="time"] {
                    position: relative;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236F9A8D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolyline points='12 6 12 12 16 14'%3E%3C/polyline%3E%3C/svg%3E") !important;
                    background-repeat: no-repeat !important;
                    background-position: right 12px center !important;
                    background-size: 18px !important;
                    cursor: pointer;
                }
                /* Customize time picker icon area to be clickable */
                .themed-input::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    opacity: 0;
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: 40px;
                    height: 100%;
                }
                /* Remove arrows from number input */
                .themed-input[type="number"]::-webkit-outer-spin-button,
                .themed-input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .themed-input[type="number"] {
                    -moz-appearance: textfield;
                }
                .themed-input:focus {
                    border-color: #1F6650;
                }
                .remove-btn {
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .remove-btn:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                }
                .remove-btn:hover img {
                    filter: brightness(0) invert(1);
                }
                .remove-btn img {
                    width: 20px;
                    height: 20px;
                }
                
                /* Image styles */
                .drag-drop-zone {
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    padding: 40px;
                    text-align: center;
                    cursor: pointer;
                    background: #f8fafc;
                    transition: border-color 0.3s;
                }
                .drag-drop-zone:hover {
                    border-color: #1F6650;
                }
                .upload-icon img {
                    width: 64px;
                    height: 64px;
                    margin-bottom: 12px;
                }
                .images-preview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 16px;
                    margin-top: 24px;
                }
                .image-preview-card {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .remove-img-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: #ef4444;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                }
                .remove-img-btn img {
                    width: 18px;
                    height: 18px;
                    filter: brightness(0) invert(1);
                }
                .no-selection {
                    padding: 60px;
                    text-align: center;
                    background: #f8fafc;
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    color: #64748b;
                }

                @media (max-width: 1024px) {
                    .pricing-tables-wrapper {
                        padding: 16px;
                    }
                    .pricing-grid {
                        gap: 8px;
                    }
                }

                @media (max-width: 768px) {
                    .pricing-images-step {
                        gap: 32px;
                    }
                    .pricing-grid.header {
                        display: none;
                    }
                    .pricing-grid {
                        grid-template-columns: 1fr 1fr;
                        background: white;
                        padding: 12px;
                        border-radius: 10px;
                        margin-bottom: 16px;
                        border: 1px solid #e2e8f0;
                    }
                    .pricing-grid input[type="number"] {
                        grid-column: span 2;
                    }
                    .remove-btn {
                        grid-column: span 2;
                        width: 100%;
                        height: 40px;
                        border-radius: 8px;
                    }
                    .section-title {
                        font-size: 1.1rem;
                        margin-bottom: 16px;
                    }
                    .drag-drop-zone {
                        padding: 24px 16px;
                    }
                    .upload-icon img {
                        width: 48px;
                        height: 48px;
                    }
                }

                @media (max-width: 480px) {
                    .pricing-tables-wrapper {
                        padding: 8px;
                    }
                    .pricing-table-container {
                        padding: 12px;
                    }
                    .table-header h4 {
                        font-size: 0.9rem;
                    }
                    .add-slot-btn {
                        padding: 6px 12px;
                        font-size: 0.75rem;
                    }
                    .images-preview-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                }
            `}</style>
        </div>
    )
}

export default PricingImagesStep
