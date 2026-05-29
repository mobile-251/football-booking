import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { FieldFormData } from './types'
import locationIcon from '../../assets/location.png'

// Custom icon using location.svg
const customIcon = new L.Icon({
    iconUrl: locationIcon,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'custom-location-icon'
})

interface LocationStepProps {
    formData: FieldFormData
    onChange: (newData: FieldFormData) => void
}

// Component to handle map clicks
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

const LocationStep: React.FC<LocationStepProps> = ({ formData, onChange }) => {
    const [provinces, setProvinces] = useState<any[]>([])
    const [wards, setWards] = useState<any[]>([])
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
    const [isLoadingWards, setIsLoadingWards] = useState(false)

    // Fetch provinces on mount
    useEffect(() => {
        const fetchProvinces = async () => {
            setIsLoadingProvinces(true)
            try {
                const response = await axios.get('https://provinces.open-api.vn/api/p/')
                setProvinces(response.data)
            } catch (error) {
                console.error('Error fetching provinces:', error)
            } finally {
                setIsLoadingProvinces(false)
            }
        }
        fetchProvinces()
    }, [])

    // Fetch wards when city changes
    useEffect(() => {
        const fetchWards = async () => {
            if (!formData.city) {
                setWards([])
                return
            }

            const selectedProvince = provinces.find(p => p.name === formData.city)
            if (!selectedProvince) return

            setIsLoadingWards(true)
            try {
                const response = await axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=3`)
                const allWards: any[] = []
                response.data.districts?.forEach((district: any) => {
                    district.wards?.forEach((ward: any) => {
                        allWards.push({
                            code: ward.code,
                            name: ward.name
                        })
                    })
                })
                setWards(allWards.sort((a, b) => a.name.localeCompare(b.name)))
            } catch (error) {
                console.error('Error fetching wards:', error)
            } finally {
                setIsLoadingWards(false)
            }
        }

        if (provinces.length > 0) {
            fetchWards()
        }
    }, [formData.city, provinces])

    const handleMapClick = (lat: number, lng: number) => {
        onChange({
            ...formData,
            latitude: lat,
            longitude: lng
        })
    }

    return (
        <div className="form-step">
            {/* Tỉnh/Thành phố & Phường/Xã */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: formData.city ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <div className="form-group">
                    <label htmlFor="city" className="form-label">
                        Tỉnh / Thành phố <span className="required">*</span>
                    </label>
                    <select
                        id="city"
                        className="form-input form-select"
                        value={formData.city}
                        onChange={(e) => {
                            onChange({ ...formData, city: e.target.value, district: '' })
                        }}
                        disabled={isLoadingProvinces}
                    >
                        <option value="">{isLoadingProvinces ? 'Đang tải...' : '-- Chọn Tỉnh/Thành --'}</option>
                        {provinces.map(p => (
                            <option key={p.code} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {formData.city && (
                    <div className="form-group">
                        <label htmlFor="district" className="form-label">
                            Phường / Xã
                        </label>
                        <select
                            id="district"
                            className="form-input form-select"
                            value={formData.district || ''}
                            onChange={(e) => onChange({ ...formData, district: e.target.value })}
                            disabled={isLoadingWards}
                        >
                            <option value="">
                                {isLoadingWards ? 'Đang tải Phường/Xã...' : '-- Chọn Phường/Xã --'}
                            </option>
                            {wards.map(w => (
                                <option key={w.code} value={w.name}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Địa chỉ cụ thể */}
            <div className="form-group">
                <label htmlFor="address" className="form-label">
                    Địa chỉ cụ thể <span className="required">*</span>
                </label>
                <input
                    id="address"
                    type="text"
                    className="form-input"
                    placeholder="Số nhà, tên đường, phường/xã..."
                    value={formData.address}
                    onChange={(e) => onChange({ ...formData, address: e.target.value })}
                />
            </div>

            {/* Số điện thoại liên hệ */}
            {/* <div className="form-group">
                <label htmlFor="phone" className="form-label">
                    Số điện thoại liên hệ <span className="required">*</span>
                </label>
                <input
                    id="phone"
                    type="tel"
                    className="form-input"
                    placeholder="VD: 0912345678"
                    value={formData.phone}
                    onChange={(e) => onChange({ ...formData, phone: e.target.value })}
                />
            </div> */}

            {/* Bản đồ */}
            <div className="form-group">
                <label className="form-label">
                    Vị trí trên bản đồ <span className="required">*</span>
                </label>
                <p className="form-help-text">Click vào bản đồ để đánh dấu vị trí chính xác của sân bóng</p>
                <div className="map-wrapper" style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <MapContainer
                        center={[formData.latitude, formData.longitude]}
                        zoom={15}
                        zoomControl={false}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[formData.latitude, formData.longitude]} icon={customIcon} />
                        <MapEvents onMapClick={handleMapClick} />
                        <ZoomControl position="topright" />
                    </MapContainer>
                </div>
                <div className="coords-display">
                    <span>Tọa độ: <strong>{formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</strong></span>
                </div>
            </div>

            <style>{`
                .form-help-text {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 0.75rem;
                }
                .coords-display {
                    margin-top: 0.75rem;
                    font-size: 0.875rem;
                    color: #1e293b;
                    background: #f1f5f9;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    display: inline-block;
                }
                .map-wrapper {
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    position: relative;
                }
                /* Tùy chỉnh nút zoom */
                .leaflet-top.leaflet-right {
                    top: 10px;
                    right: 10px;
                }
                .leaflet-control-zoom {
                    border: none !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                }
                .leaflet-control-zoom a {
                    width: 40px !important;
                    height: 40px !important;
                    line-height: 40px !important;
                    font-size: 20px !important;
                    color: #1F6650 !important;
                    background-color: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    transition: all 0.2s ease;
                }
                .leaflet-control-zoom-in {
                    border-radius: 10px 10px 0 0 !important;
                }
                .leaflet-control-zoom-out {
                    border-radius: 0 0 10px 10px !important;
                }
                .leaflet-control-zoom a:hover {
                    background-color: #f8fafc !important;
                    color: #2563eb !important;
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    )
}

export default LocationStep
