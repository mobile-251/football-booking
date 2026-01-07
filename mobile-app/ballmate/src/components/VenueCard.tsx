import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Venue } from '../types/types';
import { formatPrice } from '../utils/formatters';

interface VenueCardProps {
	venue: Venue & { minPrice?: number };
	onPress: () => void;
	distance?: string;
}

export default function VenueCard({ venue, onPress, distance }: VenueCardProps) {
	const fieldCount = venue.fields?.filter(f => f.isActive).length || 0;

	return (
		<TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
			<View style={styles.imageContainer}>
				<Image
					source={{
						uri: venue.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
					}}
					style={styles.image}
					resizeMode='cover'
				/>
				<View style={styles.badgeRow}>
					<View style={styles.badgeGreen}>
						<Ionicons name='football' size={12} color={theme.colors.white} />
						<Text style={styles.badgeText}>{fieldCount} sân</Text>
					</View>
					{distance && (
						<View style={styles.badgeOrange}>
							<Ionicons name='location' size={12} color={theme.colors.white} />
							<Text style={styles.badgeText}>Gần tôi</Text>
						</View>
					)}
				</View>
				{/* Favorite icon - visual only, không link data */}
				<TouchableOpacity style={styles.favoriteBtn} activeOpacity={0.8}>
					<Ionicons name='heart-outline' size={20} color={theme.colors.accent} />
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<Text style={styles.venueName} numberOfLines={1}>
					{venue.name}
				</Text>

				<View style={styles.infoRow}>
					<Ionicons name='location-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.address} numberOfLines={1}>
						{venue.address || 'Địa chỉ đang cập nhật'}
					</Text>
				</View>

				<View style={styles.infoRow}>
					<Ionicons name='time-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.infoText}>
						{venue.openTime || '06:00'} - {venue.closeTime || '23:00'}
					</Text>
				</View>

				<View style={styles.bottomRow}>
					<View>
						<Text style={styles.priceLabel}>
							Chỉ từ {formatPrice(venue.minPrice || 0)}đ/giờ
						</Text>
					</View>
					{distance && <Text style={styles.distance}>{distance}</Text>}
				</View>

				<TouchableOpacity style={styles.bookButton} onPress={onPress}>
					<Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		marginBottom: theme.spacing.lg,
		overflow: 'hidden',
		...theme.shadows.medium,
	},
	imageContainer: {
		position: 'relative',
		height: 160,
	},
	image: {
		width: '100%',
		height: '100%',
	},
	badgeRow: {
		position: 'absolute',
		top: theme.spacing.md,
		left: theme.spacing.md,
		flexDirection: 'row',
		gap: 6,
	},
	badgeGreen: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.full,
	},
	badgeOrange: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#f59e0b',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.full,
	},
	badgeText: {
		color: theme.colors.white,
		fontSize: 11,
		fontWeight: '600',
	},
	favoriteBtn: {
		position: 'absolute',
		top: theme.spacing.md,
		right: theme.spacing.md,
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.full,
		padding: 6,
		...theme.shadows.soft,
	},
	content: {
		padding: theme.spacing.lg,
	},
	venueName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.sm,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 4,
	},
	address: {
		flex: 1,
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	infoText: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	bottomRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.sm,
		marginBottom: theme.spacing.md,
	},
	priceLabel: {
		fontSize: 14,
		fontWeight: 'bold',
		color: theme.colors.foreground,
	},
	distance: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foregroundMuted,
	},
	bookButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		alignItems: 'center',
	},
	bookButtonText: {
		color: theme.colors.white,
		fontWeight: '600',
		fontSize: 14,
	},
});
