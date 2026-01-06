import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export default function MessagesScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (isAuthenticated) {
                loadConversations();
            } else {
                setLoading(false);
            }
        }
    }, [isAuthenticated, authLoading]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await api.getConversations();
            const mappedConversations = data.map((c: any) => {
                const lastMessageAt = c.lastMessageAt ? new Date(c.lastMessageAt) : null;
                let timeStr = '';
                if (lastMessageAt) {
                    timeStr = lastMessageAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                }
                return {
                    id: c.id,
                    fieldName: c.fieldName || 'Sân bóng',
                    fieldImage: c.fieldImage || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100',
                    lastMessage: c.lastMessage || '',
                    time: timeStr,
                    unread: c.unreadCount > 0,
                    unreadCount: c.unreadCount || 0,
                    important: false,
                };
            });
            setConversations(mappedConversations);
        } catch (error) {
            console.error('Failed to load conversations:', error);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

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

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    const renderLoginPrompt = () => (
        <View style={styles.loginContainer}>
            <Ionicons name='lock-closed-outline' size={64} color={theme.colors.secondary} />
            <Text style={styles.loginTitle}>Chưa đăng nhập</Text>
            <Text style={styles.loginText}>
                Vui lòng đăng nhập để xem tin nhắn của bạn
            </Text>
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
            </TouchableOpacity>
        </View>
    );

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

    if (loading || authLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Tin nhắn</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Tin nhắn</Text>
                {isAuthenticated && (
                    <>
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
                    </>
                )}
            </View>

            {!isAuthenticated ? (
                renderLoginPrompt()
            ) : (
                <>
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color={theme.colors.foregroundMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm cuộc trò chuyện..."
                                placeholderTextColor={theme.colors.foregroundMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={theme.colors.foregroundMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
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
                </>
            )}
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
        paddingBottom: 100,
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
    loginContainer: {
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
