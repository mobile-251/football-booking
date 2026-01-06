import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatPrice } from '../utils/formatters';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
	iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const footballIcon = new L.DivIcon({
	className: 'football-marker',
	html: `<div style="
        background-color: #4ade80;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 18px;
    ">⚽</div>`,
	iconSize: [36, 36],
	iconAnchor: [18, 18],
});

const selectedFootballIcon = new L.DivIcon({
	className: 'football-marker-selected',
	html: `<div style="
        background-color: #1e6b4a;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        font-size: 22px;
    ">⚽</div>`,
	iconSize: [44, 44],
	iconAnchor: [22, 22],
});

interface FieldLocation {
	id: number;
	name: string;
	lat: number;
	lng: number;
	price?: number;
	address?: string;
}

interface LeafletMapProps {
	fields: FieldLocation[];
	selectedFieldId?: number | null;
	onMarkerClick: (fieldId: number) => void;
	center?: [number, number];
	zoom?: number;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
	const map = useMap();
	React.useEffect(() => {
		map.setView(center, zoom);
	}, [center, zoom, map]);
	return null;
}

export default function LeafletMap({
	fields,
	selectedFieldId,
	onMarkerClick,
	center = [10.8231, 106.6297],
	zoom = 12,
}: LeafletMapProps) {
	return (
		<MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
			/>
			<MapController center={center} zoom={zoom} />

			{fields.map((field) => (
				<Marker
					key={field.id}
					position={[field.lat, field.lng]}
					icon={selectedFieldId === field.id ? selectedFootballIcon : footballIcon}
					eventHandlers={{
						click: () => onMarkerClick(field.id),
					}}
				>
					<Popup>
						<div style={{ minWidth: 150 }}>
							<strong>{field.name}</strong>
							{field.address && <p style={{ fontSize: 12, margin: '4px 0' }}>{field.address}</p>}
							{field.price && (
								<p style={{ fontSize: 14, fontWeight: 'bold', color: '#1e6b4a', margin: 0 }}>
									{formatPrice(field.price)}đ/giờ
								</p>
							)}
						</div>
					</Popup>
				</Marker>
			))}
		</MapContainer>
	);
}
