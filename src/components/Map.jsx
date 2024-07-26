import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import 'leaflet.marker.slideto/Leaflet.Marker.SlideTo';
import { api } from '../services/api';
import markerIcon from '../assets/car.png';

// Show Arrow along the path vehicle has taken
const PolylineDecorator = ({ path }) => {
  const map = useMap();

  useEffect(() => {
    if (path.length > 1) {
      const decorator = L.polylineDecorator(path, {
        patterns: [
          {
            offset: 10,
            repeat: 80,
            symbol: L.Symbol.arrowHead({
              pixelSize: 15,
              pathOptions: { fillOpacity: 1, weight: 0 },
            }),
          },
        ],
      });
      decorator.addTo(map);

      return () => {
        map.removeLayer(decorator);
      };
    }
  }, [map, path]);

  return null;
};

const Map = () => {
  // Random default position
  const [currentPosition, setCurrentPosition] = useState([28.73, 77.098]);
  //   Store the path vehicle has moved
  const [path, setPath] = useState([]);
  //   Store the data fetched from the database
  const [vehicleRouteData, setVehicleRouteData] = useState([]);
  // Store angle of marker icon
  const [angle, setAngle] = useState(10);

  //  Custom Marker icon
  let customIcon = new L.DivIcon({
    html: `<img src="${markerIcon}" style="transform: rotate(${angle}deg); width: 40px; height: 40px;" />`,
    iconSize: [40, 40],
    className: '',
  });

  //   Calculate the degree of rotation marker should take
  const calculateAngle = (from, to) => {
    const lat1 = from[0];
    const lon1 = from[1];
    const lat2 = to[0];
    const lon2 = to[1];
    const dy = lat2 - lat1;
    const dx = Math.cos((Math.PI / 180) * lat1) * (lon2 - lon1);
    const theta = Math.atan2(dy, dx);
    let angle = ((theta * 180) / Math.PI + 360) % 360;
    angle = angle.toFixed(2) - 20;
    setAngle((prev) => prev - prev + angle);
  };

  //   Function to always focus map to current vehicle position
  const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng]);
    }, []);
    return null;
  };

  //   Fetch vehicle route path from backend and save it to local usestate variable
  const currentLocation = async () => {
    setVehicleRouteData([]);
    setPath([]);
    setCurrentPosition([28.73, 77.098]);
    const response = await api.get('/current_location');
    const { success, message } = response.data;
    if (success) {
      setVehicleRouteData(response.data.vehicle_data);
    } else {
      toast.error(message);
    }
  };

  //   Function to handle and calculate
  // -- Current location of vehicle
  // -- Send previous and current position(latitude, longitude) to calculate angle of marker
  useEffect(() => {
    async function delay() {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const updateLocation = async () => {
      for (let i = 0; i < vehicleRouteData.length; i++) {
        const route = vehicleRouteData[i];
        const newPosition = [route.latitude, route.longitude];
        if (i > 0) {
          const previousPosition = [
            vehicleRouteData[i - 1].latitude,
            vehicleRouteData[i - 1].longitude,
          ];
          calculateAngle(previousPosition, newPosition);
        }
        setCurrentPosition(newPosition);
        setPath((prevPath) => [...prevPath, newPosition]);
        await delay();
      }
    };
    updateLocation();
  }, [vehicleRouteData]);

  return (
    <>
      {/* Fetch vehicle data from backend */}
      <button onClick={currentLocation}>Get Route</button>

      <MapContainer
        center={currentPosition}
        zoom={16}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={currentPosition} icon={customIcon} />
        <Polyline positions={path} color="blue" />
        <PolylineDecorator path={path} />
        <RecenterAutomatically
          //   position={currentPosition}
          lat={currentPosition[0]}
          lng={currentPosition[1]}
        />
      </MapContainer>
    </>
  );
};

export default Map;
