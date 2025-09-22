import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { toFixed } from '@/utils';

type LocationSample = {
    location: Location.LocationObject;
    timestamp: number;
};

const useLocation = (
    calculatedSpeedSharedValue: SharedValue<number>,
    prefersMph: boolean,
    onSample?: (sample: LocationSample) => void
) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(
        null
    );
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const maxSpeed = useSharedValue(0);
    const locations = useSharedValue<LocationObject[]>([]);
    const speeds = useSharedValue<number[]>([]);

    const requestPermissions = async () => {
        // Request foreground location permission first
        const { status: foregroundStatus } =
            await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return false;
        }

        // Request background location permission separately (Android 10+ requirement)
        const { status: backgroundStatus } =
            await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
            setErrorMsg('Background location permission was denied');
            return false;
        }

        setStatus('granted');
        return true;
    };

    const listen = useCallback(async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const subscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 1, // Minimum distance (meters) to trigger an update
                timeInterval: 1000, // Minimum time (ms) to trigger an update
            },
            (location) => {
                setLocation(location);
                locations.value.push(location);
                if (location.coords.speed && location.coords.speed >= 0) {
                    speeds.value.push(location.coords.speed);
                    maxSpeed.value = Math.max(...speeds.value);
                    calculatedSpeedSharedValue.value = toFixed(
                        prefersMph
                            ? location.coords.speed * 2.23694 // Convert to mph
                            : location.coords.speed * 3.6,
                        0
                    ); // Convert to km/h
                } else if (
                    location.coords.speed &&
                    location.coords.speed <= 0
                ) {
                    calculatedSpeedSharedValue.value = 0;
                }
                onSample?.({ location, timestamp: Date.now() });
            }
        );

        return () => subscription.remove();
    }, [
        calculatedSpeedSharedValue,
        locations,
        maxSpeed,
        onSample,
        prefersMph,
        speeds,
    ]);

    return { listen, location, errorMsg, status, maxSpeed };
};

export default useLocation;
export type { LocationSample };
