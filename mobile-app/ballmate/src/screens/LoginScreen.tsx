import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { login } = useAuth();
    const [email, setEmail] = useState('player1@ballmate.com');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            // Navigate to main app after successful login
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error: any) {
            Alert.alert(
                'Đăng nhập thất bại',
                error.response?.data?.message || 'Email hoặc mật khẩu không đúng'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        navigation.navigate('Register' as any);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="football-outline" size={50} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.appName}>BallMate</Text>
                        <Text style={styles.subtitle}>Đăng nhập để đặt sân bóng</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="nguyenvana@email.com"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mật khẩu</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="rgba(255,255,255,0.6)"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Remember Me & Forgot Password */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                    {rememberMe && <Ionicons name="checkmark" size={14} color={theme.colors.primary} />}
                                </View>
                                <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginBtnText}>
                                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </Text>
                            {!loading && <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />}
                        </TouchableOpacity>

                        {/* Social Login */}
                        <View style={styles.dividerRow}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Ionicons name="logo-facebook" size={20} color={theme.colors.white} />
                                <Text style={styles.socialBtnText}>Facebook</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Ionicons name="logo-google" size={20} color={theme.colors.white} />
                                <Text style={styles.socialBtnText}>Google</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Register Link */}
                    <View style={styles.registerRow}>
                        <Text style={styles.registerText}>Chưa có tài khoản?</Text>
                        <TouchableOpacity onPress={handleRegister}>
                            <Text style={styles.registerLink}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    logoContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.white,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    formSection: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.white,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.white,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.white,
        borderColor: theme.colors.white,
    },
    checkboxLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    forgotPassword: {
        fontSize: 13,
        color: theme.colors.white,
        fontWeight: '600',
    },
    loginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.white,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        gap: 8,
        marginBottom: theme.spacing.lg,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginHorizontal: theme.spacing.md,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 12,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 14,
        borderRadius: theme.borderRadius.lg,
        gap: 8,
    },
    socialBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.white,
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingBottom: theme.spacing.xl,
    },
    registerText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    registerLink: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.white,
        textDecorationLine: 'underline',
    },
});
