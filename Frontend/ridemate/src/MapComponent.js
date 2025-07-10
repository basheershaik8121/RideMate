import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline } from 'react-leaflet';
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

const MapComponent = () => {
  const sourcePosition = [17.6868, 83.2185]; // Visakhapatnam
  const destinationPosition = [17.3850, 78.4867]; // Hyderabad


  const sourceIcon = createCustomIcon('#2A93D5'); // blue
  const destinationIcon = createCustomIcon('#E63946'); // red

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
        <p>Showing Source and Destination Locations</p>
      </div>

      <MapContainer 
        center={sourcePosition} 
        zoom={6} 
        zoomControl={false}
        className="custom-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomright" />
        
        <Marker position={sourcePosition} icon={sourceIcon}>
          <Popup className="custom-popup">
            <div className="popup-content">
              <h3>Source: Visakhapatnam</h3>
              <p>Starting Point</p>
            </div>
          </Popup>
        </Marker>

        <Marker position={destinationPosition} icon={destinationIcon}>
          <Popup className="custom-popup">
            <div className="popup-content">
              <h3>Destination: Hyderabad</h3>
              <p>Ending Point</p>
            </div>
          </Popup>
        </Marker>

        {/* <Polyline positions={[sourcePosition, destinationPosition]} color="#6C5CE7" weight={4} /> */}
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
