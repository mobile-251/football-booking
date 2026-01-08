import React, { useState, useEffect } from 'react'
import './BookingSchedule.css'
import BookingDetailModal from './BookingDetailModal'
import venueApi from '../../api/venueApi'
import bookingApi from '../../api/bookingApi'
import { Toaster, toast } from 'react-hot-toast'

// Interface mapping to backend models
interface Field {
    id: number
    name: string
    fieldType: string // 'FIELD_5VS5', etc.
    isActive: boolean
    venueId: number
}

interface Booking {
    id: string | number // Frontend handles ID, backend is number
    fieldId: number
    fieldName: string // Added fieldName for better display
    customerName: string
    phoneNumber?: string
    startTime: string // HH:mm format for display
    endTime: string // HH:mm format for display
    price?: number
    type: 'booked' | 'maintenance' | 'pending' | 'confirmed' | 'canceled'
    note?: string
    status?: string
    originalData?: any // Store full backend object if needed
}

const BookingSchedule: React.FC = () => {
    // Stage: Selected date for the schedule (default Today)
    const [selectedDate, setSelectedDate] = useState(new Date())
    // State: View month for the sidebar calendar
    const [viewDate, setViewDate] = useState(new Date())
    // State: Selected booking to show detailed modal
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    // State: Filter field type
    const [filterType, setFilterType] = useState('All')

    const [venueId, setVenueId] = useState<number | null>(null)
    const [fields, setFields] = useState<Field[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(false)

    // Load user and venue on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);

                    // Fetch all venues and find the one owned by this user
                    // Since there is no specific endpoint for "my venues", we fetch all and filter
                    // This is a temporary solution until backend provides /venues/me or similar
                    const allVenues: any = await venueApi.getAll();

                    // Handle if response is array or object wrapped
                    const venuesList = Array.isArray(allVenues) ? allVenues : (allVenues as any).data || [];

                    const myVenue = venuesList.find((v: any) => v.owner?.user?.id === user.id);

                    if (myVenue) {
                        setVenueId(myVenue.id);
                        // Fetch fields for this venue
                        fetchFields(myVenue.id);
                    } else {
                        // If no venue found, maybe prompt user to create one?
                        // For now just log or show empty state
                        console.log("No venue found for this user");
                    }
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
                toast.error("Không thể tải thông tin sân bóng");
            }
        };
        loadInitialData();
    }, []);

    const fetchFields = async (vId: number) => {
        try {
            const venueData: any = await venueApi.getOne(vId);
            if (venueData && venueData.fieldsPricings) {
                // venueData.fieldsPricings contains the fields list (based on backend response structure)
                const sortedFields = sortFields(venueData.fieldsPricings);
                setFields(sortedFields);
            } else if (venueData && venueData.fields) { // Fallback if structure changes
                const sortedFields = sortFields(venueData.fields);
                setFields(sortedFields);
            }
        } catch (error) {
            console.error("Error fetching fields:", error);
        }
    }

    const sortFields = (fieldsList: any[]) => {
        const priority: { [key: string]: number } = {
            'FIELD_5VS5': 1,
            'FIELD_7VS7': 2,
            'FIELD_11VS11': 3
        };
        return [...fieldsList].sort((a, b) => {
            const pA = priority[a.fieldType] || 99;
            const pB = priority[b.fieldType] || 99;
            if (pA !== pB) return pA - pB;
            return a.name.localeCompare(b.name);
        });
    }

    // Load bookings when date or venue changes
    useEffect(() => {
        if (venueId) {
            fetchBookings();
        }
    }, [venueId, selectedDate]);

    const fetchBookings = async () => {
        if (!venueId) return;
        setLoading(true);
        try {
            // Fetch bookings for the select venue
            // API doesn't support date filtering for "findAll", so we might fetch all confirmed/pending bookings
            // Or we check if there is a better endpoint. 
            // Currently using findAll({ venueId }) and filtering by date locally.
            // Note: Optimally backend should support date range filtering.
            const res: any = await bookingApi.getAll({ venueId: venueId });
            const bookingsList = Array.isArray(res) ? res : (res as any).data || [];

            // Filter by date
            const targetDateStr = selectedDate.toISOString().split('T')[0];

            const dayBookings = bookingsList.filter((b: any) => {
                if (!b.startTime) return false;
                const bookingDate = new Date(b.startTime).toISOString().split('T')[0];
                // Only showing active bookings (not cancelled)
                const isActive = b.status !== 'CANCELLED' && b.status !== 'REJECTED';
                return bookingDate === targetDateStr && isActive;
            });

            // Map to frontend Booking interface
            const mappedBookings: Booking[] = dayBookings.map((b: any) => {
                const start = new Date(b.startTime);
                const end = new Date(b.endTime);

                return {
                    id: b.id,
                    fieldId: b.fieldId,
                    fieldName: b.field?.name || `Sân ${b.fieldId}`,
                    customerName: b.customerName,
                    phoneNumber: b.customerPhone,
                    startTime: formatTime(start),
                    endTime: formatTime(end),
                    price: b.totalPrice,
                    type: b.status === 'CONFIRMED' ? 'booked' : 'pending', // diligent mapping
                    status: b.status,
                    note: b.note,
                    originalData: b
                };
            });

            setBookings(mappedBookings);

        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast.error("Không thể tải lịch đặt sân");
        } finally {
            setLoading(false);
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    // Helpers
    const handlePrevDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(selectedDate.getDate() - 1)
        setSelectedDate(newDate)
        if (newDate.getMonth() !== viewDate.getMonth()) {
            setViewDate(newDate)
        }
    }

    const handleNextDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(selectedDate.getDate() + 1)
        setSelectedDate(newDate)
        if (newDate.getMonth() !== viewDate.getMonth()) {
            setViewDate(newDate)
        }
    }

    const handlePrevMonth = () => {
        const newDate = new Date(viewDate)
        newDate.setMonth(viewDate.getMonth() - 1)
        setViewDate(newDate)
    }

    const handleNextMonth = () => {
        const newDate = new Date(viewDate)
        newDate.setMonth(viewDate.getMonth() + 1)
        setViewDate(newDate)
    }

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate)
        newDate.setDate(day)
        setSelectedDate(newDate)
    }

    // Calendar Grid Logic
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
        return day === 0 ? 6 : day - 1
    }

    const totalDays = getDaysInMonth(viewDate)
    const startOffset = getFirstDayOfMonth(viewDate)
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1)
    const emptySlots = Array.from({ length: startOffset }, (_, i) => i)

    // Formatting
    const formatMainDate = (date: Date) => {
        return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
    }

    const formatMonthYear = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
    }

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === viewDate.getMonth() &&
            selectedDate.getFullYear() === viewDate.getFullYear()
    }

    const isToday = (day: number) => {
        const today = new Date()
        return today.getDate() === day &&
            today.getMonth() === viewDate.getMonth() &&
            today.getFullYear() === viewDate.getFullYear()
    }

    const HOURS = Array.from({ length: 18 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`)

    const hourToPx = (time: string) => {
        const [h, m] = time.split(':').map(Number)
        return ((h + m / 60) - 6) * 64
    }

    // Map field type for display
    const getFieldTypeDisplay = (type: string) => {
        switch (type) {
            case 'FIELD_5VS5': return 'Sân 5';
            case 'FIELD_7VS7': return 'Sân 7';
            case 'FIELD_11VS11': return 'Sân 11';
            default: return type;
        }
    }

    // Filter fields based on dropdown and sort by field type (5VS5 -> 7VS7 -> 11VS11)
    const filteredFields = sortFields(fields.filter(f => {
        const displayType = getFieldTypeDisplay(f.fieldType);
        return filterType === 'All' || displayType === filterType;
    }));

    return (
        <div className="booking-page">
            <Toaster position="top-right" />
            {/* HEADER */}
            <div className="booking-top">
                <div>
                    <h2>Quản lý lịch đặt sân</h2>
                    <p>Xem và quản lý tất cả đặt sân của bạn</p>
                </div>
                <button className="btn-export">Xuất Excel</button>
            </div>

            <div className="booking-body">
                {/* SIDEBAR */}
                <aside className="booking-sidebar">
                    <div className="calendar-card">
                        <div className="calendar-header">
                            <button onClick={handlePrevMonth}>‹</button>
                            <span>{formatMonthYear(viewDate)}</span>
                            <button onClick={handleNextMonth}>›</button>
                        </div>

                        <div className="calendar-grid">
                            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                                <div key={d} className="cal-day">{d}</div>
                            ))}
                            {emptySlots.map(i => <div key={`empty-${i}`} />)}
                            {daysArray.map(day => (
                                <div
                                    key={day}
                                    className={`cal-date ${isSelected(day) ? 'active' : ''}`}
                                    onClick={() => handleDateClick(day)}
                                    style={isToday(day) && !isSelected(day) ? { color: '#1F6650', fontWeight: 'bold' } : {}}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="legend-card">
                        <div className="legend-item">
                            <span className="dot" style={{ background: '#dbeafe', borderLeft: 'non' }} /> Hoàn tất
                        </div>
                        <div className="legend-item">
                            <span className="dot booked" /> Đã xác nhận
                        </div>
                        <div className="legend-item">
                            <span className="dot" style={{ background: '#f59e0b' }} /> Chờ xác nhận
                        </div>
                        <div className="legend-item">
                            <span className="dot maintenance" /> Bảo trì
                        </div>
                        <div className="legend-item">
                            <span className="dot empty" /> Còn trống
                        </div>
                    </div>

                    <div className="stat-card">
                        <span>Tổng booking trong ngày</span>
                        <strong>{bookings.length}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Doanh thu dự kiến</span>
                        <strong>{bookings.reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()}đ</strong>
                    </div>
                </aside>

                {/* SCHEDULE */}
                <section className="schedule">
                    <div className="schedule-header">
                        <div className="date-nav">
                            <button onClick={handlePrevDay}>‹</button>
                            <span style={{ textTransform: 'capitalize' }}>{formatMainDate(selectedDate)}</span>
                            <button onClick={handleNextDay}>›</button>
                        </div>

                        <select
                            className="field-filter"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="All">Tất cả sân</option>
                            <option value="Sân 5">Sân 5</option>
                            <option value="Sân 7">Sân 7</option>
                            <option value="Sân 11">Sân 11</option>
                        </select>
                    </div>

                    <div className="schedule-grid">
                        {/* TIME COLUMN */}
                        <div className="time-column">
                            <div className="time-spacer" />
                            {HOURS.map(h => (
                                <div key={h} className="time-slot">{h}</div>
                            ))}
                        </div>

                        {/* FIELD COLUMNS */}
                        {loading ? (
                            <div style={{ padding: '20px' }}>Loading...</div>
                        ) : filteredFields.length === 0 ? (
                            <div style={{ padding: '20px' }}>Chưa có sân nào được tạo.</div>
                        ) : (
                            filteredFields.map(field => (
                                <div key={field.id} className="field-column">
                                    <div className="field-header">
                                        <div className="field-name">{field.name}</div>
                                        <div className="field-type">{getFieldTypeDisplay(field.fieldType)}</div>
                                    </div>

                                    <div className="field-body">
                                        {bookings.filter(b => b.fieldId === field.id).map(b => {
                                            const top = hourToPx(b.startTime)
                                            const height = hourToPx(b.endTime) - hourToPx(b.startTime)
                                            // Handle case where height is 0 or negative
                                            if (height <= 0) return null;

                                            const getStatusClass = (status?: string) => {
                                                switch (status) {
                                                    case 'CONFIRMED': return 'booked';
                                                    case 'PENDING': return 'pending';
                                                    case 'COMPLETED': return 'completed';
                                                    case 'MAINTENANCE': return 'maintenance';
                                                    default: return 'maintenance';
                                                }
                                            }

                                            return (
                                                <div
                                                    key={b.id}
                                                    className={`booking-card ${getStatusClass(b.status)}`}
                                                    style={{
                                                        top,
                                                        height
                                                    }}
                                                    onClick={() => setSelectedBooking(b)}
                                                >
                                                    <div className="booking-name">{b.customerName}</div>
                                                    <div className="booking-time">
                                                        {b.startTime} - {b.endTime}
                                                    </div>
                                                    {b.price && <div className="booking-price">{(b.price / 1000).toLocaleString()}k</div>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onUpdate={() => {
                        setSelectedBooking(null);
                        fetchBookings();
                    }}
                />
            )}
        </div>
    )
}

export default BookingSchedule
