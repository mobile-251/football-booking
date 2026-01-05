import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';

type FilterType = 'all' | 'unread';

interface Notification {
    id: number;
    type: 'booking' | 'promo' | 'review' | 'reminder' | 'payment';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        type: 'booking',
        title: 'Đặt sân thành công',
        message: 'Sân Bóng mini Bắc Rạch Chiếc vào lúc 18:51 ngày 9/10/2025',
        time: '5 phút trước',
        read: false,
    },
    {
        id: 2,
        type: 'promo',
        title: 'Ưu đãi đặc biệt',
        message: 'Giảm 20% cho lần đặt sân tiếp theo. Mã: FOOTBALL20',
        time: '1 giờ trước',
        read: false,
    },
    {
        id: 3,
        type: 'review',
        title: 'Đánh giá trải nghiệm',
        message: 'Hãy đánh giá trải nghiệm của bạn tại Sân Bóng Đá Làng Đại Học',
        time: '3 giờ trước',
        read: true,
    },
    {
        id: 4,
        type: 'reminder',
        title: 'Nhắc nhở đặt sân',
        message: 'Bạn có lịch đặt sân vào 18:00 hôm nay. Hãy đến sớm 10 phút!',
        time: '5 giờ trước',
        read: true,
    },
    {
        id: 5,
        type: 'payment',
        title: 'Xác nhận thanh toán',
        message: 'Thanh toán 200.000đ cho đơn đặt sân #12345 đã được xác nhận',
        time: '1 ngày trước',
        read: true,
    },
];

const getIconForType = (type: Notification['type']) => {
    switch (type) {
        case 'booking':
            return { icon: 'calendar-outline' as const, color: theme.colors.primary, bg: theme.colors.primary + '20' };
        case 'promo':
            return { icon: 'gift-outline' as const, color: '#ef4444', bg: '#fee2e2' };
        case 'review':
            return { icon: 'star-outline' as const, color: '#f59e0b', bg: '#fef3c7' };
        case 'reminder':
            return { icon: 'time-outline' as const, color: '#3b82f6', bg: '#dbeafe' };
        case 'payment':
            return { icon: 'checkmark-circle-outline' as const, color: theme.colors.primary, bg: theme.colors.primary + '20' };
        default:
            return { icon: 'notifications-outline' as const, color: theme.colors.primary, bg: theme.colors.primary + '20' };
    }
};

export default function NotificationsScreen() {
    const navigation = useNavigation();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const getFilteredNotifications = () => {
        if (activeFilter === 'unread') {
            return notifications.filter(n => !n.read);
        }
        return notifications;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleMarkAsRead = (id: number) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const handleDelete = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const renderNotification = ({ item }: { item: Notification }) => {
        const iconConfig = getIconForType(item.type);

        return (
            <View style={styles.notificationItem}>
                {!item.read && <View style={styles.unreadDot} />}

                <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                    <Ionicons name={iconConfig.icon} size={22} color={iconConfig.color} />
                </View>

                <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                        {item.title}
                    </Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.notificationTime}>{item.time}</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleMarkAsRead(item.id)}
                    >
                        <Ionicons
                            name={item.read ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={24}
                            color={item.read ? theme.colors.primary : theme.colors.foregroundMuted}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Thông báo</Text>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={22} color={theme.colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tổng thông báo</Text>
                        <Text style={styles.statValue}>{notifications.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Chưa đọc</Text>
                        <View style={styles.unreadValue}>
                            <Text style={styles.statValue}>{unreadCount}</Text>
                            {unreadCount > 0 && <View style={styles.redDot} />}
                        </View>
                    </View>
                    <View style={styles.bellContainer}>
                        <Ionicons name="notifications-outline" size={32} color={theme.colors.white} />
                    </View>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[
                        styles.filterTab,
                        activeFilter === 'all' && styles.filterTabActive,
                    ]}
                    onPress={() => setActiveFilter('all')}
                >
                    <Text style={[
                        styles.filterTabText,
                        activeFilter === 'all' && styles.filterTabTextActive,
                    ]}>
                        Tất cả ({notifications.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterTab,
                        activeFilter === 'unread' && styles.filterTabActive,
                    ]}
                    onPress={() => setActiveFilter('unread')}
                >
                    <Text style={[
                        styles.filterTabText,
                        activeFilter === 'unread' && styles.filterTabTextActive,
                    ]}>
                        Chưa đọc ({unreadCount})
                    </Text>
                    {unreadCount > 0 && <View style={styles.filterDot} />}
                </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <FlatList
                data={getFilteredNotifications()}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={theme.colors.secondary} />
                        <Text style={styles.emptyTitle}>Không có thông báo</Text>
                        <Text style={styles.emptyText}>
                            Bạn chưa có thông báo nào.
                        </Text>
                    </View>
                }
            />

            {/* Mark All as Read Button */}
            <View style={styles.bottomAction}>
                <TouchableOpacity
                    style={styles.markAllBtn}
                    onPress={handleMarkAllAsRead}
                >
                    <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                    <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
                </TouchableOpacity>
            </View>
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
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xl,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
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
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: theme.borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.white,
        opacity: 0.8,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    unreadValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    redDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        marginLeft: 6,
    },
    bellContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: 12,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.white,
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: theme.colors.primary,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.foreground,
    },
    filterTabTextActive: {
        color: theme.colors.white,
    },
    filterDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f59e0b',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.white,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.soft,
    },
    unreadDot: {
        position: 'absolute',
        top: theme.spacing.md + 4,
        left: theme.spacing.md - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.foreground,
        marginBottom: 4,
    },
    unreadTitle: {
        fontWeight: 'bold',
    },
    notificationMessage: {
        fontSize: 13,
        color: theme.colors.foregroundMuted,
        lineHeight: 18,
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 11,
        color: theme.colors.foregroundMuted,
    },
    actions: {
        marginLeft: theme.spacing.sm,
    },
    actionBtn: {
        padding: 4,
    },
    bottomAction: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.lg,
        gap: 8,
    },
    markAllText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.white,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.foreground,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.foregroundMuted,
        textAlign: 'center',
    },
});
