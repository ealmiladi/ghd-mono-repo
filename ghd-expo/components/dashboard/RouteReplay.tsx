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
import NumberTicker from '@/components/dashboard/NumberTicker';
import { useSharedValue, withTiming } from 'react-native-reanimated';

interface RouteReplayProps {
    route: RoutePoint[];
    prefersMph: boolean;
    prefersFahrenheit: boolean;
    maxVoltageSag?: number;
    maxLineCurrent?: number;
    maxInputPower?: number;
    maxRPM?: number;
}

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 } as const;

const RouteReplay = ({
    route,
    prefersMph,
    prefersFahrenheit,
    maxVoltageSag,
    maxLineCurrent,
    maxInputPower,
    maxRPM,
}: RouteReplayProps) => {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const mapRef = useRef<MapView | null>(null);
    const speedSharedValue = useSharedValue(0);

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

    const computeSpeed = (point?: RoutePoint | null) => {
        if (!point || point.speedMps === null || point.speedMps === undefined) {
            return 0;
        }
        const baseSpeed = Number(point.speedMps);
        const converted = prefersMph ? baseSpeed * 2.23694 : baseSpeed * 3.6;
        return Math.max(converted, 0);
    };

    useEffect(() => {
        setActiveIndex(0);
        setIsPlaying(false);
        const initialPoint = sanitizedRoute[0];
        speedSharedValue.value = computeSpeed(initialPoint);
    }, [sanitizedRoute, prefersMph, speedSharedValue]);

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

    useEffect(() => {
        const nextSpeed = computeSpeed(currentPoint);
        speedSharedValue.value = withTiming(Math.round(nextSpeed), {
            duration: 250,
        });
    }, [currentPoint, prefersMph, speedSharedValue]);

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

    const sagToneClass = useMemo(() => {
        if (maxVoltageSag === undefined || maxVoltageSag === null) {
            return 'text-secondary-500';
        }
        if (maxVoltageSag > 7) {
            return 'text-error-500';
        }
        if (maxVoltageSag > 4) {
            return 'text-yellow-500';
        }
        return 'text-secondary-500';
    }, [maxVoltageSag]);

    const summaryChips = useMemo(
        () => [
            {
                label: t('trip.routeReplay.maxSag', 'Peak Sag'),
                value:
                    maxVoltageSag !== undefined && maxVoltageSag !== null
                        ? `${toFixed(maxVoltageSag, 1)} V`
                        : '—',
                tone: sagToneClass,
            },
            {
                label: t('trip.routeReplay.maxPower', 'Max Power'),
                value:
                    maxInputPower !== undefined && maxInputPower !== null
                        ? `${toFixed(maxInputPower, 0)} W`
                        : '—',
            },
            {
                label: t('trip.routeReplay.maxCurrent', 'Max Current'),
                value:
                    maxLineCurrent !== undefined && maxLineCurrent !== null
                        ? `${toFixed(maxLineCurrent, 0)} A`
                        : '—',
            },
            {
                label: t('trip.routeReplay.maxRpm', 'Max RPM'),
                value:
                    maxRPM !== undefined && maxRPM !== null
                        ? `${toFixed(maxRPM, 0)}`
                        : '—',
            },
        ],
        [
            maxInputPower,
            maxLineCurrent,
            maxRPM,
            maxVoltageSag,
            sagToneClass,
            t,
        ]
    );

    const detailCards = useMemo(
        () => [
            {
                label: t('trip.routeReplay.voltageLabel', 'Voltage'),
                value: formattedVoltage,
            },
            {
                label: t('trip.routeReplay.currentLabel', 'Line Current'),
                value: formattedCurrent,
            },
            {
                label: t('trip.routeReplay.powerLabel', 'Power'),
                value: formattedPower,
            },
            {
                label: t('trip.routeReplay.temperatureLabel', 'Temps'),
                value: formattedTemps(),
            },
        ],
        [formattedCurrent, formattedPower, formattedVoltage, formattedTemps, t]
    );

    if (!sanitizedRoute.length) {
        return (
            <View className="bg-secondary-100 rounded-3xl p-4 mb-6">
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
        <View className="bg-secondary-100 rounded-3xl p-4 mb-6">
            <Heading className="text-xl font-semibold mb-3">
                {t('trip.routeReplay.title')}
            </Heading>
            <View className="overflow-hidden rounded-3xl" style={{ height: 280 }}>
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

                <View className="absolute left-4 right-4 top-4">
                    <View className="rounded-3xl bg-background-0/90 px-4 py-3">
                        <View className="items-center">
                            <NumberTicker
                                hideWhenZero={false}
                                sharedValue={speedSharedValue}
                                fontSize={56}
                                width={220}
                            />
                            <Text className="text-secondary-500 text-sm font-semibold">
                                {prefersMph ? 'MPH' : 'KM/H'}
                            </Text>
                        </View>
                        <View className="mt-3 flex-row flex-wrap gap-3">
                            {summaryChips.map((chip) => (
                                <View
                                    key={chip.label}
                                    className="rounded-2xl bg-secondary-200 px-3 py-2"
                                >
                                    <Text className="text-secondary-400 text-xs uppercase font-semibold">
                                        {chip.label}
                                    </Text>
                                    <Text
                                        className={`text-lg font-bold ${
                                            chip.tone ?? 'text-secondary-600'
                                        }`}
                                    >
                                        {chip.value}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
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

            <View className="mt-4 flex-row flex-wrap gap-3">
                {detailCards.map((card) => (
                    <View
                        key={card.label}
                        className="rounded-2xl bg-secondary-200 px-3 py-2"
                        style={{ width: '48%' }}
                    >
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {card.label}
                        </Text>
                        <Text className="text-secondary-600 text-lg font-bold">
                            {card.value}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default RouteReplay;
