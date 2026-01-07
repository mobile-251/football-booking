import React, { useState } from 'react'
import './BookingSchedule.css'
import BookingDetailModal from './BookingDetailModal'

interface Booking {
    id: string
    fieldId: string
    customerName: string
    phoneNumber?: string
    startTime: string
    endTime: string
    price?: number
    type: 'booked' | 'maintenance'
    note?: string
}

const FIELDS = [
    { id: '5A', name: 'Sân 5A', type: 'Sân 5' },
    { id: '5B', name: 'Sân 5B', type: 'Sân 5' },
    { id: '5C', name: 'Sân 5C', type: 'Sân 5' },
    { id: '7A', name: 'Sân 7A', type: 'Sân 7' },
    { id: '7B', name: 'Sân 7B', type: 'Sân 7' },
    { id: '11', name: 'Sân 11', type: 'Sân 11' },
]

const BOOKINGS: Booking[] = [
    {
        id: '1', fieldId: '5A', customerName: 'Phạm Thị D', phoneNumber: '0901234567',
        startTime: '06:00', endTime: '08:00', price: 250000, type: 'booked', note: 'Đã cọc 50k'
    },
    {
        id: '2', fieldId: '5A', customerName: 'Nguyễn Văn A', phoneNumber: '0909888777',
        startTime: '08:00', endTime: '10:00', price: 250000, type: 'booked', note: 'Đặt hộ bạn'
    },
    {
        id: '3', fieldId: '5B', customerName: 'Trần Văn B', phoneNumber: '0912333444',
        startTime: '08:00', endTime: '10:00', price: 250000, type: 'booked'
    },
    {
        id: '4', fieldId: '7A', customerName: 'Lê Thị C', phoneNumber: '0987654321',
        startTime: '08:00', endTime: '10:00', price: 250000, type: 'booked'
    },
    {
        id: '5', fieldId: '5B', customerName: 'Đội bóng X', phoneNumber: '0369852147',
        startTime: '10:00', endTime: '12:00', price: 250000, type: 'booked', note: 'Cần thuê áo bib'
    },
    {
        id: '6', fieldId: '5A', customerName: 'FC Sài Gòn', phoneNumber: '0933222111',
        startTime: '12:00', endTime: '14:00', price: 250000, type: 'booked'
    },
    {
        id: '7', fieldId: '7A', customerName: 'Nhóm bạn ĐH', phoneNumber: '0357159357',
        startTime: '14:00', endTime: '16:00', price: 250000, type: 'booked'
    },
    {
        id: '8', fieldId: '11', customerName: 'Bảo trì định kỳ',
        startTime: '20:00', endTime: '22:00', type: 'maintenance', note: 'Sửa lưới gôn'
    },
]

const HOURS = Array.from({ length: 18 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`)

const hourToPx = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return ((h + m / 60) - 6) * 64
}

const BookingSchedule: React.FC = () => {
    // Stage: Selected date for the schedule (default Today)
    const [selectedDate, setSelectedDate] = useState(new Date())
    // State: View month for the sidebar calendar (independent of selected date usually, or synced)
    const [viewDate, setViewDate] = useState(new Date())
    // State: Selected booking to show detailed modal
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    // State: Filter field type
    const [filterType, setFilterType] = useState('All')

    // Update viewDate when selectedDate changes to ensure we see the selected date
    // (Optional: depending on UX preference. Let's keep them synced for simplicity first)
    // useEffect(() => setViewDate(selectedDate), [selectedDate]);

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(selectedDate.getDate() - 1)
        setSelectedDate(newDate)
        // Auto switch month view if we cross boundary
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
        // Convert Sun(0)...Sat(6) to Mon(0)...Sun(6)
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

    // Check if a day is selected (compare with selectedDate)
    const isSelected = (day: number) => {
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === viewDate.getMonth() &&
            selectedDate.getFullYear() === viewDate.getFullYear()
    }

    // Check if a day is today
    const isToday = (day: number) => {
        const today = new Date()
        return today.getDate() === day &&
            today.getMonth() === viewDate.getMonth() &&
            today.getFullYear() === viewDate.getFullYear()
    }

    return (
        <div className="booking-page">
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
                            <span className="dot booked" /> Đã đặt
                        </div>
                        <div className="legend-item">
                            <span className="dot maintenance" /> Bảo trì
                        </div>
                        <div className="legend-item">
                            <span className="dot empty" /> Còn trống
                        </div>
                    </div>

                    <div className="stat-card">
                        <span>Tổng booking</span>
                        <strong>10</strong>
                    </div>

                    <div className="stat-card">
                        <span>Doanh thu hôm nay</span>
                        <strong>1.000.000đ</strong>
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
                        {FIELDS.filter(f => filterType === 'All' || f.type === filterType).map(field => (
                            <div key={field.id} className="field-column">
                                <div className="field-header">
                                    <div className="field-name">{field.name}</div>
                                    <div className="field-type">{field.type}</div>
                                </div>

                                <div className="field-body">
                                    {BOOKINGS.filter(b => b.fieldId === field.id).map(b => {
                                        const top = hourToPx(b.startTime)
                                        const height = hourToPx(b.endTime) - hourToPx(b.startTime)

                                        return (
                                            <div
                                                key={b.id}
                                                className={`booking-card ${b.type}`}
                                                style={{ top, height }}
                                                onClick={() => setSelectedBooking(b)}
                                            >
                                                <div className="booking-name">{b.customerName}</div>
                                                <div className="booking-time">
                                                    {b.startTime} - {b.endTime}
                                                </div>
                                                {b.price && <div className="booking-price">{b.price / 1000}k</div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </div>
    )
}

export default BookingSchedule
