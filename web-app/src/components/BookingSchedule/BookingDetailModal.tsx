import React from 'react';

interface Booking {
    id: string;
    fieldId: string;
    customerName: string;
    phoneNumber?: string;
    startTime: string;
    endTime: string;
    price?: number;
    type: 'booked' | 'maintenance';
    note?: string;
}

interface BookingDetailModalProps {
    booking: Booking;
    onClose: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose }) => {
    // Prevent click from closing when clicking inside content
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={handleContentClick} style={{ animation: 'slideIn 0.3s ease-out' }}>
                <div className="modal-header">
                    <h3>Chi tiết đặt sân</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Customer */}
                    <div className="detail-row">
                        <div className="detail-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6650" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div className="detail-info">
                            <label>Khách hàng</label>
                            <div className="detail-value highlight">{booking.customerName}</div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="detail-row">
                        <div className="detail-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6650" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <div className="detail-info">
                            <label>Số điện thoại</label>
                            <div className="detail-value">{booking.phoneNumber || 'Không có'}</div>
                        </div>
                    </div>

                    {/* Field */}
                    <div className="detail-row">
                        <div className="detail-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6650" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <div className="detail-info">
                            <label>Sân bóng</label>
                            <div className="detail-value">Sân {booking.fieldId}</div>
                        </div>
                    </div>

                    {/* Time */}
                    <div className="detail-row">
                        <div className="detail-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6650" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div className="detail-info">
                            <label>Thời gian</label>
                            <div className="detail-value">{booking.startTime} - {booking.endTime}</div>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="detail-row">
                        <div className="detail-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6650" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div className="detail-info">
                            <label>Giá tiền</label>
                            <div className="detail-value money">
                                {booking.price ? (booking.price).toLocaleString('vi-VN') + 'đ' : '0đ'}
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="detail-row">
                        <div className="detail-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6650" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div className="detail-info">
                            <label>Ghi chú</label>
                            <div className="detail-value note">{booking.note || 'Không có ghi chú'}</div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {/* Can add actions later if needed */}
                </div>
            </div>
        </div>
    );
};

export default BookingDetailModal;
