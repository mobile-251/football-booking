import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	TextInput,
	Image,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../constants/theme';

interface Message {
	id: number;
	text: string;
	time: string;
	isMe: boolean;
}

type ChatRouteParams = {
	Chat: {
		conversationId: number;
		fieldName: string;
		fieldImage: string;
	};
};

const MOCK_MESSAGES: Message[] = [
	{
		id: 1,
		text: 'Xin chào! Tôi muốn hỏi về giá thuê sân',
		time: '10:15',
		isMe: true,
	},
	{
		id: 2,
		text: 'Chào bạn! Giá thuê sân 5 người là 120.000đ/giờ nhé',
		time: '10:20',
		isMe: false,
	},
	{
		id: 3,
		text: 'Xin chào! Tôi muốn hỏi về giá thuê sân',
		time: '10:15',
		isMe: true,
	},
	{
		id: 4,
		text: 'Chào bạn! Giá thuê sân 5 người là 120.000đ/giờ nhé',
		time: '10:20',
		isMe: false,
	},
];

export default function ChatScreen() {
	const navigation = useNavigation();
	const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
	const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
	const [inputText, setInputText] = useState('');
	const flatListRef = useRef<FlatList>(null);

	const fieldName = route.params?.fieldName || 'Sân Bóng Mini Bắc Rạ...';
	const fieldImage = route.params?.fieldImage || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100';

	const handleSend = () => {
		if (!inputText.trim()) return;

		const newMessage: Message = {
			id: messages.length + 1,
			text: inputText,
			time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
			isMe: true,
		};

		setMessages([...messages, newMessage]);
		setInputText('');

		setTimeout(() => {
			flatListRef.current?.scrollToEnd();
		}, 100);
	};

	const renderMessage = ({ item }: { item: Message }) => (
		<View style={[styles.messageContainer, item.isMe ? styles.messageContainerMe : styles.messageContainerOther]}>
			<View style={[styles.messageBubble, item.isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
				<Text style={[styles.messageText, item.isMe ? styles.messageTextMe : styles.messageTextOther]}>
					{item.text}
				</Text>
			</View>
			<Text style={[styles.messageTime, item.isMe ? styles.messageTimeMe : styles.messageTimeOther]}>{item.time}</Text>
		</View>
	);

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
					<Ionicons name='arrow-back' size={24} color={theme.colors.white} />
				</TouchableOpacity>

				<Image source={{ uri: fieldImage }} style={styles.headerAvatar} />

				<View style={styles.headerInfo}>
					<Text style={styles.headerName} numberOfLines={1}>
						{fieldName}
					</Text>
					<View style={styles.statusRow}>
						<View style={styles.statusDot} />
						<Text style={styles.statusText}>Đang hoạt động</Text>
					</View>
				</View>

				<View style={styles.headerActions}>
					<TouchableOpacity style={styles.headerBtn}>
						<Ionicons name='call-outline' size={22} color={theme.colors.white} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.headerBtn}>
						<Ionicons name='videocam-outline' size={22} color={theme.colors.white} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.headerBtn}>
						<Ionicons name='ellipsis-vertical' size={22} color={theme.colors.white} />
					</TouchableOpacity>
				</View>
			</View>

			<KeyboardAvoidingView
				style={styles.content}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
			>
				<FlatList
					ref={flatListRef}
					data={messages}
					renderItem={renderMessage}
					keyExtractor={(item) => item.id.toString()}
					style={styles.messagesList}
					contentContainerStyle={styles.messagesContent}
					showsVerticalScrollIndicator={false}
					inverted={false}
				/>

				<View style={styles.inputContainer}>
					<TouchableOpacity style={styles.attachBtn}>
						<Ionicons name='image-outline' size={24} color={theme.colors.foregroundMuted} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.attachBtn}>
						<Ionicons name='attach' size={24} color={theme.colors.foregroundMuted} />
					</TouchableOpacity>
					<View style={styles.inputWrapper}>
						<TextInput
							style={styles.input}
							placeholder='Nhập tin nhắn...'
							placeholderTextColor={theme.colors.foregroundMuted}
							value={inputText}
							onChangeText={setInputText}
							multiline
						/>
						<TouchableOpacity style={styles.emojiBtn}>
							<Ionicons name='happy-outline' size={24} color={theme.colors.foregroundMuted} />
						</TouchableOpacity>
					</View>
					<TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
						<Ionicons name='send' size={20} color={theme.colors.white} />
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
	},
	backBtn: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerAvatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: theme.colors.background,
		marginLeft: theme.spacing.sm,
	},
	headerInfo: {
		flex: 1,
		marginLeft: theme.spacing.sm,
	},
	headerName: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.white,
	},
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#4ade80',
		marginRight: 6,
	},
	statusText: {
		fontSize: 12,
		color: theme.colors.white,
		opacity: 0.8,
	},
	headerActions: {
		flexDirection: 'row',
		gap: 4,
	},
	headerBtn: {
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		flex: 1,
	},
	messagesList: {
		flex: 1,
	},
	messagesContent: {
		padding: theme.spacing.lg,
	},
	messageContainer: {
		marginBottom: theme.spacing.md,
	},
	messageContainerMe: {
		alignItems: 'flex-end',
	},
	messageContainerOther: {
		alignItems: 'flex-start',
	},
	messageBubble: {
		maxWidth: '75%',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: 18,
	},
	messageBubbleMe: {
		backgroundColor: theme.colors.primary,
		borderBottomRightRadius: 4,
	},
	messageBubbleOther: {
		backgroundColor: theme.colors.white,
		borderBottomLeftRadius: 4,
		...theme.shadows.soft,
	},
	messageText: {
		fontSize: 15,
		lineHeight: 22,
	},
	messageTextMe: {
		color: theme.colors.white,
	},
	messageTextOther: {
		color: theme.colors.foreground,
	},
	messageTime: {
		fontSize: 11,
		color: theme.colors.foregroundMuted,
		marginTop: 4,
	},
	messageTimeMe: {
		marginRight: 4,
	},
	messageTimeOther: {
		marginLeft: 4,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		backgroundColor: theme.colors.white,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		gap: 8,
	},
	attachBtn: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	inputWrapper: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-end',
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.full,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 8,
		minHeight: 44,
	},
	input: {
		flex: 1,
		fontSize: 15,
		color: theme.colors.foreground,
		maxHeight: 100,
	},
	emojiBtn: {
		marginLeft: 8,
	},
	sendBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
