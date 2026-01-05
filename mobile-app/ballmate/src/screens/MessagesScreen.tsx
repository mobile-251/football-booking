import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type FilterType = 'all' | 'unread' | 'important';

interface Conversation {
    id: number;
    fieldName: string;
    fieldImage: string;
    lastMessage: string;
    time: string;
    unread: boolean;
    unreadCount?: number;
    important?: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        fieldName: 'Sân Bóng Mini Bắc Rạch Chiếc',
        fieldImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100',
        lastMessage: 'Chào bạn! Sân vẫn còn trống khung 18h-19',
        time: '10:30',
        unread: true,
        unreadCount: 2,
    },
    {
        id: 2,
        fieldName: 'Sân Bóng Mini Bắc Rạch Chiếc',
        fieldImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100',
        lastMessage: 'Cảm ơn bạn đã đặt sân. Hẹn gặp lại!',
        time: '10:30',
        unread: false,
    },
    {
        id: 3,
        fieldName: 'Sân Bóng Mini Bắc Rạch Chiếc',
        fieldImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100',
        lastMessage: 'Chào bạn! Sân vẫn còn trống khung 18h-19',
        time: '10:30',
        unread: true,
        unreadCount: 2,
    },
    {
        id: 4,
        fieldName: 'Sân Bóng Mini Bắc Rạch Chiếc',
        fieldImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100',
        lastMessage: 'Cảm ơn bạn đã đặt sân. Hẹn gặp lại!',
        time: '10:30',
        unread: false,
    },
    {
        id: 5,
        fieldName: 'Sân Bóng Mini Bắc Rạch Chiếc',
        fieldImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100',
        lastMessage: 'Cảm ơn bạn đã đặt sân. Hẹn gặp lại!',
        time: '10:30',
        unread: false,
    },
];

export default function MessagesScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);

    const getFilteredConversations = () => {
        let result = [...conversations];

        switch (activeFilter) {
            case 'unread':
                result = result.filter(c => c.unread);
                break;
            case 'important':
                result = result.filter(c => c.important);
                break;
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.fieldName.toLowerCase().includes(query) ||
                c.lastMessage.toLowerCase().includes(query)
            );
        }

        return result;
    };

    const getFilterCount = (filter: FilterType) => {
        switch (filter) {
            case 'all':
                return conversations.length;
            case 'unread':
                return conversations.filter(c => c.unread).length;
            case 'important':
                return conversations.filter(c => c.important).length;
            default:
                return 0;
        }
    };

    const unreadCount = conversations.filter(c => c.unread).length;

    const handleConversationPress = (conversation: Conversation) => {
        navigation.navigate('Chat' as any, {
            conversationId: conversation.id,
            fieldName: conversation.fieldName,
            fieldImage: conversation.fieldImage,
        });
    };

    const renderConversation = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item)}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: item.fieldImage }}
                    style={styles.avatar}
                />
                {item.unread && item.unreadCount && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                )}
            </View>

            <View style={styles.conversationContent}>
                <Text style={[styles.fieldName, item.unread && styles.fieldNameUnread]}>
                    {item.fieldName}
                </Text>
                <Text style={[styles.lastMessage, item.unread && styles.lastMessageUnread]} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>

            <Text style={styles.time}>{item.time}</Text>
        </TouchableOpacity>
    );

    const FILTERS: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'Tất cả' },
        { key: 'unread', label: 'Chưa đọc' },
        { key: 'important', label: 'Quan trọng' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Tin nhắn</Text>
                <Text style={styles.subtitle}>{unreadCount} tin nhắn chưa đọc</Text>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {FILTERS.map(filter => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.filterTab,
                                activeFilter === filter.key && styles.filterTabActive,
                            ]}
                            onPress={() => setActiveFilter(filter.key)}
                        >
                            <Text style={[
                                styles.filterTabText,
                                activeFilter === filter.key && styles.filterTabTextActive,
                            ]}>
                                {filter.label}
                            </Text>
                            <Text style={[
                                styles.filterTabCount,
                                activeFilter === filter.key && styles.filterTabCountActive,
                            ]}>
                                {getFilterCount(filter.key)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
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

            {/* Conversations List */}
            <FlatList
                data={getFilteredConversations()}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.secondary} />
                        <Text style={styles.emptyTitle}>Không có tin nhắn</Text>
                        <Text style={styles.emptyText}>
                            Bạn chưa có cuộc trò chuyện nào.
                        </Text>
                    </View>
                }
            />
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
        paddingBottom: theme.spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.white,
        opacity: 0.8,
        marginTop: 4,
        marginBottom: theme.spacing.md,
    },
    filterTabs: {
        flexDirection: 'row',
        gap: 8,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.full,
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: theme.colors.white,
    },
    filterTabText: {
        fontSize: 13,
        color: theme.colors.white,
    },
    filterTabTextActive: {
        color: theme.colors.foreground,
    },
    filterTabCount: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.white,
    },
    filterTabCountActive: {
        color: theme.colors.foreground,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: 10,
        marginTop: -theme.spacing.md,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.foreground,
    },
    searchButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.full,
        justifyContent: 'center',
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.white,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.soft,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.background,
    },
    unreadBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    unreadBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    conversationContent: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    fieldName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.foreground,
        marginBottom: 4,
    },
    fieldNameUnread: {
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 13,
        color: theme.colors.foregroundMuted,
    },
    lastMessageUnread: {
        color: theme.colors.foreground,
    },
    time: {
        fontSize: 12,
        color: theme.colors.foregroundMuted,
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
