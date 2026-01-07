import React, { useState, useEffect, useCallback } from 'react';
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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../constants/theme';
import { Venue } from '../types/types';
import { api } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import VenueCard from '../components/VenueCard';
import { formatPrice } from '../utils/formatters';
import * as Location from 'expo-location';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CategoryItem {
    key: string;
    label: string;
    count: number;
}

type QuickFilterKey = 'near' | 'available';

const QUICK_FILTERS: { key: QuickFilterKey; label: string; icon: string }[] = [
    { key: 'near', label: 'Gần tôi nhất', icon: 'location-outline' },
    { key: 'available', label: 'Đang hoạt động', icon: 'checkmark-circle-outline' },
];

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<(Venue & { minPrice?: number })[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<QuickFilterKey>('available');
    const [venues, setVenues] = useState<(Venue & { minPrice?: number })[]>([]);
    const [allVenues, setAllVenues] = useState<(Venue & { minPrice?: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<{ total: number; minPrice: number }>({ total: 0, minPrice: 0 });
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        filterVenues();
    }, [selectedFilter, appliedSearch, allVenues, userLocation]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const venuesData = await api.getVenues();
            setAllVenues(venuesData as (Venue & { minPrice?: number })[]);
            
            // Compute stats
            const totalFields = venuesData.reduce((sum, v) => sum + (v.fields?.length || 0), 0);
            const allMinPrices = venuesData.map((v: any) => v.minPrice || 0).filter(p => p > 0);
            const globalMinPrice = allMinPrices.length > 0 ? Math.min(...allMinPrices) : 0;
            setStats({ total: totalFields, minPrice: globalMinPrice });
        } catch (error) {
            console.error('Failed to load venues:', error);
            setAllVenues([]);
        } finally {
            setLoading(false);
        }
    };

    // const loadFavorites = async () => {
    //     try {
    //         const data = await api.getFavorites();
    //         setFavoriteIds(new Set(data.map((fav: any) => fav.fieldId).filter(Boolean)));
    //     } catch {
    //         // Not authenticated or endpoint failed; keep empty set.
    //         setFavoriteIds(new Set());
    //     }
    // };

    // const handleToggleFavorite = async (fieldId: number) => {
    //     let previousHas = false;
    //     setFavoriteIds((prev) => {
    //         const next = new Set(prev);
    //         previousHas = next.has(fieldId);
    //         if (previousHas) next.delete(fieldId);
    //         else next.add(fieldId);
    //         return next;
    //     });

    //     try {
    //         const { isFavorite } = await api.toggleFavorite(fieldId);
    //         setFavoriteIds((prev) => {
    //             const next = new Set(prev);
    //             if (isFavorite) next.add(fieldId);
    //             else next.delete(fieldId);
    //             return next;
    //         });
    //     } catch (error) {
    //         setFavoriteIds((prev) => {
    //             const next = new Set(prev);
    //             if (previousHas) next.add(fieldId);
    //             else next.delete(fieldId);
    //             return next;
    //         });
    //         console.error('Failed to toggle favorite:', error);
    //     }
    // };

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Request location permission
    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationPermission(true);
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                });
                return true;
            } else {
                setLocationPermission(false);
                Alert.alert('Quyền truy cập vị trí', 'Để sử dụng tính năng "Gần tôi nhất", bạn cần cho phép truy cập vị trí.', [
                    { text: 'Đã hiểu', style: 'default' },
                ]);
                return false;
            }
        } catch (error) {
            console.error('Location error:', error);
            return false;
        }
    };

    // Handle near filter - check location permission first
    const handleFilterSelect = async (filterKey: QuickFilterKey) => {
        if (filterKey === 'near' && !userLocation) {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) return;
        }
        setSelectedFilter(filterKey);
    };

    const filterVenues = useCallback(() => {
        let result = [...allVenues];

        // Filter by search query
        if (appliedSearch) {
            const query = appliedSearch.toLowerCase();
            result = result.filter(
                (v) =>
                    v.name.toLowerCase().includes(query) ||
                    v.address?.toLowerCase().includes(query)
            );
        }

        // Sort by quick filter
        switch (selectedFilter) {
            case 'near':
                if (userLocation) {
                    result = result
                        .map((v) => {
                            const venueLat = v.latitude || 0;
                            const venueLng = v.longitude || 0;
                            const distance = calculateDistance(userLocation.lat, userLocation.lng, venueLat, venueLng);
                            return { ...v, distance };
                        })
                        .sort((a, b) => ((a as any).distance || 999) - ((b as any).distance || 999));
                }
                break;
            case 'available':
                result = result.filter((v) => v.isActive);
                break;
        }

        setVenues(result);
    }, [allVenues, selectedFilter, appliedSearch, userLocation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadInitialData();
        setRefreshing(false);
    };

    const handleSearch = () => {
        setAppliedSearch(searchQuery);
        setShowSearchDropdown(false);
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        const q = text.trim().toLowerCase();
        if (q.length >= 1) {
            const suggestions = allVenues
                .filter(
                    (v) =>
                        (v.name || '').toLowerCase().includes(q) ||
                        (v.address || '').toLowerCase().includes(q)
                )
                .slice(0, 5);
            setSearchSuggestions(suggestions);
            setShowSearchDropdown(suggestions.length > 0);
        } else {
            setSearchSuggestions([]);
            setShowSearchDropdown(false);
        }
    };

    const handleSuggestionPress = (venue: Venue & { minPrice?: number }) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        navigation.navigate('VenueDetail', { venueId: venue.id });
    };

    const handleVenuePress = (venue: Venue & { minPrice?: number }) => {
        navigation.navigate('VenueDetail', { venueId: venue.id });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationLabel}>Vị trí hiện tại</Text>
                            <View style={styles.locationValue}>
                                <Ionicons name='location' size={16} color={theme.colors.white} />
                                <Text style={styles.locationText}>Thủ Đức, TP.HCM</Text>
                                <Ionicons name='chevron-down' size={16} color={theme.colors.white} />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name='notifications-outline' size={24} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Ionicons name='football' size={28} color={theme.colors.accent} />
                        <Text style={styles.logoText}>BallMate</Text>
                    </View>
                    <Text style={styles.tagline}>Đặt sân nhanh chóng, chơi bóng hết mình</Text>

                    {/* Search Bar */}
                    <View style={styles.searchWrapper}>
                        <View style={styles.searchContainer}>
                            <View style={styles.searchInputWrapper}>
                                <Ionicons name='search' size={20} color={theme.colors.foregroundMuted} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder='Tìm sân theo tên hoặc địa điểm...'
                                    placeholderTextColor={theme.colors.foregroundMuted}
                                    value={searchQuery}
                                    onChangeText={handleSearchChange}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType='search'
                                    onFocus={() => searchQuery.length > 0 && searchSuggestions.length > 0 && setShowSearchDropdown(true)}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSearchQuery('');
                                            setAppliedSearch('');
                                            setShowSearchDropdown(false);
                                        }}
                                    >
                                        <Ionicons name='close-circle' size={18} color={theme.colors.foregroundMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Dropdown */}
                        {showSearchDropdown && searchSuggestions.length > 0 && (
                            <View style={styles.searchDropdown}>
                                {searchSuggestions.map((venue, index) => (
                                    <TouchableOpacity
                                        key={venue.id}
                                        style={[
                                            styles.searchSuggestionItem,
                                            index < searchSuggestions.length - 1 && styles.searchSuggestionBorder,
                                        ]}
                                        onPress={() => handleSuggestionPress(venue)}
                                    >
                                        <View style={styles.suggestionIcon}>
                                            <Ionicons name='football-outline' size={20} color={theme.colors.primary} />
                                        </View>
                                        <View style={styles.suggestionContent}>
                                            <Text style={styles.suggestionTitle}>{venue.name}</Text>
                                            <Text style={styles.suggestionSubtitle}>
                                                {venue?.name || 'Sân bóng'}
                                            </Text>
                                        </View>
                                        <Ionicons name='chevron-forward' size={18} color={theme.colors.foregroundMuted} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>


                    {/* Quick Filters */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Bộ lọc nhanh</Text>
                        <View style={styles.filterRow}>
                            {QUICK_FILTERS.map((filter) => (
                                <TouchableOpacity
                                    key={filter.key}
                                    style={[styles.filterChip, selectedFilter === filter.key && styles.filterChipActive]}
                                    onPress={() => handleFilterSelect(filter.key)}
                                >
                                    <Ionicons
                                        name={filter.icon as any}
                                        size={16}
                                        color={selectedFilter === filter.key ? theme.colors.white : theme.colors.foreground}
                                    />
                                    <Text style={[styles.filterText, selectedFilter === filter.key && styles.filterTextActive]}>
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View>
                            <Text style={styles.statsNumber}>{stats.total} sân bóng đá</Text>
                        </View>
                        <View style={styles.statsRight}>
                            <Text style={styles.priceRange}>
                                {stats.minPrice > 0 ? `Từ ${formatPrice(stats.minPrice)}đ/giờ` : 'Đang cập nhật'}
                            </Text>
                            <Text style={styles.priceLabel}>Giá thấp nhất</Text>
                        </View>
                    </View>

                    {/* Search Results Info */}
                    {appliedSearch && (
                        <View style={styles.searchResultsInfo}>
                            <Text style={styles.searchResultsText}>
                                Tìm thấy {venues.length} kết quả cho "{appliedSearch}"
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    setAppliedSearch('');
                                }}
                            >
                                <Text style={styles.clearSearchText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Venue List */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Cụm sân thể thao</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>Xem tất cả</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator size='large' color={theme.colors.primary} style={styles.loader} />
                        ) : venues.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name='football-outline' size={48} color={theme.colors.foregroundMuted} />
                                <Text style={styles.emptyStateTitle}>Không tìm thấy cụm sân</Text>
                                <Text style={styles.emptyStateText}>
                                    {appliedSearch ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có cụm sân nào'}
                                </Text>
                            </View>
                        ) : (
                            venues.map((venue) => {
                                const venueWithDistance = venue as (typeof venue) & { distance?: number };
                                return (
                                    <VenueCard
                                        key={venue.id}
                                        venue={venue}
                                        onPress={() => handleVenuePress(venue)}
                                        distance={
                                            userLocation && venueWithDistance.distance !== undefined
                                                ? `${venueWithDistance.distance.toFixed(1)} km`
                                                : undefined
                                        }
                                    />
                                );
                            })
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
        position: 'relative',
        zIndex: 10,
        elevation: 10,
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
    searchWrapper: {
        position: 'relative',
        zIndex: 100,
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
        paddingBottom: 100,
        position: 'relative',
        zIndex: 1,
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
    searchResultsInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.sm,
    },
    searchResultsText: {
        fontSize: 13,
        color: theme.colors.foregroundMuted,
    },
    clearSearchText: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    loader: {
        marginVertical: 40,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.foreground,
        marginTop: theme.spacing.md,
    },
    emptyStateText: {
        fontSize: 14,
        color: theme.colors.foregroundMuted,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },
    searchDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        marginTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        zIndex: 1000,
    },
    searchSuggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    searchSuggestionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    suggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionContent: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.foreground,
    },
    suggestionSubtitle: {
        fontSize: 12,
        color: theme.colors.foregroundMuted,
        marginTop: 2,
    },
});
