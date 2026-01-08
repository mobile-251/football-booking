import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Image,
	TextInput,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';

interface EditableFieldProps {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	editable: boolean;
	placeholder?: string;
	keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

function EditableField({
	icon,
	label,
	value,
	onChangeText,
	editable,
	placeholder,
	keyboardType = 'default',
}: EditableFieldProps) {
	return (
		<View style={styles.infoField}>
			<View style={styles.infoIcon}>
				<Ionicons name={icon} size={20} color={theme.colors.primary} />
			</View>
			<View style={styles.infoContent}>
				<Text style={styles.infoLabel}>{label}</Text>
				{editable ? (
					<TextInput
						style={styles.infoInput}
						value={value}
						onChangeText={onChangeText}
						placeholder={placeholder}
						placeholderTextColor={theme.colors.foregroundMuted}
						keyboardType={keyboardType}
					/>
				) : (
					<Text style={styles.infoValue}>{value || 'Chưa cập nhật'}</Text>
				)}
			</View>
			{editable && <Ionicons name='create-outline' size={18} color={theme.colors.foregroundMuted} />}
		</View>
	);
}

export default function PersonalInfoScreen() {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const insets = useSafeAreaInsets();
	const { user, isAuthenticated, isLoading: authLoading, setUserData } = useAuth();

	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);

	// Form state
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [birthday, setBirthday] = useState('');
	const [gender, setGender] = useState<'male' | 'female'>('male');

	useEffect(() => {
		if (user) {
			setFullName(user.fullName || '');
			setEmail(user.email || '');
			setPhone(user.phoneNumber || '');
			setAddress(''); // These would come from user profile
			setBirthday('');
		}
	}, [user]);

	const handleSave = async () => {
		try {
			setSaving(true);
			// Call API to update profile
			const updated = await api.updateProfile({
				fullName: fullName || undefined,
				phoneNumber: phone || undefined,
			});
			await setUserData(updated);

			Alert.alert('Thành công', 'Thông tin đã được cập nhật');
			setIsEditing(false);
		} catch (error) {
			console.error('Failed to update profile:', error);
			Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		// Reset to original values
		if (user) {
			setFullName(user.fullName || '');
			setEmail(user.email || '');
			setPhone(user.phoneNumber || '');
		}
		setIsEditing(false);
	};

	const getAvatarUrl = (): string => {
		if (user?.avatarUrl) return user.avatarUrl;
		const name = user?.fullName || 'User';
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=22c55e&color=fff&size=150`;
	};

	const getJoinDate = (): string => {
		if (!user?.createdAt) return 'Mới tham gia';
		const date = new Date(user.createdAt);
		return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
	};

	if (authLoading) {
		return (
			<View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size='large' color={theme.colors.primary} />
			</View>
		);
	}

	if (!isAuthenticated || !user) {
		return (
			<View style={styles.container}>
				<SafeAreaView style={styles.header} edges={['top']}>
					<View style={styles.headerTop}>
						<TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
							<Ionicons name='chevron-back' size={24} color={theme.colors.white} />
						</TouchableOpacity>
						<Text style={styles.title}>Thông tin cá nhân</Text>
						<View style={{ width: 40 }} />
					</View>
				</SafeAreaView>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Ionicons name='lock-closed-outline' size={64} color={theme.colors.secondary} />
					<Text style={styles.loginPromptTitle}>Chưa đăng nhập</Text>
					<Text style={styles.loginPromptText}>Vui lòng đăng nhập để xem thông tin</Text>
					<TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
						<Text style={styles.loginBtnText}>Đăng nhập</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<SafeAreaView style={styles.header} edges={['top']}>
				<View style={styles.headerTop}>
					<TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
						<Ionicons name='chevron-back' size={24} color={theme.colors.white} />
					</TouchableOpacity>
					<Text style={styles.title}>Thông tin cá nhân</Text>
					<TouchableOpacity style={styles.editBtn} onPress={() => (isEditing ? handleCancel() : setIsEditing(true))}>
						<Ionicons name={isEditing ? 'close' : 'create-outline'} size={22} color={theme.colors.white} />
					</TouchableOpacity>
				</View>

				{/* Avatar Section */}
				<View style={styles.avatarSection}>
					<View style={styles.avatarContainer}>
						<Image source={{ uri: getAvatarUrl() }} style={styles.avatar} />
						{isEditing && (
							<TouchableOpacity style={styles.changeAvatarBtn}>
								<Ionicons name='camera' size={16} color={theme.colors.white} />
							</TouchableOpacity>
						)}
					</View>
					<Text style={styles.userName}>{fullName || 'Người dùng'}</Text>
					<View style={styles.verifiedBadge}>
						<View style={styles.verifiedDot} />
						<Text style={styles.verifiedText}>Tài khoản đã xác thực</Text>
					</View>
				</View>
			</SafeAreaView>

			<ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
				{/* Gender Selection */}
				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Giới tính</Text>
					<View style={styles.genderContainer}>
						<TouchableOpacity
							style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
							onPress={() => isEditing && setGender('male')}
							disabled={!isEditing}
						>
							<Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Nam</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
							onPress={() => isEditing && setGender('female')}
							disabled={!isEditing}
						>
							<Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Nữ</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Personal Info Fields */}
				<View style={styles.infoSection}>
					<EditableField
						icon='person-outline'
						label='Họ và tên'
						value={fullName}
						onChangeText={setFullName}
						editable={isEditing}
						placeholder='Nhập họ và tên'
					/>
					<EditableField
						icon='mail-outline'
						label='Email'
						value={email}
						onChangeText={setEmail}
						editable={false} // Email usually can't be changed
						keyboardType='email-address'
					/>
					<EditableField
						icon='call-outline'
						label='Số điện thoại'
						value={phone}
						onChangeText={setPhone}
						editable={isEditing}
						placeholder='Nhập số điện thoại'
						keyboardType='phone-pad'
					/>
					<EditableField
						icon='location-outline'
						label='Địa chỉ'
						value={address}
						onChangeText={setAddress}
						editable={isEditing}
						placeholder='Nhập địa chỉ'
					/>
					<EditableField
						icon='calendar-outline'
						label='Ngày sinh'
						value={birthday}
						onChangeText={setBirthday}
						editable={isEditing}
						placeholder='DD/MM/YYYY'
					/>
				</View>

				{/* Account Info Section */}
				<View style={styles.accountSection}>
					<Text style={styles.accountTitle}>Thông tin tài khoản</Text>

					<View style={styles.accountRow}>
						<Text style={styles.accountLabel}>Ngày tham gia</Text>
						<Text style={styles.accountValue}>{getJoinDate()}</Text>
					</View>

					<View style={styles.accountRow}>
						<Text style={styles.accountLabel}>Loại tài khoản</Text>
						<View style={styles.memberBadge}>
							<Ionicons name='person' size={12} color={theme.colors.white} />
							<Text style={styles.memberText}>{user.role === 'PLAYER' ? 'Người chơi' : user.role}</Text>
						</View>
					</View>

					<View style={[styles.accountRow, { borderBottomWidth: 0 }]}>
						<Text style={styles.accountLabel}>Trạng thái</Text>
						<Text style={styles.statusText}>{user.isActive ? 'Hoạt động' : 'Không hoạt động'}</Text>
					</View>
				</View>

				{/* Save Button */}
				{isEditing && (
					<TouchableOpacity
						style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
						onPress={handleSave}
						disabled={saving}
					>
						{saving ? (
							<ActivityIndicator size='small' color={theme.colors.white} />
						) : (
							<>
								<Ionicons name='checkmark' size={20} color={theme.colors.white} />
								<Text style={styles.saveBtnText}>Lưu thay đổi</Text>
							</>
						)}
					</TouchableOpacity>
				)}

			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.sm,
		paddingBottom: theme.spacing.xl + 20,
	},
	headerTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: theme.spacing.xl,
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.white,
	},
	editBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	avatarSection: {
		alignItems: 'center',
	},
	avatarContainer: {
		width: 100,
		height: 100,
		borderRadius: 16,
		backgroundColor: theme.colors.white,
		padding: 4,
		marginBottom: theme.spacing.md,
		position: 'relative',
	},
	avatar: {
		width: '100%',
		height: '100%',
		borderRadius: 12,
	},
	changeAvatarBtn: {
		position: 'absolute',
		bottom: -4,
		right: -4,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: theme.colors.white,
	},
	userName: {
		fontSize: 22,
		fontWeight: 'bold',
		color: theme.colors.white,
		marginBottom: 8,
	},
	verifiedBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.2)',
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: theme.borderRadius.full,
		gap: 6,
	},
	verifiedDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#4ade80',
	},
	verifiedText: {
		fontSize: 12,
		color: theme.colors.white,
	},
	content: {
		flex: 1,
		marginTop: -theme.spacing.lg,
	},
	section: {
		backgroundColor: theme.colors.white,
		marginHorizontal: theme.spacing.lg,
		marginTop: theme.spacing.lg,
		padding: theme.spacing.lg,
		borderRadius: theme.borderRadius.lg,
		...theme.shadows.soft,
	},
	sectionLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.md,
	},
	genderContainer: {
		flexDirection: 'row',
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.lg,
		padding: 4,
	},
	genderBtn: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: theme.borderRadius.md,
		alignItems: 'center',
	},
	genderBtnActive: {
		backgroundColor: theme.colors.primary,
	},
	genderText: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	genderTextActive: {
		color: theme.colors.white,
	},
	infoSection: {
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.md,
	},
	infoField: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.white,
		padding: theme.spacing.md,
		borderRadius: theme.borderRadius.lg,
		marginBottom: theme.spacing.sm,
		...theme.shadows.soft,
	},
	infoIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: theme.colors.primary + '20',
		justifyContent: 'center',
		alignItems: 'center',
	},
	infoContent: {
		flex: 1,
		marginLeft: theme.spacing.md,
	},
	infoLabel: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		marginBottom: 2,
	},
	infoValue: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	infoInput: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.foreground,
		padding: 0,
		margin: 0,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.primary,
	},
	accountSection: {
		backgroundColor: theme.colors.white,
		marginHorizontal: theme.spacing.lg,
		marginTop: theme.spacing.lg,
		padding: theme.spacing.lg,
		borderRadius: theme.borderRadius.lg,
		...theme.shadows.soft,
	},
	accountTitle: {
		fontSize: 15,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.md,
	},
	accountRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: theme.spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	accountLabel: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	accountValue: {
		fontSize: 14,
		fontWeight: '500',
		color: theme.colors.foreground,
	},
	memberBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.full,
		gap: 4,
	},
	memberText: {
		fontSize: 11,
		fontWeight: '600',
		color: theme.colors.white,
	},
	statusText: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.primary,
	},
	saveBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: theme.colors.primary,
		marginHorizontal: theme.spacing.lg,
		marginTop: theme.spacing.xl,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.lg,
		gap: 8,
	},
	saveBtnDisabled: {
		opacity: 0.7,
	},
	saveBtnText: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.white,
	},
	loginPromptTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginTop: theme.spacing.lg,
	},
	loginPromptText: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		marginTop: theme.spacing.sm,
		marginBottom: theme.spacing.xl,
	},
	loginBtn: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.xl,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.lg,
	},
	loginBtnText: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.white,
	},
});
