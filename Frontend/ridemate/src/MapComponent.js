import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';

// Custom marker icon
const createCustomIcon = (color = '#2A93D5') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin" style="background-color:${color};"></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

// Default positions (Visakhapatnam and Hyderabad)
const DEFAULT_SOURCE = [17.6868, 83.2185];
const DEFAULT_DESTINATION = [17.3850, 78.4867];

const MapComponent = ({ source, destination }) => {
  const sourcePosition = source || DEFAULT_SOURCE;
  const destinationPosition = destination || DEFAULT_DESTINATION;

  const sourceIcon = createCustomIcon('#2A93D5'); // blue
  const destinationIcon = createCustomIcon('#E63946'); // red

  // Determine labels based on whether using defaults or actual data
  const sourceLabel = source ? 'Your Location' : 'Visakhapatnam (Default)';
  const destLabel = destination ? 'Your Destination' : 'Hyderabad (Default)';

  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      mapContainer.classList.add('map-shadow');
    }
  }, []);

  return (
    <div className="map-wrapper">
      <div className="map-title">
        <h2>Source & Destination Map</h2>
        <p>
          {source || destination
            ? 'Showing your ride locations'
            : 'Login to see your personalized route'}
        </p>
      </div>

      <MapContainer
        center={sourcePosition}
        zoom={6}
        zoomControl={false}
        className="custom-map"
        key={`${sourcePosition[0]}-${destinationPosition[0]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        <Marker position={sourcePosition} icon={sourceIcon}>
          <Popup className="custom-popup">
            <div className="popup-content">
              <h3>Source: {sourceLabel}</h3>
              <p>Starting Point</p>
            </div>
          </Popup>
        </Marker>

        <Marker position={destinationPosition} icon={destinationIcon}>
          <Popup className="custom-popup">
            <div className="popup-content">
              <h3>Destination: {destLabel}</h3>
              <p>Ending Point</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-icon marker-sample" style={{ backgroundColor: '#2A93D5' }}></div>
          <span>Source</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon marker-sample" style={{ backgroundColor: '#E63946' }}></div>
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
