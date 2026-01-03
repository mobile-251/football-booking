import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';

interface UserInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    birthday: string;
    gender: 'male' | 'female';
    joinDate: string;
    accountType: string;
    status: string;
    avatar: string;
    verified: boolean;
}

const MOCK_USER: UserInfo = {
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0123 456 789',
    address: 'Thủ Đức, TP.HCM',
    birthday: '15/06/1995',
    gender: 'male',
    joinDate: 'Tháng 6, 2024',
    accountType: 'VIP Member',
    status: 'Hoạt động',
    avatar: 'https://i.pravatar.cc/150?img=8',
    verified: true,
};

interface InfoFieldProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    label: string;
    value: string;
}

function InfoField({ icon, iconColor, iconBg, label, value }: InfoFieldProps) {
    return (
        <View style={styles.infoField}>
            <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

export default function PersonalInfoScreen() {
    const navigation = useNavigation();
    const [user] = useState<UserInfo>(MOCK_USER);
    const [gender, setGender] = useState<'male' | 'female'>(user.gender);

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
                    <Text style={styles.title}>Thông tin cá nhân</Text>
                    <TouchableOpacity style={styles.editBtn}>
                        <Ionicons name="create-outline" size={22} color={theme.colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user.avatar }}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.userName}>{user.name}</Text>
                    {user.verified && (
                        <View style={styles.verifiedBadge}>
                            <View style={styles.verifiedDot} />
                            <Text style={styles.verifiedText}>Tài khoản đã xác thực</Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Gender Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Giới tính</Text>
                    <View style={styles.genderContainer}>
                        <TouchableOpacity
                            style={[
                                styles.genderBtn,
                                gender === 'male' && styles.genderBtnActive,
                            ]}
                            onPress={() => setGender('male')}
                        >
                            <Text style={[
                                styles.genderText,
                                gender === 'male' && styles.genderTextActive,
                            ]}>
                                Nam
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.genderBtn,
                                gender === 'female' && styles.genderBtnActive,
                            ]}
                            onPress={() => setGender('female')}
                        >
                            <Text style={[
                                styles.genderText,
                                gender === 'female' && styles.genderTextActive,
                            ]}>
                                Nữ
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Personal Info Fields */}
                <View style={styles.infoSection}>
                    <InfoField
                        icon="person-outline"
                        iconColor={theme.colors.primary}
                        iconBg={theme.colors.primary + '20'}
                        label="Họ và tên"
                        value={user.name}
                    />
                    <InfoField
                        icon="mail-outline"
                        iconColor={theme.colors.primary}
                        iconBg={theme.colors.primary + '20'}
                        label="Email"
                        value={user.email}
                    />
                    <InfoField
                        icon="call-outline"
                        iconColor={theme.colors.primary}
                        iconBg={theme.colors.primary + '20'}
                        label="Số điện thoại"
                        value={user.phone}
                    />
                    <InfoField
                        icon="location-outline"
                        iconColor={theme.colors.primary}
                        iconBg={theme.colors.primary + '20'}
                        label="Địa chỉ"
                        value={user.address}
                    />
                    <InfoField
                        icon="calendar-outline"
                        iconColor={theme.colors.primary}
                        iconBg={theme.colors.primary + '20'}
                        label="Ngày sinh"
                        value={user.birthday}
                    />
                </View>

                {/* Account Info Section */}
                <View style={styles.accountSection}>
                    <Text style={styles.accountTitle}>Thông tin tài khoản</Text>

                    <View style={styles.accountRow}>
                        <Text style={styles.accountLabel}>Ngày tham gia</Text>
                        <Text style={styles.accountValue}>{user.joinDate}</Text>
                    </View>

                    <View style={styles.accountRow}>
                        <Text style={styles.accountLabel}>Loại tài khoản</Text>
                        <View style={styles.vipBadge}>
                            <Ionicons name="star" size={12} color={theme.colors.white} />
                            <Text style={styles.vipText}>{user.accountType}</Text>
                        </View>
                    </View>

                    <View style={styles.accountRow}>
                        <Text style={styles.accountLabel}>Trạng thái</Text>
                        <Text style={styles.statusText}>{user.status}</Text>
                    </View>
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
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
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
    accountSection: {
        backgroundColor: theme.colors.white,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
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
    vipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        gap: 4,
    },
    vipText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.white,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
