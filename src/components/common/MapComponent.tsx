import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icon missing in React Leaflet
// You might need to import marker icons locally if these CDN links fail in production
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapMarker {
    id: string;
    position: [number, number]; // [lat, lng]
    title: string;
    description?: string;
    status?: 'checked_in' | 'in_transit' | 'offline';
}

interface MapComponentProps {
    markers: MapMarker[];
    center?: [number, number];
    zoom?: number;
    className?: string;
}

const MapComponent = ({ markers, center = [20.5937, 78.9629], zoom = 5, className = "h-[400px] w-full rounded-xl z-0" }: MapComponentProps) => {
    // INDIA center default: 20.5937, 78.9629
    const [mapCenter, setMapCenter] = useState<[number, number]>(center);

    useEffect(() => {
        if (markers.length > 0) {
            // If we have markers, simple center on the first one or calculate centroid
            // For now, just centering on the first marker if available
            setMapCenter(markers[0].position);
        }
    }, [markers]);

    return (
        <div className={className}>
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', borderRadius: '0.75rem', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {markers.map((marker) => (
                    <Marker key={marker.id} position={marker.position} icon={defaultIcon}>
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm">{marker.title}</h3>
                                {marker.description && <p className="text-xs text-gray-600 m-0">{marker.description}</p>}
                                {marker.status && (
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${marker.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                                            marker.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {marker.status.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
