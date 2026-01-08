import React, { useState, useCallback, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	ScrollView,
	TextInput,
	ActivityIndicator,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import {
	Field,
	FieldType,
	PaymentMethod,
	SelectedSlot,
	PAYMENT_METHOD_LABELS,
	FIELD_TYPE_LABELS,
	FieldTypePricingSummary,
	FieldSlotInfo,
	TimeSlotInfo,
} from '../types/types';
import { api } from '../services/api';
import { formatPrice } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

interface BookingModalProps {
	visible: boolean;
	onClose: () => void;
	field: Field;
	onBookingSuccess: () => void;
}

type BookingStep = 'date' | 'fieldType' | 'timeSlot' | 'confirm';

const STEPS: { key: BookingStep; label: string }[] = [
	{ key: 'date', label: 'Ngày' },
	{ key: 'fieldType', label: 'Loại sân' },
	{ key: 'timeSlot', label: 'Chọn giờ' },
	{ key: 'confirm', label: 'Xác nhận' },
];

interface TimeSlotData {
	time: string;
	price: number;
	isAvailable: boolean;
	isPeakHour: boolean;
}

export default function BookingModal({ visible, onClose, field, onBookingSuccess }: BookingModalProps) {
	const [currentStep, setCurrentStep] = useState<BookingStep>('date');
	const [selectedDates, setSelectedDates] = useState<string[]>([]);
	// Step 2: Field type summaries with minPrice per date
	const [fieldTypeSummaries, setFieldTypeSummaries] = useState<FieldTypePricingSummary[]>([]);
	const [selectedFields, setSelectedFields] = useState<Record<string, number>>({});
	const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
	const [currentDateIndex, setCurrentDateIndex] = useState(0);
	// Step 3: Field slots grouped by field
	const [fieldSlots, setFieldSlots] = useState<FieldSlotInfo[]>([]);
	const [loadingFields, setLoadingFields] = useState(false);
	const [loadingSlots, setLoadingSlots] = useState(false);

	const [calendarMonth, setCalendarMonth] = useState(() => {
		const d = new Date();
		d.setDate(1);
		d.setHours(0, 0, 0, 0);
		return d;
	});

	const [fullName, setFullName] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [note, setNote] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
	const [submitting, setSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [showBankTransfer, setShowBankTransfer] = useState(false);
	const [bookingId, setBookingId] = useState<number | null>(null);

	const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

	// Helper: Get current field type from selected field
	const getCurrentFieldType = useCallback((): FieldType => {
		const currentDate = selectedDates[currentDateIndex];
		const fieldId = selectedFields[currentDate];
		if (!fieldId) return field.fieldType;
		
		const summary = fieldTypeSummaries.find(s => 
			s.availableFieldIds.includes(fieldId)
		);
		return (summary?.fieldType as FieldType) || field.fieldType;
	}, [selectedDates, currentDateIndex, selectedFields, fieldTypeSummaries, field.fieldType]);

	// Step 2: Load field type pricing for current date
	const loadFieldTypePricing = useCallback(async (date: string) => {
		setLoadingFields(true);
		try {
			const summaries = await api.getFieldTypePricing(field.venueId, date);
			setFieldTypeSummaries(summaries);
		} catch (error) {
			console.error('Failed to load field type pricing:', error);
			setFieldTypeSummaries([]);
		} finally {
			setLoadingFields(false);
		}
	}, [field.venueId]);

	useEffect(() => {
		if (!visible) return;
		setCurrentStep('date');
		setSelectedDates([]);
		setSelectedSlots([]);
		setCurrentDateIndex(0);
		setPaymentMethod('CASH');
		setSubmitting(false);
		setShowSuccess(false);
		setShowBankTransfer(false);
		setBookingId(null);
		setFullName('');
		setPhoneNumber('');
		setNote('');
		setSelectedFields({});
		setFieldTypeSummaries([]);
		setFieldSlots([]);
	}, [visible, field.id]);

	// Step 3: Load field slots for field type and date
	const loadFieldSlots = useCallback(async (fieldType: FieldType, date: string) => {
		setLoadingSlots(true);
		try {
			const slots = await api.getFieldTypeSlots(field.venueId, fieldType, date);
			setFieldSlots(slots);
		} catch (error) {
			console.error('Failed to load field slots:', error);
			setFieldSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	}, [field.venueId]);

	// Effect: Load field type pricing when entering Step 2
	useEffect(() => {
		if (currentStep !== 'fieldType') return;
		const currentDate = selectedDates[currentDateIndex];
		if (!currentDate) return;
		void loadFieldTypePricing(currentDate);
	}, [currentStep, currentDateIndex, selectedDates, loadFieldTypePricing]);

	// Effect: Load field slots when entering Step 3
	useEffect(() => {
		if (currentStep !== 'timeSlot') return;
		const currentDate = selectedDates[currentDateIndex];
		const selectedFieldId = selectedFields[currentDate];
		if (!currentDate || !selectedFieldId) return;
		
		const fieldType = getCurrentFieldType();
		void loadFieldSlots(fieldType, currentDate);
	}, [currentStep, currentDateIndex, selectedDates, selectedFields, loadFieldSlots, getCurrentFieldType]);

	const handleNext = () => {
		const nextIndex = currentStepIndex + 1;
		if (nextIndex < STEPS.length) {
			setCurrentStep(STEPS[nextIndex].key);
		}
	};

	const handleBack = () => {
		const prevIndex = currentStepIndex - 1;
		if (prevIndex >= 0) {
			setCurrentStep(STEPS[prevIndex].key);
		}
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
		return {
			dayName: days[date.getDay()],
			day: date.getDate(),
			month: date.getMonth() + 1,
			year: date.getFullYear(),
		};
	};

	const pad2 = (n: number) => n.toString().padStart(2, '0');

	const toIsoDate = (d: Date) => {
		const year = d.getFullYear();
		const month = pad2(d.getMonth() + 1);
		const day = pad2(d.getDate());
		return `${year}-${month}-${day}`;
	};

	// Helper: Convert ISO timestamp to local time string (HH:mm)
	// Same pattern as ScheduleScreen - new Date() auto-converts to device local timezone
	const formatSlotTime = (isoString: string): string => {
		const date = new Date(isoString);
		return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
	};

	const isPastDay = (iso: string) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const d = new Date(iso);
		d.setHours(0, 0, 0, 0);
		return d.getTime() < today.getTime();
	};

	const MONTH_NAMES_EN = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	const getCalendarCells = (monthDate: Date) => {
		const year = monthDate.getFullYear();
		const month = monthDate.getMonth();
		const firstDayOfMonth = new Date(year, month, 1);
		const startDow = firstDayOfMonth.getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const cells: { label: number; iso?: string; inMonth: boolean; disabled: boolean }[] = [];
		for (let i = 0; i < 42; i++) {
			const dayNum = i - startDow + 1;
			if (dayNum < 1 || dayNum > daysInMonth) {
				cells.push({ label: 0, inMonth: false, disabled: true });
				continue;
			}
			const d = new Date(year, month, dayNum);
			const iso = toIsoDate(d);
			const disabled = isPastDay(iso);
			cells.push({ label: dayNum, iso, inMonth: true, disabled });
		}
		return cells;
	};

	const toggleDateSelection = (date: string) => {
		setSelectedDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));
	};

	const getTotalPrice = () => {
		return selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
	};

	const getTotalHours = () => {
		return selectedSlots.length;
	};

	const handleSubmitBooking = async () => {
		if (!fullName || !phoneNumber) {
			alert('Vui lòng điền đầy đủ thông tin liên hệ');
			return;
		}

		setSubmitting(true);
		try {
			const currentUser = api.currentUser;
			if (!currentUser || !currentUser.player) {
				alert('Vui lòng đăng nhập lại để thực hiện đặt sân');
				return;
			}

			for (const slot of selectedSlots) {
				// startTime and endTime are now in ISO format from API
				const startDateTime = new Date(slot.startTime);
				const endDateTime = new Date(slot.endTime);

				const booking = await api.createBooking({
					fieldId: slot.fieldId,
					playerId: currentUser.player.id,
					customerName: fullName,     // Send customer contact info
					customerPhone: phoneNumber, // Send customer contact info
					startTime: startDateTime.toISOString(),
					endTime: endDateTime.toISOString(),
					totalPrice: slot.price,
					note: note || undefined,
				});
				setBookingId(booking.id);

				await api.createPayment({
					bookingId: booking.id,
					amount: slot.price,
					method: paymentMethod,
				});
			}

			if (paymentMethod === 'BANK_TRANSFER') {
				setShowBankTransfer(true);
			} else {
				setShowSuccess(true);
			}
		} catch (error) {
			console.error('Booking failed:', error);
			alert('Đặt sân thất bại. Vui lòng thử lại.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleCloseSuccess = () => {
		setShowSuccess(false);
		onBookingSuccess();
		onClose();
	};

	const renderStepper = () => (
		<View style={styles.stepper}>
			{STEPS.map((step, index) => (
				<View key={step.key} style={styles.stepItem}>
					<View style={[styles.stepLine, index <= currentStepIndex ? styles.stepLineActive : null]} />
					<Text style={[styles.stepLabel, index === currentStepIndex ? styles.stepLabelActive : null]}>
						{step.label}
					</Text>
				</View>
			))}
		</View>
	);

	const renderDateStep = () => (
		<View style={styles.stepContent}>
			<View style={styles.stepHeader}>
				<View style={styles.stepIconContainer}>
					<Ionicons name='calendar' size={32} color={theme.colors.white} />
				</View>
				<Text style={styles.stepTitle}>Chọn ngày đá bóng</Text>
				<Text style={styles.stepSubtitle}>Chọn một hoặc nhiều ngày để đặt sân</Text>
			</View>

			<View style={styles.calendarCard}>
				<View style={styles.calendarHeader}>
					<TouchableOpacity
						onPress={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
					>
						<Ionicons name='chevron-back' size={22} color={theme.colors.primary} />
					</TouchableOpacity>
					<Text style={styles.calendarMonthLabel}>
						{MONTH_NAMES_EN[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
					</Text>
					<TouchableOpacity
						onPress={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
					>
						<Ionicons name='chevron-forward' size={22} color={theme.colors.primary} />
					</TouchableOpacity>
				</View>

				<View style={styles.calendarWeekdays}>
					{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
						<Text key={d} style={styles.calendarWeekdayText}>
							{d}
						</Text>
					))}
				</View>

				<View style={styles.calendarGrid}>
					{getCalendarCells(calendarMonth).map((cell, idx) => {
						if (!cell.inMonth) {
							return <View key={idx} style={styles.calendarDayCell} />;
						}

						const isSelected = !!cell.iso && selectedDates.includes(cell.iso);
						return (
							<TouchableOpacity
								key={idx}
								style={[
									styles.calendarDayCell,
									isSelected && styles.calendarDaySelected,
									cell.disabled && styles.calendarDayDisabled,
								]}
								onPress={() => cell.iso && toggleDateSelection(cell.iso)}
								disabled={cell.disabled}
							>
								<Text
									style={[
										styles.calendarDayText,
										isSelected && styles.calendarDayTextSelected,
										cell.disabled && styles.calendarDayTextDisabled,
									]}
								>
									{cell.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			<View style={styles.selectedDatesRow}>
				<Text style={styles.selectedDatesCount}>Đã chọn {selectedDates.length} ngày</Text>
				{selectedDates.length > 0 && (
					<TouchableOpacity onPress={() => setSelectedDates([])}>
						<Text style={styles.clearAllText}>Xóa tất cả</Text>
					</TouchableOpacity>
				)}
			</View>

			{selectedDates.length > 0 && (
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					<View style={styles.selectedDatesChips}>
						{selectedDates
							.slice()
							.sort()
							.map((date) => {
								const d = new Date(date);
								const dayNum = d.getDay() === 0 ? 'CN' : `Th ${d.getDay() + 1}`;
								return (
									<View key={date} style={styles.dateChip}>
										<Ionicons name='calendar' size={14} color={theme.colors.primary} />
										<Text style={styles.dateChipText}>
											{dayNum}, {d.getDate()} th {d.getMonth() + 1}
										</Text>
										<TouchableOpacity onPress={() => toggleDateSelection(date)}>
											<Ionicons name='close' size={14} color={theme.colors.foregroundMuted} />
										</TouchableOpacity>
									</View>
								);
							})}
					</View>
				</ScrollView>
			)}
		</View>
	);

	const renderFieldTypeStep = () => {
		const currentDate = selectedDates[currentDateIndex];
		const formatted = currentDate ? formatDate(currentDate) : null;
		const capacityByType: Record<FieldType, string> = {
			FIELD_5VS5: '5-6 người',
			FIELD_7VS7: '7-8 người',
			FIELD_11VS11: '11-12 người',
		};

		return (
			<View style={styles.stepContent}>
				<View style={styles.stepHeader}>
					<View style={styles.stepIconContainer}>
						<Ionicons name='football' size={32} color={theme.colors.white} />
					</View>
					<Text style={styles.stepTitle}>Chọn loại sân</Text>
					<Text style={styles.stepSubtitle}>Chọn loại sân cho từng ngày</Text>
				</View>

				{selectedDates.length > 0 && (
					<View style={styles.dateNav}>
						<TouchableOpacity
							onPress={() => setCurrentDateIndex((prev) => Math.max(0, prev - 1))}
							disabled={currentDateIndex === 0}
						>
							<Ionicons
								name='chevron-back'
								size={24}
								color={currentDateIndex === 0 ? theme.colors.border : theme.colors.foreground}
							/>
						</TouchableOpacity>

						<View style={styles.dateNavCenter}>
							<Text style={styles.dateNavTitle}>
								{formatted?.dayName}, {formatted?.day} tháng {formatted?.month}
							</Text>
							<Text style={styles.dateNavSubtitle}>
								Ngày {currentDateIndex + 1} / {selectedDates.length}
							</Text>
						</View>

						<TouchableOpacity
							onPress={() => setCurrentDateIndex((prev) => Math.min(selectedDates.length - 1, prev + 1))}
							disabled={currentDateIndex === selectedDates.length - 1}
						>
							<Ionicons
								name='chevron-forward'
								size={24}
								color={currentDateIndex === selectedDates.length - 1 ? theme.colors.border : theme.colors.foreground}
							/>
						</TouchableOpacity>
					</View>
				)}

				{loadingFields ? (
					<ActivityIndicator size='large' color={theme.colors.primary} style={{ marginTop: 40 }} />
				) : (
					<View style={styles.fieldTypeList}>
						{fieldTypeSummaries.map((summary) => {
							const selectedFieldId = selectedFields[currentDate];
							const isSelected = selectedFieldId && summary.availableFieldIds.includes(selectedFieldId);

							return (
								<TouchableOpacity
									key={summary.fieldType}
									style={[
										styles.fieldTypeCard,
										isSelected ? styles.fieldTypeCardSelected : undefined,
									]}
									onPress={() => {
										// Select first available field of this type
										const firstFieldId = summary.availableFieldIds[0];
										setSelectedFields((prev) => ({
											...prev,
											[currentDate]: firstFieldId,
										}));
									}}
								>
									<View style={styles.fieldTypeInfo}>
										<Text
											style={[
												styles.fieldTypeLabel,
												isSelected ? styles.fieldTypeTextSelected : undefined,
											]}
										>
											{FIELD_TYPE_LABELS[summary.fieldType as FieldType]}
										</Text>
										<Text style={styles.fieldTypeDescription}>{capacityByType[summary.fieldType as FieldType]}</Text>
									</View>

									<View style={styles.fieldTypePriceBlock}>
										<Text style={styles.fieldTypePriceLabel}>Chỉ từ</Text>
										<Text style={styles.fieldTypePriceValue}>
											{formatPrice(summary.minPrice)}đ<Text style={styles.fieldTypePriceUnit}> / giờ</Text>
										</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>
				)}
			</View>
		);
	};

	const renderTimeSlotStep = () => {
		const currentDate = selectedDates[currentDateIndex];
		const formatted = currentDate ? formatDate(currentDate) : null;

		return (
			<View style={styles.stepContent}>
				<View style={styles.stepHeader}>
					<View style={styles.stepIconContainer}>
						<Ionicons name='time' size={32} color={theme.colors.white} />
					</View>
					<Text style={styles.stepTitle}>Chọn khung giờ</Text>
					<Text style={styles.stepSubtitle}>Nhấn để chọn, nhấn lần nữa để xóa</Text>
				</View>

				{/* Date Navigation */}
				<View style={styles.dateNav}>
					<TouchableOpacity
						onPress={() => setCurrentDateIndex((prev) => Math.max(0, prev - 1))}
						disabled={currentDateIndex === 0}
					>
						<Ionicons
							name='chevron-back'
							size={24}
							color={currentDateIndex === 0 ? theme.colors.border : theme.colors.foreground}
						/>
					</TouchableOpacity>

					<View style={styles.dateNavCenter}>
						<Text style={styles.dateNavTitle}>
							{formatted?.dayName}, {formatted?.day} tháng {formatted?.month}
						</Text>
						<Text style={styles.dateNavSubtitle}>
							Ngày {currentDateIndex + 1} / {selectedDates.length} • {FIELD_TYPE_LABELS[getCurrentFieldType()]}
						</Text>
					</View>

					<TouchableOpacity
						onPress={() => setCurrentDateIndex((prev) => Math.min(selectedDates.length - 1, prev + 1))}
						disabled={currentDateIndex === selectedDates.length - 1}
					>
						<Ionicons
							name='chevron-forward'
							size={24}
							color={currentDateIndex === selectedDates.length - 1 ? theme.colors.border : theme.colors.foreground}
						/>
					</TouchableOpacity>
				</View>

				{/* Time Slots Grid - Grouped by Field */}
				{loadingSlots ? (
					<ActivityIndicator size='large' color={theme.colors.primary} style={{ marginTop: 40 }} />
				) : (
					<ScrollView style={styles.timeSlotsContainer} showsVerticalScrollIndicator={false}>
						{fieldSlots.map((fieldSlot) => (
							<View key={fieldSlot.fieldId} style={{ marginBottom: 24 }}>
								{/* Field Name Header */}
								<Text style={[styles.slotSectionLabel, { marginBottom: 12 }]}>
									<Ionicons name='football-outline' size={14} /> {fieldSlot.fieldName}
								</Text>

								{/* Slots Grid for this field */}
								<View style={styles.timeSlotsGrid}>
									{fieldSlot.slots.map((slot) => {
										const isSelected = selectedSlots.some(
											(s) => s.date === currentDate && s.startTime === slot.startTime && s.fieldId === fieldSlot.fieldId
										);
										return (
											<TouchableOpacity
												key={slot.startTime}
												style={[
													styles.timeSlot,
													!slot.isAvailable && styles.timeSlotBooked,
													isSelected && styles.timeSlotSelected,
													slot.isPeakHour && slot.isAvailable && !isSelected && styles.timeSlotPeak,
												]}
												onPress={() => {
													if (!slot.isAvailable) return;

													const existingIndex = selectedSlots.findIndex(
														(s) => s.date === currentDate && s.startTime === slot.startTime && s.fieldId === fieldSlot.fieldId
													);

													if (existingIndex >= 0) {
														// Deselect
														setSelectedSlots((prev) => prev.filter((_, i) => i !== existingIndex));
													} else {
														// Select
														const newSlot: SelectedSlot = {
															date: currentDate,
															fieldId: fieldSlot.fieldId,
															fieldName: fieldSlot.fieldName,
															startTime: slot.startTime,
															endTime: slot.endTime,
															price: slot.price,
														};
														setSelectedSlots((prev) => [...prev, newSlot]);
													}
												}}
												disabled={!slot.isAvailable}
											>
												<Text
													style={[
														styles.timeSlotTime,
														isSelected && styles.timeSlotTextSelected,
														!slot.isAvailable && styles.timeSlotTextBooked,
													]}
												>
													{formatSlotTime(slot.startTime)}
												</Text>
												{!slot.isAvailable && <Ionicons name='close' size={12} color={theme.colors.foregroundMuted} />}
												{slot.isPeakHour && slot.isAvailable && <Text style={styles.peakIcon}>🔥</Text>}
												<Text
													style={[
														styles.timeSlotPrice,
														isSelected && styles.timeSlotTextSelected,
														!slot.isAvailable && styles.timeSlotTextBooked,
													]}
												>
													{slot.price / 1000}k
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							</View>
						))}

						{/* Legend */}
						<View style={styles.legend}>
							<View style={styles.legendItem}>
								<View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
								<Text style={styles.legendText}>Đã chọn</Text>
							</View>
							<View style={styles.legendItem}>
								<View style={[styles.legendDot, { backgroundColor: theme.colors.background }]} />
								<Text style={styles.legendText}>Có thể đặt</Text>
							</View>
							<View style={styles.legendItem}>
								<View style={[styles.legendDot, { backgroundColor: '#e5e5e5' }]} />
								<Text style={styles.legendText}>Đã hết</Text>
							</View>
							<View style={styles.legendItem}>
								<Text style={styles.peakIcon}>🔥</Text>
								<Text style={styles.legendText}>Giờ cao điểm</Text>
							</View>
						</View>

						{/* Selected Summary */}
						{selectedSlots.length > 0 && (
							<View style={styles.selectedSummary}>
								<View style={styles.selectedSummaryHeader}>
									<Text style={styles.selectedSummaryTitle}>Tổng: {getTotalHours()} giờ</Text>
									<TouchableOpacity onPress={() => setSelectedSlots([])}>
										<Text style={styles.clearAllText}>Xóa tất cả</Text>
									</TouchableOpacity>
								</View>
								{selectedSlots.map((slot, index) => (
									<View key={index} style={styles.selectedSlotItem}>
										<Ionicons name='calendar-outline' size={16} color={theme.colors.foregroundMuted} />
										<Text style={styles.selectedSlotText}>
											{formatDate(slot.date).day} thg {formatDate(slot.date).month} • {slot.fieldName}
										</Text>
										<Text style={styles.selectedSlotTime}>
											{formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
										</Text>
										<Text style={styles.selectedSlotPrice}>{formatPrice(slot.price)}đ</Text>
										<TouchableOpacity onPress={() => setSelectedSlots((prev) => prev.filter((_, i) => i !== index))}>
											<Ionicons name='trash-outline' size={16} color={theme.colors.accent} />
										</TouchableOpacity>
									</View>
								))}
							</View>
						)}
					</ScrollView>
				)}
			</View>
		);
	};

	const renderConfirmStep = () => (
		<ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
			<View style={styles.stepHeader}>
				<View style={styles.stepIconContainer}>
					<Ionicons name='checkmark-circle' size={32} color={theme.colors.white} />
				</View>
				<Text style={styles.stepTitle}>Xác nhận đặt sân</Text>
				<Text style={styles.stepSubtitle}>Kiểm tra lại thông tin và xác nhận</Text>
			</View>

			{/* Booking Summary */}
			<View style={styles.summaryCard}>
				<View style={styles.summaryHeader}>
					<Ionicons name='calendar' size={20} color={theme.colors.primary} />
					<Text style={styles.summaryTitle}>Lịch đặt sân của bạn</Text>
				</View>
				{selectedSlots.map((slot, index) => (
					<View key={index} style={styles.summaryItem}>
						<View style={styles.summaryItemLeft}>
							<Ionicons name='time-outline' size={16} color={theme.colors.foregroundMuted} />
							<View>
								<Text style={styles.summaryDate}>
									{formatDate(slot.date).dayName}, {formatDate(slot.date).day}/{formatDate(slot.date).month}
								</Text>
								<Text style={styles.summaryTime}>
									{formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
								</Text>
							</View>
						</View>
						<Text style={styles.summaryPrice}>{formatPrice(slot.price)}đ</Text>
					</View>
				))}
				<View style={styles.summaryTotal}>
					<Text style={styles.summaryTotalLabel}>
						Tổng số giờ: <Text style={styles.summaryTotalValue}>{getTotalHours()} giờ</Text>
					</Text>
					<Text style={styles.summaryTotalPrice}>{formatPrice(getTotalPrice())}đ</Text>
				</View>
			</View>

			{/* Contact Form */}
			<Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
			<View style={styles.inputGroup}>
				<Text style={styles.inputLabel}>Họ và tên *</Text>
				<View style={styles.inputContainer}>
					<Ionicons name='person-outline' size={20} color={theme.colors.foregroundMuted} />
					<TextInput
						style={styles.input}
						placeholder='Nhập họ và tên của bạn'
						value={fullName}
						onChangeText={setFullName}
					/>
				</View>
			</View>
			<View style={styles.inputGroup}>
				<Text style={styles.inputLabel}>Số điện thoại *</Text>
				<View style={styles.inputContainer}>
					<Ionicons name='call-outline' size={20} color={theme.colors.foregroundMuted} />
					<TextInput
						style={styles.input}
						placeholder='Nhập số điện thoại'
						value={phoneNumber}
						onChangeText={setPhoneNumber}
						keyboardType='phone-pad'
					/>
				</View>
			</View>
			<View style={styles.inputGroup}>
				<Text style={styles.inputLabel}>Ghi chú cho chủ sân</Text>
				<View style={styles.inputContainer}>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder='Nhập ghi chú'
						value={note}
						onChangeText={setNote}
						multiline
					/>
				</View>
			</View>

			{/* Payment Methods */}
			<Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
			{(['CASH', 'MOMO', 'BANK_TRANSFER'] as PaymentMethod[]).map((method) => (
				<TouchableOpacity
					key={method}
					style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionSelected]}
					onPress={() => setPaymentMethod(method)}
				>
					<View style={styles.paymentOptionLeft}>
						<View
							style={[
								styles.paymentIcon,
								method === 'CASH' && { backgroundColor: '#4ade80' },
								method === 'MOMO' && { backgroundColor: '#ec4899' },
								method === 'BANK_TRANSFER' && { backgroundColor: '#3b82f6' },
							]}
						>
							<Ionicons
								name={method === 'CASH' ? 'cash' : method === 'MOMO' ? 'wallet' : 'card'}
								size={20}
								color={theme.colors.white}
							/>
						</View>
						<View>
							<Text style={styles.paymentLabel}>{PAYMENT_METHOD_LABELS[method]}</Text>
							<Text style={styles.paymentDescription}>
								{method === 'CASH' && 'Thanh toán tiền mặt khi đến sân'}
								{method === 'MOMO' && 'Thanh toán qua ví điện tử MoMo'}
								{method === 'BANK_TRANSFER' && 'Chuyển khoản qua tài khoản ngân hàng'}
							</Text>
						</View>
					</View>
					<View style={[styles.radioOuter, paymentMethod === method && styles.radioOuterSelected]}>
						{paymentMethod === method && <View style={styles.radioInner} />}
					</View>
				</TouchableOpacity>
			))}

			<View style={{ height: 100 }} />
		</ScrollView>
	);

	const renderBankTransfer = () => (
		<View style={styles.bankTransferContainer}>
			<View style={styles.stepHeader}>
				<View style={styles.qrPlaceholder}>
					<Ionicons name='phone-portrait-outline' size={48} color={theme.colors.primary} />
					<Text style={styles.qrLabel}>QR Code</Text>
				</View>
			</View>

			<View style={styles.bankInfo}>
				<View style={styles.bankInfoRow}>
					<Text style={styles.bankInfoLabel}>Số điện thoại</Text>
					<View style={styles.bankInfoValue}>
						<Text style={styles.bankInfoText}>0123456789</Text>
						<TouchableOpacity>
							<Ionicons name='copy-outline' size={20} color={theme.colors.primary} />
						</TouchableOpacity>
					</View>
				</View>
				<View style={styles.bankInfoRow}>
					<Text style={styles.bankInfoLabel}>Tên tài khoản</Text>
					<Text style={styles.bankInfoTextBold}>Sân Bóng Đá</Text>
				</View>
				<View style={styles.bankInfoRow}>
					<Text style={styles.bankInfoLabel}>Nội dung chuyển khoản</Text>
					<Text style={styles.bankInfoTextBold}>BOOKING{bookingId}</Text>
				</View>
				<View style={styles.amountBox}>
					<Text style={styles.amountLabel}>Số tiền</Text>
					<Text style={styles.amountValue}>{formatPrice(getTotalPrice())}đ</Text>
				</View>
			</View>

			<View style={styles.warningBox}>
				<Ionicons name='warning' size={20} color='#f59e0b' />
				<Text style={styles.warningText}>Vui lòng chuyển khoản đúng nội dung để xác nhận đặt sân tự động</Text>
			</View>

			<TouchableOpacity style={styles.backPaymentLink} onPress={() => setShowBankTransfer(false)}>
				<Ionicons name='arrow-back' size={16} color={theme.colors.primary} />
				<Text style={styles.backPaymentText}>Chọn phương thức khác</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.confirmPaymentBtn}
				onPress={() => {
					setShowBankTransfer(false);
					setShowSuccess(true);
				}}
			>
				<Text style={styles.confirmPaymentBtnText}>Tôi đã chuyển khoản</Text>
			</TouchableOpacity>
		</View>
	);

	const renderSuccess = () => (
		<View style={styles.successContainer}>
			<View style={styles.successIcon}>
				<Ionicons name='checkmark' size={48} color={theme.colors.white} />
			</View>
			<Text style={styles.successTitle}>Đặt sân thành công!</Text>
			<Text style={styles.successSubtitle}>Cảm ơn bạn đã đặt sân. Chúng tôi sẽ liên hệ với bạn sớm.</Text>
			<TouchableOpacity style={styles.successBtn} onPress={handleCloseSuccess}>
				<Text style={styles.successBtnText}>Đóng</Text>
			</TouchableOpacity>
		</View>
	);

	const canGoNext = () => {
		switch (currentStep) {
			case 'date':
				return selectedDates.length > 0;
			case 'fieldType':
				return true;
			case 'timeSlot':
				return selectedSlots.length > 0;
			case 'confirm':
				return fullName && phoneNumber;
			default:
				return false;
		}
	};

	return (
		<Modal visible={visible} transparent animationType='fade' onRequestClose={onClose} statusBarTranslucent presentationStyle="overFullScreen">
			<View style={styles.backdrop}>
				<View style={styles.sheet}>
					<View style={styles.container}>
						{/* Header */}
						<View style={styles.header}>
							<View>
								<Text style={styles.headerTitle}>Đặt lịch sân</Text>
							</View>
							<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
								<Ionicons name='close' size={22} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>

						{/* Stepper */}
						{renderStepper()}

						{/* Content */}
						{showSuccess
							? renderSuccess()
							: showBankTransfer
							? renderBankTransfer()
							: currentStep === 'date'
							? renderDateStep()
							: currentStep === 'fieldType'
							? renderFieldTypeStep()
							: currentStep === 'timeSlot'
							? renderTimeSlotStep()
							: renderConfirmStep()}

						{/* Footer Buttons */}
						{!showSuccess && !showBankTransfer && (
							<View style={styles.footer}>
								{currentStepIndex > 0 && (
									<TouchableOpacity style={styles.backBtn} onPress={handleBack}>
										<Text style={styles.backBtnText}>Quay lại</Text>
									</TouchableOpacity>
								)}
								<TouchableOpacity
									style={[
										styles.nextBtn,
										!canGoNext() && styles.nextBtnDisabled,
										currentStepIndex === 0 && { flex: 1 },
									]}
									onPress={currentStep === 'confirm' ? handleSubmitBooking : handleNext}
									disabled={!canGoNext() || submitting}
								>
									{submitting ? (
										<ActivityIndicator color={theme.colors.white} />
									) : (
										<Text style={styles.nextBtnText}>
											{currentStep === 'confirm' ? 'Xác nhận đặt sân' : 'Tiếp tục'}
										</Text>
									)}
								</TouchableOpacity>
							</View>
						)}
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.35)',
		justifyContent: 'flex-end',
		padding: 0,
	},
	sheet: {
		width: '100%',
		// maxHeight: height * 0.92,
		height: height * 0.9,
		backgroundColor: theme.colors.cardSolid,
		borderTopLeftRadius: theme.borderRadius.xl,
		borderTopRightRadius: theme.borderRadius.xl,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		overflow: 'hidden',
		...theme.shadows.strong,
	},
	container: {
		flex: 1,
		backgroundColor: theme.colors.backgroundLight,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.white,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: theme.colors.foreground,
	},
	headerSubtitle: {
		fontSize: 14,
		color: theme.colors.primary,
		marginTop: 2,
	},
	closeBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: theme.colors.white,
		justifyContent: 'center',
		alignItems: 'center',
		...theme.shadows.medium,
	},
	stepper: {
		flexDirection: 'row',
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		backgroundColor: theme.colors.white,
	},
	stepItem: {
		flex: 1,
		alignItems: 'center',
	},
	stepLine: {
		height: 5,
		backgroundColor: theme.colors.border,
		borderRadius: 999,
		width: '100%',
		marginBottom: 8,
	},
	stepLineActive: {
		backgroundColor: theme.colors.primary,
	},
	stepLabel: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	stepLabelActive: {
		color: theme.colors.primary,
		fontWeight: '600',
	},
	stepContent: {
		flex: 1,
		padding: theme.spacing.lg,
	},
	stepHeader: {
		alignItems: 'center',
		marginBottom: theme.spacing.xl,
	},
	stepIconContainer: {
		width: 60,
		height: 60,
		borderRadius: theme.borderRadius.lg,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
	},
	stepTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: 4,
	},
	stepSubtitle: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
	},
	calendarCard: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		...theme.shadows.soft,
	},
	calendarHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: theme.spacing.md,
	},
	calendarMonthLabel: {
		fontSize: 14,
		fontWeight: '700',
		color: theme.colors.foreground,
	},
	calendarWeekdays: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		width: '100%',
		marginBottom: theme.spacing.sm,
	},
	calendarWeekdayText: {
		flex: 1,
		textAlign: 'center',
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	calendarGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
	},
	calendarDayCell: {
		flexBasis: '14.285714%',
		maxWidth: '14.285714%',
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 18,
		marginVertical: 2,
	},
	calendarDayText: {
		fontSize: 13,
		color: theme.colors.foreground,
		fontWeight: '600',
	},
	calendarDaySelected: {
		backgroundColor: theme.colors.primary,
	},
	calendarDayTextSelected: {
		color: theme.colors.white,
	},
	calendarDayDisabled: {
		opacity: 0.35,
	},
	calendarDayTextDisabled: {
		color: theme.colors.foregroundMuted,
	},
	selectedDatesRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.sm,
	},
	selectedDatesCount: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		fontWeight: '600',
	},
	selectedDatesChips: {
		flexDirection: 'row',
		gap: 8,
		paddingVertical: theme.spacing.sm,
	},
	dateChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.full,
		backgroundColor: theme.colors.white,
		borderWidth: 1,
		borderColor: theme.colors.border,
		...theme.shadows.soft,
	},
	dateChipText: {
		fontSize: 12,
		color: theme.colors.foreground,
		fontWeight: '600',
	},
	fieldTypeList: {
		gap: theme.spacing.md,
	},
	fieldTypeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		...theme.shadows.soft,
	},
	fieldTypeCardSelected: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.primary + '10',
	},
	fieldTypeInfo: {
		flex: 1,
	},
	fieldTypeLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	fieldTypeTextSelected: {
		color: theme.colors.primary,
	},
	fieldTypeDescription: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		marginTop: 2,
	},
	fieldTypePriceBlock: {
		alignItems: 'flex-end',
		marginLeft: theme.spacing.md,
	},
	fieldTypePriceLabel: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		fontWeight: '600',
	},
	fieldTypePriceValue: {
		fontSize: 14,
		color: theme.colors.primary,
		fontWeight: '800',
		marginTop: 2,
	},
	fieldTypePriceUnit: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		fontWeight: '600',
	},
	radioOuter: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: theme.colors.border,
		justifyContent: 'center',
		alignItems: 'center',
	},
	radioOuterSelected: {
		borderColor: theme.colors.primary,
	},
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: theme.colors.primary,
	},
	dateNav: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
	},
	dateNavCenter: {
		alignItems: 'center',
	},
	dateNavTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	dateNavSubtitle: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	timeSlotsContainer: {
		flex: 1,
	},
	slotSectionLabel: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		marginBottom: theme.spacing.sm,
	},
	timeSlotsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	timeSlot: {
		width: '18.5%',
		marginRight: '1.5%',
		marginBottom: 8,
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.sm,
		padding: theme.spacing.sm,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	timeSlotBooked: {
		backgroundColor: '#f3f4f6',
		borderColor: '#e5e5e5',
	},
	timeSlotSelected: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	timeSlotPeak: {
		borderColor: '#f59e0b',
	},
	timeSlotTime: {
		fontSize: 13,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	timeSlotTextSelected: {
		color: theme.colors.white,
	},
	timeSlotTextBooked: {
		color: theme.colors.foregroundMuted,
	},
	timeSlotPrice: {
		fontSize: 11,
		color: theme.colors.foregroundMuted,
		marginTop: 2,
	},
	peakIcon: {
		fontSize: 10,
	},
	legend: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.md,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	legendDot: {
		width: 12,
		height: 12,
		borderRadius: 2,
	},
	legendText: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	selectedSummary: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginTop: theme.spacing.md,
	},
	selectedSummaryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
	},
	selectedSummaryTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	clearAllText: {
		fontSize: 13,
		color: theme.colors.accent,
	},
	selectedSlotItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: theme.spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	selectedSlotText: {
		flex: 1,
		fontSize: 13,
		color: theme.colors.foreground,
	},
	selectedSlotTime: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	selectedSlotPrice: {
		fontSize: 13,
		fontWeight: '600',
		color: theme.colors.primary,
	},
	summaryCard: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.lg,
	},
	summaryHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: theme.spacing.md,
	},
	summaryTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	summaryItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	summaryItemLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	summaryDate: {
		fontSize: 14,
		fontWeight: '500',
		color: theme.colors.foreground,
	},
	summaryTime: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	summaryPrice: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	summaryTotal: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.md,
	},
	summaryTotalLabel: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
	},
	summaryTotalValue: {
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	summaryTotalPrice: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.primary,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.md,
	},
	inputGroup: {
		marginBottom: theme.spacing.md,
	},
	inputLabel: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		marginBottom: 6,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		gap: 10,
	},
	input: {
		flex: 1,
		fontSize: 15,
		color: theme.colors.foreground,
		paddingVertical: 8,
	},
	paymentOption: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.sm,
		borderWidth: 2,
		borderColor: 'transparent',
	},
	paymentOptionSelected: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.primary + '10',
	},
	paymentOptionLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	paymentIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	paymentLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	paymentDescription: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	footer: {
		flexDirection: 'row',
		gap: 12,
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.white,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	backBtn: {
		flex: 1,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		alignItems: 'center',
	},
	backBtnText: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	nextBtn: {
		flex: 2,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		backgroundColor: theme.colors.primary,
		alignItems: 'center',
	},
	nextBtnDisabled: {
		backgroundColor: theme.colors.border,
	},
	nextBtnText: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.white,
	},
	bankTransferContainer: {
		flex: 1,
		padding: theme.spacing.lg,
	},
	qrPlaceholder: {
		width: 160,
		height: 160,
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	qrLabel: {
		marginTop: 8,
		fontSize: 14,
		color: theme.colors.foregroundMuted,
	},
	bankInfo: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
		marginTop: theme.spacing.lg,
	},
	bankInfoRow: {
		marginBottom: theme.spacing.md,
	},
	bankInfoLabel: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		marginBottom: 4,
	},
	bankInfoValue: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	bankInfoText: {
		fontSize: 18,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	bankInfoTextBold: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.foreground,
	},
	amountBox: {
		backgroundColor: theme.colors.primary + '10',
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.md,
	},
	amountLabel: {
		fontSize: 14,
		color: theme.colors.primary,
	},
	amountValue: {
		fontSize: 22,
		fontWeight: 'bold',
		color: theme.colors.primary,
	},
	warningBox: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: '#fef3c7',
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginTop: theme.spacing.lg,
	},
	warningText: {
		flex: 1,
		fontSize: 13,
		color: '#92400e',
	},
	backPaymentLink: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: theme.spacing.lg,
	},
	backPaymentText: {
		fontSize: 14,
		color: theme.colors.primary,
	},
	confirmPaymentBtn: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		paddingVertical: theme.spacing.md,
		alignItems: 'center',
		marginTop: 'auto',
	},
	confirmPaymentBtnText: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.white,
	},
	successContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	successIcon: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: theme.spacing.xl,
	},
	successTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.md,
	},
	successSubtitle: {
		fontSize: 15,
		color: theme.colors.foregroundMuted,
		textAlign: 'center',
		marginBottom: theme.spacing.xl,
	},
	successBtn: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.xxl,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
	},
	successBtnText: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.white,
	},
});
