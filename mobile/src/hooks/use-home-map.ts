import { useEffect, useRef, useState } from 'react';

import * as Location from 'expo-location';
import type MapView from 'react-native-maps';
import type { LatLng, MapPressEvent, Region } from 'react-native-maps';

export type DestinationOption = {
  id: string;
  label: string;
  subtitle: string;
  coordinate: LatLng;
};

const BENGALURU_FALLBACK_COORDINATE: LatLng = {
  latitude: 12.9716,
  longitude: 77.5946,
};

const DESTINATIONS: DestinationOption[] = [
  {
    id: 'silk-board',
    label: 'Silk Board',
    subtitle: 'High traffic interchange',
    coordinate: { latitude: 12.9175, longitude: 77.6233 },
  },
  {
    id: 'whitefield',
    label: 'Whitefield',
    subtitle: 'IT corridor and office rush',
    coordinate: { latitude: 12.9698, longitude: 77.7500 },
  },
  {
    id: 'hebbal',
    label: 'Hebbal',
    subtitle: 'North Bangalore junction',
    coordinate: { latitude: 13.0354, longitude: 77.5963 },
  },
  {
    id: 'electronic-city',
    label: 'Electronic City',
    subtitle: 'South Bangalore business zone',
    coordinate: { latitude: 12.8456, longitude: 77.6603 },
  },
];

export function useHomeMap() {
  const mapRef = useRef<MapView | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<DestinationOption | null>(DESTINATIONS[0]);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function requestLocation() {
      try {
        setIsLoadingLocation(true);
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!mounted) {
          return;
        }

        if (permission.status !== 'granted') {
          setLocationPermissionGranted(false);
          setErrorMessage('Location permission is required to show your current position.');
          setCurrentLocation(null);
          return;
        }

        setLocationPermissionGranted(true);
        setErrorMessage(null);

        const latestLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        if (!mounted) {
          return;
        }

        setCurrentLocation({
          latitude: latestLocation.coords.latitude,
          longitude: latestLocation.coords.longitude,
        });
      } catch {
        if (mounted) {
          setErrorMessage('Unable to fetch your current location right now.');
          setCurrentLocation(null);
        }
      } finally {
        if (mounted) {
          setIsLoadingLocation(false);
        }
      }
    }

    requestLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentLocation) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...currentLocation,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      800,
    );
  }, [currentLocation]);

  const initialRegion: Region = {
    ...currentLocation,
    latitude: currentLocation?.latitude ?? BENGALURU_FALLBACK_COORDINATE.latitude,
    longitude: currentLocation?.longitude ?? BENGALURU_FALLBACK_COORDINATE.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  function handleMapPress(event: MapPressEvent) {
    setDestination({
      id: 'custom-destination',
      label: 'Pinned destination',
      subtitle: 'Selected from the map',
      coordinate: event.nativeEvent.coordinate,
    });
  }

  function selectDestination(option: DestinationOption) {
    setDestination(option);
    mapRef.current?.animateToRegion(
      {
        ...option.coordinate,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      800,
    );
  }

  function recenterMap() {
    const anchor = currentLocation ?? BENGALURU_FALLBACK_COORDINATE;
    mapRef.current?.animateToRegion(
      {
        ...anchor,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      800,
    );
  }

  return {
    DESTINATIONS,
    currentLocation,
    destination,
    errorMessage,
    initialRegion,
    isLoadingLocation,
    locationPermissionGranted,
    mapRef,
    recenterMap,
    selectDestination,
    handleMapPress,
  };
}
