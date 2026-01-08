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
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Error state interface
interface FormErrors {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
}

export default function RegisterScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { loginWithRememberMe } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Validate registration form fields
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Validate full name (min 2 characters)
        if (!fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ tên';
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
        }

        // Validate email format (stricter regex - TLD must be letters only)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!emailRegex.test(email.trim())) {
            newErrors.email = 'Email không hợp lệ';
        }

        // Validate password length (min 6 characters)
        if (!password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        // Validate password match
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        // Check terms agreement
        if (!agreeTerms) {
            newErrors.terms = 'Vui lòng đồng ý với điều khoản sử dụng';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        // Validate form before submitting
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Register the user
            await api.register({ email: email.trim(), password, fullName: fullName.trim(), role: 'PLAYER' });
            
            // After successful registration, automatically login with rememberMe=true
            await loginWithRememberMe(email.trim(), password, true);
            
            // Navigation will happen automatically via AppNavigator
            // when isAuthenticated becomes true
        } catch (error: any) {
            console.log('Register error:', error);
            
            // Extract error message from various possible response structures
            let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại';
            
            const responseData = error?.response?.data;
            if (responseData) {
                if (Array.isArray(responseData.message)) {
                    // class-validator returns array of error messages
                    errorMessage = responseData.message.join('\n');
                } else if (typeof responseData.message === 'string') {
                    errorMessage = responseData.message;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                }
            } else if (error?.message && error.message !== 'Network Error') {
                errorMessage = error.message;
            } else if (error?.message === 'Network Error') {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            }
            
            Alert.alert('Đăng ký thất bại', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        navigation.navigate('Login' as any);
    };

    // Clear error when user starts typing
    const handleFullNameChange = (text: string) => {
        setFullName(text);
        if (errors.fullName) {
            setErrors(prev => ({ ...prev, fullName: undefined }));
        }
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: undefined }));
        }
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: undefined }));
        }
    };

    const handleConfirmPasswordChange = (text: string) => {
        setConfirmPassword(text);
        if (errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: undefined }));
        }
    };

    const handleTermsChange = () => {
        setAgreeTerms(!agreeTerms);
        if (errors.terms) {
            setErrors(prev => ({ ...prev, terms: undefined }));
        }
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
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>Tạo tài khoản</Text>
                        <Text style={styles.subtitle}>Đăng ký để bắt đầu đặt sân bóng</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        {/* Full Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Họ và tên</Text>
                            <View style={[styles.inputWrapper, errors.fullName && styles.inputWrapperError]}>
                                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nguyễn Văn A"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={fullName}
                                    onChangeText={handleFullNameChange}
                                />
                            </View>
                            {errors.fullName && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                                    <Text style={styles.errorText}>{errors.fullName}</Text>
                                </View>
                            )}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
                                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="nguyenvana@email.com"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            {errors.email && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                                    <Text style={styles.errorText}>{errors.email}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mật khẩu</Text>
                            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={password}
                                    onChangeText={handlePasswordChange}
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
                            {errors.password && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                                    <Text style={styles.errorText}>{errors.password}</Text>
                                </View>
                            )}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={confirmPassword}
                                    onChangeText={handleConfirmPasswordChange}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="rgba(255,255,255,0.6)"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                </View>
                            )}
                        </View>

                        {/* Terms Checkbox */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={handleTermsChange}
                        >
                            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked, errors.terms && styles.checkboxError]}>
                                {agreeTerms && <Ionicons name="checkmark" size={14} color={theme.colors.primary} />}
                            </View>
                            <Text style={styles.termsText}>
                                Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng của app</Text>
                            </Text>
                        </TouchableOpacity>
                        {errors.terms && (
                            <View style={[styles.errorContainer, { marginTop: -8, marginBottom: 12 }]}>
                                <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                                <Text style={styles.errorText}>{errors.terms}</Text>
                            </View>
                        )}

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <Text style={styles.registerBtnText}>
                                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                            </Text>
                            {!loading && <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />}
                        </TouchableOpacity>

                        {/* Social Login */}
                        <View style={styles.dividerRow}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
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

                    {/* Login Link */}
                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Đã có tài khoản?</Text>
                        <TouchableOpacity onPress={handleLogin}>
                            <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
    headerSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.white,
        marginBottom: 8,
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
        marginBottom: theme.spacing.md,
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
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputWrapperError: {
        borderColor: '#ff6b6b',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.white,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        paddingHorizontal: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#ff6b6b',
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: theme.spacing.lg,
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
    checkboxError: {
        borderColor: '#ff6b6b',
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    termsLink: {
        fontWeight: '600',
        color: theme.colors.white,
        textDecorationLine: 'underline',
    },
    registerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.white,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        gap: 8,
        marginBottom: theme.spacing.lg,
    },
    registerBtnDisabled: {
        opacity: 0.7,
    },
    registerBtnText: {
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
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingBottom: theme.spacing.xl,
    },
    loginText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.white,
        textDecorationLine: 'underline',
    },
});
