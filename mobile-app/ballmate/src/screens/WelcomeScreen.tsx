import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import Config from '../config/environment';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const handleContinue = () => {
        navigation.navigate('Login' as any);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    {/* Outer Ring */}
                    <View style={styles.outerRing}>
                        {/* Inner Ring */}
                        <View style={styles.innerRing}>
                            {/* Star Icon */}
                            <View style={styles.starContainer}>
                                <Ionicons name="star" size={80} color={theme.colors.white} />
                            </View>
                        </View>
                    </View>

                    {/* Play Button */}
                    <TouchableOpacity style={styles.playButton}>
                        <Ionicons name="play" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Text Section */}
                <View style={styles.textSection}>
                    <Text style={styles.title}>Chào mừng đến với BallMate</Text>
                    <Text style={styles.subtitle}>
                        Nền tảng đặt sân bóng đá thông minh{'\n'}và hiện đại nhất Việt Nam
                    </Text>

                    {/* Feature Tags */}
                    <View style={styles.tagsContainer}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>1000+ sân bóng</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>Đặt lịch 24/7</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>Hỗ trợ tận tình</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
                <Text style={styles.continueBtnText}>Tiếp tục</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            {/* Debug Badge - Hiển thị API URL để verify OTA update */}
            <View style={styles.debugBadge}>
                <Text style={styles.debugText}>ENV: {Config.APP_ENV} | API: {Config.API_URL}</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 60,
        position: 'relative',
    },
    outerRing: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerRing: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    starContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    textSection: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.white,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
    },
    tagText: {
        fontSize: 13,
        color: theme.colors.white,
        fontWeight: '500',
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.white,
        marginHorizontal: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        gap: 8,
    },
    continueBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    debugBadge: {
        position: 'absolute',
        bottom: 8,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 8,
    },
    debugText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
});
