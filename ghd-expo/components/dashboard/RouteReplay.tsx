import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { LucidePause, LucidePlay } from 'lucide-react-native';
import { RoutePoint } from '@/fardriver/interfaces/ControllerState';
import { toFixed } from '@/utils';
import { DateTime } from 'luxon';

interface RouteReplayProps {
    route: RoutePoint[];
    prefersMph: boolean;
    prefersFahrenheit: boolean;
}

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 } as const;

const RouteReplay = ({
    route,
    prefersMph,
    prefersFahrenheit,
}: RouteReplayProps) => {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const mapRef = useRef<MapView | null>(null);

    const sanitizedRoute = useMemo(() => {
        if (!route?.length) {
            return [] as RoutePoint[];
        }
        return route.filter(
            (point) =>
                typeof point.latitude === 'number' &&
                typeof point.longitude === 'number'
        );
    }, [route]);

    const mapRegion = useMemo(() => {
        if (!sanitizedRoute.length) {
            return null;
        }
        if (sanitizedRoute.length === 1) {
            const { latitude, longitude } = sanitizedRoute[0];
            return {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        const latitudes = sanitizedRoute.map((point) => point.latitude);
        const longitudes = sanitizedRoute.map((point) => point.longitude);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);

        const latitude = (minLat + maxLat) / 2;
        const longitude = (minLon + maxLon) / 2;
        const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 0.01);
        const longitudeDelta = Math.max((maxLon - minLon) * 1.4, 0.01);

        return { latitude, longitude, latitudeDelta, longitudeDelta };
    }, [sanitizedRoute]);

    useEffect(() => {
        setActiveIndex(0);
        setIsPlaying(false);
    }, [sanitizedRoute]);

    useEffect(() => {
        if (sanitizedRoute.length <= 1) {
            return;
        }
        mapRef.current?.fitToCoordinates(
            sanitizedRoute.map(({ latitude, longitude }) => ({
                latitude,
                longitude,
            })),
            {
                edgePadding: EDGE_PADDING,
                animated: false,
            }
        );
    }, [sanitizedRoute]);

    useEffect(() => {
        if (!isPlaying || sanitizedRoute.length <= 1) {
            return;
        }

        const interval = setInterval(() => {
            setActiveIndex((prev) => {
                if (prev >= sanitizedRoute.length - 1) {
                    clearInterval(interval);
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 750);

        return () => clearInterval(interval);
    }, [isPlaying, sanitizedRoute.length]);

    const coordinates = useMemo(
        () =>
            sanitizedRoute.map(({ latitude, longitude }) => ({
                latitude,
                longitude,
            })),
        [sanitizedRoute]
    );

    const currentPoint = sanitizedRoute[activeIndex];

    const hasSpeed =
        currentPoint?.speedMps !== null && currentPoint?.speedMps !== undefined;
    const formattedSpeed = hasSpeed
        ? `${toFixed(
              prefersMph
                  ? Number(currentPoint.speedMps) * 2.23694
                  : Number(currentPoint.speedMps) * 3.6,
              1
          )} ${prefersMph ? 'mph' : 'km/h'}`
        : '—';

    const formattedVoltage =
        currentPoint?.voltage !== null && currentPoint?.voltage !== undefined
            ? `${toFixed(Number(currentPoint.voltage), 1)} V`
            : '—';

    const formattedCurrent =
        currentPoint?.lineCurrent !== null &&
        currentPoint?.lineCurrent !== undefined
            ? `${toFixed(Number(currentPoint.lineCurrent), 1)} A`
            : '—';

    const formattedPower =
        currentPoint?.inputPower !== null &&
        currentPoint?.inputPower !== undefined
            ? `${toFixed(Number(currentPoint.inputPower), 0)} W`
            : '—';

    const formattedTemps = () => {
        const mos =
            currentPoint?.mosTemperature !== null &&
            currentPoint?.mosTemperature !== undefined
                ? prefersFahrenheit
                    ? `${toFixed(
                          Number(currentPoint.mosTemperature) * 1.8 + 32,
                          0
                      )}°F`
                    : `${toFixed(Number(currentPoint.mosTemperature), 0)}°C`
                : '—';
        const motor =
            currentPoint?.motorTemperature !== null &&
            currentPoint?.motorTemperature !== undefined
                ? prefersFahrenheit
                    ? `${toFixed(
                          Number(currentPoint.motorTemperature) * 1.8 + 32,
                          0
                      )}°F`
                    : `${toFixed(Number(currentPoint.motorTemperature), 0)}°C`
                : '—';
        return `${t('trip.routeReplay.mosTemp')}: ${mos} · ${t(
            'trip.routeReplay.motorTemp'
        )}: ${motor}`;
    };

    const timestampLabel = currentPoint
        ? DateTime.fromMillis(
              Number(currentPoint.timestamp || 0)
          ).toLocaleString(DateTime.TIME_WITH_SECONDS)
        : '—';

    if (!sanitizedRoute.length) {
        return (
            <View className="bg-secondary-100 rounded-xl p-4 mb-6">
                <Heading className="text-xl mb-2">
                    {t('trip.routeReplay.title')}
                </Heading>
                <Text className="text-secondary-500">
                    {t('trip.routeReplay.noData')}
                </Text>
            </View>
        );
    }

    return (
        <View className="bg-secondary-100 rounded-xl p-4 mb-6">
            <Heading className="text-xl mb-3">
                {t('trip.routeReplay.title')}
            </Heading>
            <View
                className="overflow-hidden rounded-xl"
                style={{ height: 240 }}
            >
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    showsUserLocation={false}
                    toolbarEnabled={false}
                    initialRegion={mapRegion ?? undefined}
                >
                    {coordinates.length > 1 && (
                        <Polyline
                            coordinates={coordinates}
                            strokeColor="#2563eb"
                            strokeWidth={4}
                        />
                    )}
                    {currentPoint && (
                        <Marker
                            coordinate={{
                                latitude: currentPoint.latitude,
                                longitude: currentPoint.longitude,
                            }}
                        />
                    )}
                </MapView>
            </View>

            <View className="flex-row items-center justify-between mt-4">
                <Button
                    variant="solid"
                    action="primary"
                    size="sm"
                    disabled={sanitizedRoute.length <= 1}
                    onPress={() => {
                        if (sanitizedRoute.length <= 1) {
                            return;
                        }
                        setIsPlaying((prev) => !prev);
                    }}
                >
                    <Icon
                        as={isPlaying ? LucidePause : LucidePlay}
                        size={20}
                        className="text-secondary-50 mr-2"
                    />
                    <ButtonText>
                        {isPlaying
                            ? t('trip.routeReplay.pause')
                            : t('trip.routeReplay.play')}
                    </ButtonText>
                </Button>
                <View className="flex-1 ml-4">
                    {/**
                     * When there is only one sample we still render the slider for consistency,
                     * but keep it disabled to avoid confusing interactions.
                     */}
                    <Slider
                        minimumValue={0}
                        maximumValue={Math.max(sanitizedRoute.length - 1, 0)}
                        step={1}
                        value={activeIndex}
                        onValueChange={(value) => {
                            const clampedIndex = Math.min(
                                Math.max(Math.round(value), 0),
                                Math.max(sanitizedRoute.length - 1, 0)
                            );
                            setActiveIndex(clampedIndex);
                            setIsPlaying(false);
                        }}
                        disabled={sanitizedRoute.length <= 1}
                        minimumTrackTintColor="#2563eb"
                        maximumTrackTintColor="#cbd5f5"
                        thumbTintColor="#2563eb"
                    />
                    <Text className="text-secondary-500 mt-1 text-right">
                        {timestampLabel}
                    </Text>
                </View>
            </View>

            <View className="mt-4 gap-1">
                <Text className="text-secondary-600 font-semibold">
                    {t('trip.routeReplay.speed', { value: formattedSpeed })}
                </Text>
                <Text className="text-secondary-600 font-semibold">
                    {t('trip.routeReplay.voltage', { value: formattedVoltage })}
                </Text>
                <Text className="text-secondary-600 font-semibold">
                    {t('trip.routeReplay.current', { value: formattedCurrent })}
                </Text>
                <Text className="text-secondary-600 font-semibold">
                    {t('trip.routeReplay.power', { value: formattedPower })}
                </Text>
                <Text className="text-secondary-500">{formattedTemps()}</Text>
            </View>
        </View>
    );
};

export default RouteReplay;
