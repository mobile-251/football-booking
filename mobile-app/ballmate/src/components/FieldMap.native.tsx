import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';
import { theme } from '../constants/theme';
import { formatPrice } from '../utils/formatters';

interface FieldLocation {
	id: number;
	name: string;
	lat: number;
	lng: number;
	price?: number;
	address?: string;
}

interface NativeMapProps {
	fields: FieldLocation[];
	selectedFieldId?: number | null;
	onMarkerClick: (fieldId: number) => void;
	center?: [number, number];
	zoom?: number;
}

export default function NativeMap({
	fields,
	selectedFieldId,
	onMarkerClick,
	center = [10.8231, 106.6297],
	zoom = 12,
}: NativeMapProps) {
	const latitudeDelta = 0.0922 * Math.pow(2, 12 - zoom);
	const longitudeDelta = 0.0421 * Math.pow(2, 12 - zoom);

	const initialRegion: Region = {
		latitude: center[0],
		longitude: center[1],
		latitudeDelta,
		longitudeDelta,
	};

	return (
		<MapView
			style={styles.map}
			provider={PROVIDER_DEFAULT}
			mapType={Platform.OS === 'android' ? 'none' : 'standard'}
			initialRegion={initialRegion}
			showsUserLocation
			showsMyLocationButton
		>
			<UrlTile urlTemplate='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' maximumZ={19} flipY={false} />
			{fields.map((field) => (
				<Marker
					key={field.id}
					coordinate={{
						latitude: field.lat,
						longitude: field.lng,
					}}
					title={field.name}
					description={field.price ? `${formatPrice(field.price)}đ/giờ` : undefined}
					onPress={() => onMarkerClick(field.id)}
					pinColor={selectedFieldId === field.id ? theme.colors.primary : '#4ade80'}
				>
					<View style={[styles.markerContainer, selectedFieldId === field.id && styles.markerSelected]}>
						<Text style={styles.markerEmoji}>⚽</Text>
					</View>
				</Marker>
			))}
		</MapView>
	);
}

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject,
	},
	markerContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#4ade80',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: 'white',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	markerSelected: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: theme.colors.primary,
	},
	markerEmoji: {
		fontSize: 18,
	},
});
