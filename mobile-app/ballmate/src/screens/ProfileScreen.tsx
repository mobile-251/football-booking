import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle: string;
    route?: keyof RootStackParamList;
}

const MENU_ITEMS: MenuItem[] = [
    {
        icon: 'person-outline',
        iconColor: theme.colors.primary,
        iconBg: theme.colors.primary + '20',
        title: 'Thông tin cá nhân',
        subtitle: 'Cập nhật thông tin của bạn',
        route: 'PersonalInfo',
    },
    {
        icon: 'receipt-outline',
        iconColor: theme.colors.primary,
        iconBg: theme.colors.primary + '20',
        title: 'Lịch sử giao dịch',
        subtitle: 'Xem lịch sử đặt sân',
        route: 'TransactionHistory',
    },
    {
        icon: 'heart-outline',
        iconColor: '#ef4444',
        iconBg: '#fee2e2',
        title: 'Sân yêu thích',
        subtitle: 'Danh sách sân đã lưu',
        route: 'Favorites',
    },
    {
        icon: 'notifications-outline',
        iconColor: '#f59e0b',
        iconBg: '#fef3c7',
        title: 'Thông báo',
        subtitle: 'Quản lý thông báo',
        route: 'Notifications',
    },
    {
        icon: 'settings-outline',
        iconColor: '#6b7280',
        iconBg: '#f3f4f6',
        title: 'Cài đặt',
        subtitle: 'Tùy chỉnh ứng dụng',
    },
    {
        icon: 'shield-checkmark-outline',
        iconColor: '#3b82f6',
        iconBg: '#dbeafe',
        title: 'Bảo mật',
        subtitle: 'Mật khẩu và xác thực',
    },
    {
        icon: 'help-circle-outline',
        iconColor: '#8b5cf6',
        iconBg: '#ede9fe',
        title: 'Hỗ trợ',
        subtitle: 'Trung tâm trợ giúp',
    },
];

interface UserStats {
    bookingCount: number;
    totalSpent: number;
    points: number;
}

export default function ProfileScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState<UserStats>({ bookingCount: 0, totalSpent: 0, points: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadUserStats();
        } else {
            setStatsLoading(false);
        }
    }, [isAuthenticated]);

    const loadUserStats = async () => {
        try {
            // For now, we'll use placeholder stats since there's no dedicated stats endpoint
            // In a real app, this would fetch from /api/users/me/stats
            const bookings = await api.getBookings();
            const totalSpent = bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
            setStats({
                bookingCount: bookings.length,
                totalSpent: totalSpent,
                points: Math.floor(totalSpent / 10000), // 1 point per 10k spent
            });
        } catch (error) {
            console.error('Failed to load user stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    const handleMenuPress = (item: MenuItem) => {
        if (item.route) {
            navigation.navigate(item.route as any);
        }
    };

    const formatPrice = (price: number): string => {
        if (price >= 1000000) {
            return (price / 1000000).toFixed(1) + 'M';
        }
        if (price >= 1000) {
            return (price / 1000).toFixed(0) + 'K';
        }
        return price.toString();
    };

    const getAvatarUrl = (): string => {
        if (user?.avatarUrl) return user.avatarUrl;
        const name = user?.fullName || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=22c55e&color=fff&size=150`;
    };

    const getJoinDate = (): string => {
        if (!user?.createdAt) return 'Thành viên mới';
        const date = new Date(user.createdAt);
        return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    };

    if (authLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Tài khoản</Text>
                </View>
                <View style={styles.loginPrompt}>
                    <Ionicons name="person-circle-outline" size={80} color={theme.colors.secondary} />
                    <Text style={styles.loginTitle}>Chưa đăng nhập</Text>
                    <Text style={styles.loginText}>Đăng nhập để xem thông tin tài khoản</Text>
                    <TouchableOpacity
                        style={styles.loginBtnPrompt}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginBtnText}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={styles.title}>Tài khoản</Text>
                        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.profileLeft}>
                            <Image
                                source={{ uri: getAvatarUrl() }}
                                style={styles.avatar}
                            />
                            <View style={styles.profileInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.name}>{user.fullName || 'Người dùng'}</Text>
                                    <TouchableOpacity
                                        style={styles.editBtn}
                                        onPress={() => navigation.navigate('PersonalInfo')}
                                    >
                                        <Ionicons name="create-outline" size={18} color={theme.colors.foregroundMuted} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.email}>{user.email}</Text>
                                <View style={styles.locationRow}>
                                    <Ionicons name="calendar-outline" size={14} color={theme.colors.foregroundMuted} />
                                    <Text style={styles.locationText}>{getJoinDate()}</Text>
                                </View>
                                <View style={styles.badgeRow}>
                                    <View style={styles.memberBadge}>
                                        <Ionicons name="person" size={12} color={theme.colors.white} />
                                        <Text style={styles.memberText}>
                                            {user.role === 'PLAYER' ? 'Người chơi' : user.role}
                                        </Text>
                                    </View>
                                    {stats.points > 0 && (
                                        <View style={styles.pointsBadge}>
                                            <Text style={styles.pointsText}>{stats.points} điểm</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.statLabel}>Lượt đặt</Text>
                        <Text style={styles.statValue}>
                            {statsLoading ? '-' : stats.bookingCount}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="wallet-outline" size={24} color="#f59e0b" />
                        </View>
                        <Text style={styles.statLabel}>Chi tiêu</Text>
                        <Text style={styles.statValue}>
                            {statsLoading ? '-' : formatPrice(stats.totalSpent)}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
                            <Ionicons name="gift-outline" size={24} color="#ef4444" />
                        </View>
                        <Text style={styles.statLabel}>Điểm</Text>
                        <Text style={styles.statValue}>
                            {statsLoading ? '-' : stats.points}
                        </Text>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>Cài đặt & Tiện ích</Text>

                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleMenuPress(item)}>
                            <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                                <Ionicons name={item.icon} size={22} color={item.iconColor} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.foregroundMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={theme.colors.white} />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>

                {/* Version Info */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
                    <Text style={styles.versionText}>© 2025 BallMate</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
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
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xl + 40,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.medium,
    },
    profileLeft: {
        flexDirection: 'row',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: theme.colors.background,
    },
    profileInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.foreground,
    },
    editBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    email: {
        fontSize: 13,
        color: theme.colors.foregroundMuted,
        marginTop: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    locationText: {
        fontSize: 12,
        color: theme.colors.foregroundMuted,
        marginLeft: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 8,
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
    pointsBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    pointsText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        marginTop: -30,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        alignItems: 'center',
        ...theme.shadows.soft,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.foregroundMuted,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.foreground,
    },
    settingsSection: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.foreground,
        marginBottom: theme.spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.soft,
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.foreground,
    },
    menuSubtitle: {
        fontSize: 12,
        color: theme.colors.foregroundMuted,
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.white,
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        paddingBottom: 100,
    },
    versionText: {
        fontSize: 12,
        color: theme.colors.foregroundMuted,
    },
    loginPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    loginTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.foreground,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    loginText: {
        fontSize: 14,
        color: theme.colors.foregroundMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    loginBtnPrompt: {
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
