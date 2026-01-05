import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../constants/theme';
import { Field, FieldType, FIELD_TYPE_LABELS } from '../types/types';
import { api } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import FieldCard from '../components/FieldCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
    { key: 'all', label: 'Tất cả', count: 36 },
    { key: 'FIELD_5VS5', label: 'Sân 5', count: 12 },
    { key: 'FIELD_7VS7', label: 'Sân 7', count: 12 },
    { key: 'FIELD_11VS11', label: 'Sân 11', count: 5 },
];

const QUICK_FILTERS = [
    { key: 'near', label: 'Gần tôi nhất', icon: 'location-outline' },
    { key: 'available', label: 'Còn trống', icon: 'checkmark-circle-outline', active: true },
    { key: 'rating', label: 'Đánh giá cao', icon: 'star-outline' },
    { key: 'popular', label: 'Phổ biến', icon: 'trending-up-outline' },
];

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFilter, setSelectedFilter] = useState('available');
    const [fields, setFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadFields();
    }, [selectedCategory]);

    const loadFields = async () => {
        try {
            setLoading(true);
            const filter = selectedCategory !== 'all'
                ? { fieldType: selectedCategory as FieldType }
                : undefined;
            const data = await api.getFields(filter);
            setFields(data);
        } catch (error) {
            console.error('Failed to load fields:', error);
            // Mock data for demo
            setFields([
                {
                    id: 1,
                    name: 'Sân bóng mini Bắc Rạch Chiếc',
                    venueId: 1,
                    fieldType: 'FIELD_5VS5',
                    pricePerHour: 200000,
                    description: 'Sân cỏ nhân tạo chất lượng cao',
                    images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    venue: {
                        id: 1,
                        name: 'Khu thể thao Rạch Chiếc',
                        address: 'Đường 410, Phước Long A, Quận 9, TP.HCM',
                        city: 'TP.HCM',
                        openTime: '00:00',
                        closeTime: '24:00',
                        facilities: ['Parking', 'Shower'],
                        images: [],
                        ownerId: 1,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                },
                {
                    id: 2,
                    name: 'Sân bóng Phú Thọ',
                    venueId: 2,
                    fieldType: 'FIELD_7VS7',
                    pricePerHour: 350000,
                    description: 'Sân tiêu chuẩn FIFA',
                    images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    venue: {
                        id: 2,
                        name: 'CLB Thể thao Phú Thọ',
                        address: '1 Lữ Gia, Quận 11, TP.HCM',
                        city: 'TP.HCM',
                        openTime: '06:00',
                        closeTime: '22:00',
                        facilities: ['Parking', 'Cafe', 'Shower'],
                        images: [],
                        ownerId: 2,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFields();
        setRefreshing(false);
    };

    const handleFieldPress = (field: Field) => {
        navigation.navigate('FieldDetail', { fieldId: field.id });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationLabel}>Vị trí hiện tại</Text>
                            <View style={styles.locationValue}>
                                <Ionicons name="location" size={16} color={theme.colors.white} />
                                <Text style={styles.locationText}>Thủ Đức, TP.HCM</Text>
                                <Ionicons name="chevron-down" size={16} color={theme.colors.white} />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>3</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Ionicons name="football" size={28} color={theme.colors.accent} />
                        <Text style={styles.logoText}>BallMate</Text>
                    </View>
                    <Text style={styles.tagline}>Đặt sân nhanh chóng, chơi bóng hết mình</Text>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search" size={20} color={theme.colors.foregroundMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm sân theo tên hoặc địa điểm..."
                                placeholderTextColor={theme.colors.foregroundMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity style={styles.searchButton}>
                            <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Categories */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Danh mục</Text>
                            <TouchableOpacity>
                                <Ionicons name="options-outline" size={20} color={theme.colors.foregroundMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.categoryRow}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[
                                            styles.categoryChip,
                                            selectedCategory === cat.key && styles.categoryChipActive,
                                        ]}
                                        onPress={() => setSelectedCategory(cat.key)}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                selectedCategory === cat.key && styles.categoryTextActive,
                                            ]}
                                        >
                                            {cat.label}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.categoryCount,
                                                selectedCategory === cat.key && styles.categoryCountActive,
                                            ]}
                                        >
                                            {cat.count}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Quick Filters */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Bộ lọc nhanh</Text>
                        <View style={styles.filterRow}>
                            {QUICK_FILTERS.map((filter) => (
                                <TouchableOpacity
                                    key={filter.key}
                                    style={[
                                        styles.filterChip,
                                        selectedFilter === filter.key && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedFilter(filter.key)}
                                >
                                    <Ionicons
                                        name={filter.icon as any}
                                        size={16}
                                        color={selectedFilter === filter.key ? theme.colors.white : theme.colors.foreground}
                                    />
                                    <Text
                                        style={[
                                            styles.filterText,
                                            selectedFilter === filter.key && styles.filterTextActive,
                                        ]}
                                    >
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View>
                            <Text style={styles.statsNumber}>36 sân bóng đá</Text>
                            <Text style={styles.statsLabel}>Trong bán kính 5km</Text>
                        </View>
                        <View style={styles.statsRight}>
                            <Text style={styles.priceRange}>Từ 120.000đ/giờ</Text>
                            <Text style={styles.priceLabel}>Giá trung bình</Text>
                        </View>
                    </View>

                    {/* Field List */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Sân thể thao gần bạn</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>Xem tất cả</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
                        ) : (
                            fields.map((field) => (
                                <FieldCard
                                    key={field.id}
                                    field={field}
                                    onPress={() => handleFieldPress(field)}
                                />
                            ))
                        )}
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
        paddingBottom: theme.spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.lg,
    },
    locationInfo: {},
    locationLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    locationValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: theme.colors.white,
        fontWeight: '600',
    },
    notificationBtn: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: theme.colors.accent,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: theme.spacing.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        fontSize: 14,
        color: theme.colors.foreground,
    },
    searchButton: {
        backgroundColor: theme.colors.foreground,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        justifyContent: 'center',
    },
    searchButtonText: {
        color: theme.colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
    content: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.foreground,
    },
    seeAllText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.white,
    },
    categoryChipActive: {
        backgroundColor: theme.colors.foreground,
        borderColor: theme.colors.foreground,
    },
    categoryText: {
        fontSize: 14,
        color: theme.colors.foreground,
        fontWeight: '500',
    },
    categoryTextActive: {
        color: theme.colors.white,
    },
    categoryCount: {
        fontSize: 12,
        color: theme.colors.foregroundMuted,
    },
    categoryCountActive: {
        color: 'rgba(255,255,255,0.7)',
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.white,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterText: {
        fontSize: 13,
        color: theme.colors.foreground,
        fontWeight: '500',
    },
    filterTextActive: {
        color: theme.colors.white,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xl,
    },
    statsNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.foreground,
    },
    statsLabel: {
        fontSize: 12,
        color: theme.colors.primary,
        marginTop: 2,
    },
    statsRight: {
        alignItems: 'flex-end',
    },
    priceRange: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.foregroundMuted,
        marginTop: 2,
    },
    loader: {
        marginVertical: 40,
    },
});
