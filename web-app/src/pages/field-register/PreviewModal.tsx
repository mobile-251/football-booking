import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { FieldFormData } from './types'
import locationIcon from '../../assets/location.png'

interface PreviewModalProps {
    formData: FieldFormData
    isOpen: boolean
    onClose: () => void
}

const customIcon = new L.Icon({
    iconUrl: locationIcon,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'custom-location-icon'
})

const PreviewModal: React.FC<PreviewModalProps> = ({ formData, isOpen, onClose }) => {
    const [mapKey, setMapKey] = useState(0)

    // Remount map when modal opens to ensure correct rendering
    useEffect(() => {
        if (isOpen) {
            setMapKey(prev => prev + 1)
        }
    }, [isOpen])

    if (!isOpen) return null

    const activeFieldTypes = (['field5', 'field7', 'field11'] as const).filter(
        type => formData.fieldTypes[type].selected
    )

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-left">
                        <h2>Bản xem trước thông tin</h2>
                        <div className="header-status">
                            <span className="dot"></span>
                            Đang kiểm tra
                        </div>
                    </div>
                    <button className="close-btn-round" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body custom-scrollbar">
                    <div className="preview-container">
                        {/* Section: Basic Info */}
                        <div className="preview-section">
                            <h3 className="preview-section-title">Thông tin cơ bản</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Tên sân bóng</span>
                                    <div className="info-value">{formData.fieldName || 'Chưa cung cấp'}</div>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Loại sân đã chọn</span>
                                    <div className="info-tags">
                                        {activeFieldTypes.map(t => (
                                            <span key={t} className="info-tag-item">
                                                {t === 'field5' ? 'Sân 5' : t === 'field7' ? 'Sân 7' : 'Sân 11'}
                                                ({formData.fieldTypes[t].count} cụm)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="info-item full-row">
                                    <span className="info-label">Mô tả chi tiết</span>
                                    <div className="info-value text-muted">{formData.description || 'Không có mô tả chi tiết.'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Location */}
                        <div className="preview-section">
                            <h3 className="preview-section-title">Địa chỉ & Vị trí</h3>
                            <div className="info-grid">
                                <div className="info-item full-row">
                                    <span className="info-label">Địa chỉ cụ thể</span>
                                    <div className="info-value highlighted">{formData.address || 'Chưa cập nhật địa chỉ'}</div>
                                </div>
                            </div>

                            <div className="preview-map-container">
                                <MapContainer
                                    key={mapKey}
                                    center={[formData.latitude, formData.longitude]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    attributionControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[formData.latitude, formData.longitude]} icon={customIcon} />
                                </MapContainer>
                                <div className="map-coordinates-badge">
                                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                </div>
                            </div>
                        </div>

                        {/* Section: Pricing */}
                        <div className="preview-section">
                            <h3 className="preview-section-title">Bảng giá chi tiết</h3>
                            <div className="pricing-preview-grid">
                                {activeFieldTypes.map(type => (
                                    <div key={type} className="pricing-card">
                                        <div className="pricing-card-head">
                                            {type === 'field5' ? 'Sân 5 người' : type === 'field7' ? 'Sân 7 người' : 'Sân 11 người'}
                                        </div>
                                        <div className="pricing-card-body">
                                            <div className="price-group">
                                                <div className="price-type-label">Thứ 2 - Thứ 6</div>
                                                <div className="price-slots-flex">
                                                    {formData.pricing[type]?.weekdays.map((slot, i) => (
                                                        <div key={i} className="price-chip">
                                                            <span className="time">{slot.startTime}-{slot.endTime}</span>
                                                            <span className="amount">{slot.price.toLocaleString()}đ</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="price-group">
                                                <div className="price-type-label">Thứ 7 - Chủ Nhật</div>
                                                <div className="price-slots-flex">
                                                    {formData.pricing[type]?.weekends.map((slot, i) => (
                                                        <div key={i} className="price-chip weekend">
                                                            <span className="time">{slot.startTime}-{slot.endTime}</span>
                                                            <span className="amount">{slot.price.toLocaleString()}đ</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Images */}
                        <div className="preview-section">
                            <h3 className="preview-section-title">Hình ảnh sân bóng</h3>
                            <div className="preview-gallery">
                                {formData.images.map((file, i) => (
                                    <div key={i} className="preview-image-box">
                                        <img src={URL.createObjectURL(file)} alt="Field" />
                                    </div>
                                ))}
                                {formData.images.length === 0 && <div className="no-images">Chưa tải hình ảnh</div>}
                            </div>
                        </div>

                        {/* Section: Contact */}
                        <div className="preview-section last-section">
                            <h3 className="preview-section-title">Thông tin liên hệ</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Số điện thoại</span>
                                    <div className="info-value contact-mark">{formData.phoneNumber || 'Chưa nhập'}</div>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Địa chỉ Email</span>
                                    <div className="info-value contact-mark">{formData.email || 'Chưa nhập'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                }
                .modal-content {
                    background: #f8fafc;
                    width: 100%;
                    max-width: 900px;
                    max-height: 85vh;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    animation: modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes modalPop {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .modal-header {
                    padding: 24px 32px;
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-left h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #1F6650;
                    font-weight: 800;
                }
                .header-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-top: 4px;
                }
                .header-status .dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
                }
                .close-btn-round {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    border: none;
                    color: #64748b;
                    font-size: 1.25rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .close-btn-round:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }

                .modal-body {
                    padding: 32px;
                    overflow-y: auto;
                    flex: 1;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .preview-section {
                    margin-bottom: 40px;
                    text-align: left;
                }
                .preview-section-title {
                    color: #1F6650;
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                    border-left: 4px solid #1F6650;
                    padding-left: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }
                .full-row {
                    grid-column: span 2;
                }
                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .info-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                }
                .info-value {
                    font-size: 1.1rem;
                    color: #334155;
                    font-weight: 600;
                }
                .info-value.text-muted {
                    font-weight: 400;
                    font-size: 0.95rem;
                    color: #64748b;
                    line-height: 1.6;
                }
                .info-value.highlighted {
                    color: #1F6650;
                }

                .preview-map-container {
                    height: 250px;
                    width: 100%;
                    border-radius: 16px;
                    overflow: hidden;
                    margin-top: 20px;
                    border: 1px solid #e2e8f0;
                    position: relative;
                    z-index: 10;
                }
                .map-coordinates-badge {
                    position: absolute;
                    bottom: 12px;
                    left: 12px;
                    background: white;
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #475569;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    z-index: 1000;
                    border: 1px solid #e2e8f0;
                }

                .info-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .info-tag-item {
                    background: #1F6650;
                    color: white;
                    padding: 6px 14px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(31, 102, 80, 0.2);
                }

                .pricing-preview-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .pricing-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .pricing-card-head {
                    background: #f1f5f9;
                    padding: 12px 20px;
                    font-weight: 700;
                    color: #475569;
                    font-size: 0.95rem;
                }
                .pricing-card-body {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .price-type-label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #94a3b8;
                    margin-bottom: 10px;
                }
                .price-slots-flex {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .price-chip {
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    overflow: hidden;
                    font-size: 0.85rem;
                }
                .price-chip .time {
                    padding: 6px 10px;
                    background: #e2e8f0;
                    color: #475569;
                    font-weight: 600;
                }
                .price-chip .amount {
                    padding: 6px 12px;
                    color: #1F6650;
                    font-weight: 700;
                }
                .price-chip.weekend .amount {
                    background: #1F6650;
                    color: white;
                }

                .preview-gallery {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding-bottom: 12px;
                }
                .preview-image-box {
                    flex: 0 0 120px;
                    height: 120px;
                    background: #e2e8f0;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 2px solid white;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .preview-image-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .no-images {
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 0.9rem;
                }

                .contact-mark {
                    color: #1F6650;
                    background: #f0fdf4;
                    padding: 8px 16px;
                    border-radius: 10px;
                    display: inline-block;
                    border: 1px solid #dcfce7;
                }

                .modal-footer {
                    padding: 24px 32px;
                    background: white;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 16px;
                }
                .preview-close-btn {
                    padding: 12px 24px;
                    border-radius: 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .preview-close-btn:hover { background: #f8fafc; color: #334155; }
                .preview-success-btn {
                    padding: 12px 32px;
                    border-radius: 12px;
                    background: #1F6650;
                    color: white;
                    border: none;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(31, 102, 80, 0.3);
                    transition: all 0.2s;
                }
                .preview-success-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(31, 102, 80, 0.4); }

                @media (max-width: 768px) {
                    .info-grid { grid-template-columns: 1fr; }
                    .modal-content { max-height: 95vh; border-radius: 0; }
                    .modal-body { padding: 20px; }
                    .modal-footer { flex-direction: column-reverse; }
                    .preview-close-btn, .preview-success-btn { width: 100%; }
                    .preview-map-container { height: 180px; }
                }
            `}</style>
        </div>
    )
}

export default PreviewModal
