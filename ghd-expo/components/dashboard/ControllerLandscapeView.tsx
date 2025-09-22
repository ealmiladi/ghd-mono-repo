import React, {
    memo,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import NumberTicker from '@/components/dashboard/NumberTicker';
import { Icon } from '@/components/ui/icon';
import { LucideLocateFixed, LucideBluetoothOff } from 'lucide-react-native';
import AnimatedBars from '@/components/dashboard/AnimatedAmps';
import BatteryBar from '@/components/dashboard/BatteryBar';
import Clock from '@/components/dashboard/Clock';
import { useTranslation } from 'react-i18next';
import { IS_SIMULATOR_MODE } from '@/utils/env';
import type { ControllerPortraitViewProps } from '@/components/dashboard/ControllerPortraitView';
import type { EdgeInsets } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';

type StatItem = {
    label: string;
    value: string;
    valueClassName?: string;
};

type Slide = {
    key: string;
    content: React.ReactNode;
    disablePadding?: boolean;
};

export type ControllerLandscapeViewProps = ControllerPortraitViewProps & {
    insets: EdgeInsets;
    rpmSharedValue: any;
    wattsSharedValue: any;
};

const ControllerLandscapeView = memo((props: ControllerLandscapeViewProps) => {
    const {
        controller,
        device,
        batteryVoltage,
        batterySoc,
        batteryColor,
        hasReceivedBatteryInformation,
        prefersMph,
        prefersFahrenheit,
        calculatedSpeedSharedValue,
        lineCurrent,
        phaseACurrent,
        phaseCCurrent,
        maxLineCurrent,
        maxPhaseCurrent,
        mosTemperatureCelcius,
        motorTemperatureCelcius,
        tripSummary,
        rpmSharedValue,
        wattsSharedValue,
        usesGpsSpeed,
        voltageSag,
        currentLocation,
        insets,
        isScanning,
    } = props;

    const { t } = useTranslation();
    const [barsWidth, setBarsWidth] = useState(400);
    const [leftSectionWidth, setLeftSectionWidth] = useState(0);
    const [rightSectionWidth, setRightSectionWidth] = useState(0);
    const [leftSlideIndex, setLeftSlideIndex] = useState(0);
    const [rightSlideIndex, setRightSlideIndex] = useState(0);
    const leftScrollRef = useRef<ScrollView | any>(null);
    const rightScrollRef = useRef<ScrollView | any>(null);
    const leftSnapInterval =
        leftSectionWidth > 0 ? leftSectionWidth : undefined;
    const rightSnapInterval =
        rightSectionWidth > 0 ? rightSectionWidth : undefined;
    const mapRef = useRef<MapView | null>(null);

    const isConnected = IS_SIMULATOR_MODE || !!device;
    const showBatteryInformation =
        hasReceivedBatteryInformation || (IS_SIMULATOR_MODE && isConnected);
    const displayedBatteryVoltage =
        batteryVoltage ?? (IS_SIMULATOR_MODE ? '72' : '--');
    const displayedBatterySoc = batterySoc ?? (IS_SIMULATOR_MODE ? '96' : '--');
    const effectiveBatteryColor = batteryColor ?? 'text-secondary-500';

    const safeVoltageSag = Number.isFinite(voltageSag) ? voltageSag : 0;
    const sagToneClass =
        safeVoltageSag > 7
            ? 'text-error-500'
            : safeVoltageSag > 4
              ? 'text-yellow-500'
              : 'text-secondary-600';
    const sagDisplay = `${safeVoltageSag.toFixed(1)}V`;
    const maxLineValue = parseInt(maxLineCurrent ?? '0', 10) || 1;
    const maxPhaseValue = parseInt(maxPhaseCurrent ?? '0', 10) || 1;

    const distanceUnit = prefersMph ? 'mi' : 'km';
    const speedUnit = prefersMph ? 'mph' : 'km/h';

    const summaryStats: StatItem[] = tripSummary
        ? [
              {
                  label: t('trip.stats.distance'),
                  value: `${tripSummary.distance} ${distanceUnit}`,
              },
              {
                  label: t(
                      'trip.stats.remainingDistance',
                      'Remaining Distance'
                  ),
                  value: `${tripSummary.remaining} ${distanceUnit}`,
              },
              {
                  label: t('trip.stats.voltageSag'),
                  value: sagDisplay,
                  valueClassName: sagToneClass,
              },
          ]
        : [];

    const gpsStats: StatItem[] =
        tripSummary && tripSummary.gpsSampleCount > 0
            ? [
                  {
                      label: t('trip.stats.maxSpeedGps'),
                      value: `${tripSummary.gpsMaxSpeed} ${speedUnit}`,
                  },
                  {
                      label: t('trip.stats.avgSpeedGps'),
                      value: `${tripSummary.gpsAvgSpeed} ${speedUnit}`,
                  },
              ]
            : [];

    const speedStats: StatItem[] = tripSummary
        ? [
              {
                  label: t('trip.stats.maxSpeedCalculated'),
                  value: `${tripSummary.maxSpeed} ${speedUnit}`,
              },
              {
                  label: t('trip.stats.avgSpeedCalculated'),
                  value: `${tripSummary.avgSpeed} ${speedUnit}`,
              },
              {
                  label: t('trip.stats.maxSpeedGps'),
                  value: `${tripSummary.gpsMaxSpeed} ${speedUnit}`,
              },
              {
                  label: t('trip.stats.avgSpeedGps'),
                  value: `${tripSummary.gpsAvgSpeed} ${speedUnit}`,
              },
          ]
        : [];

    const energyStats: StatItem[] = tripSummary
        ? [
              {
                  label: t('trip.stats.avgPower'),
                  value: `${tripSummary.avgPower}W`,
              },
              {
                  label: prefersMph ? 'Wh/mi' : 'Wh/km',
                  value: tripSummary.whPerUnit,
              },
              {
                  label: t('trip.stats.cumulativeEnergy'),
                  value: `${tripSummary.cumulativeEnergy}Wh`,
              },
          ]
        : [];

    const currentRegion = useMemo<Region | null>(() => {
        if (currentLocation) {
            return {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        if (IS_SIMULATOR_MODE) {
            return {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        return null;
    }, [currentLocation]);

    useEffect(() => {
        if (currentRegion && mapRef.current) {
            mapRef.current.animateToRegion(currentRegion, 0);
        }
    }, [currentRegion]);

    const showTemperatureSection =
        mosTemperatureCelcius !== undefined ||
        motorTemperatureCelcius !== undefined;

    const renderDotIndicators = (
        activeIndex: number,
        total: number,
        keyPrefix: string,
        onDotPress: (index: number) => void
    ) => (
        <HStack className="mt-4 items-center justify-center gap-5">
            {Array.from({ length: Math.max(total, 1) }).map((_, index) => (
                <Pressable
                    key={`${keyPrefix}-${index}`}
                    onPress={() => {
                        if (index !== activeIndex) {
                            onDotPress(index);
                        }
                    }}
                    hitSlop={12}
                >
                    <View
                        className={`rounded-full ${
                            index === activeIndex
                                ? 'bg-secondary-500'
                                : 'bg-secondary-500 opacity-25'
                        }`}
                        style={{
                            width: index === activeIndex ? 18 : 16,
                            height: index === activeIndex ? 18 : 16,
                        }}
                    />
                </Pressable>
            ))}
        </HStack>
    );

    const leftSlides = useMemo<Slide[]>(() => {
        if (!tripSummary) {
            return [
                {
                    key: 'no-trip',
                    content: (
                        <View className="flex-1 items-start justify-center">
                            <Text className="text-secondary-400">
                                {t('trip.noTripsFound')}
                            </Text>
                        </View>
                    ),
                },
            ];
        }

        return [
            {
                key: 'summary',
                content: (
                    <View className="gap-6">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t(
                                'trip.stats.tripOverviewHeading',
                                'Trip Overview'
                            )}
                        </Text>
                        <View className="gap-y-2">
                            {summaryStats.map((stat) => (
                                <HudStat
                                    key={stat.label}
                                    label={stat.label}
                                    value={stat.value}
                                    valueClassName={stat.valueClassName}
                                />
                            ))}
                            <HudClockStat
                                label={t('trip.stats.timeElapsed')}
                                startTime={tripSummary.startTime}
                            />
                        </View>
                        {!!gpsStats.length && (
                            <View className="gap-3">
                                <Text className="text-secondary-400 text-xs uppercase font-semibold">
                                    {t('trip.stats.gpsHeading', 'GPS')}
                                </Text>
                                <View className="gap-y-2">
                                    {gpsStats.map((stat) => (
                                        <HudStat
                                            key={stat.label}
                                            label={stat.label}
                                            value={stat.value}
                                            valueClassName={stat.valueClassName}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                ),
            },
            {
                key: 'speed-distance',
                content: (
                    <View className="gap-6">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t('trip.stats.speedAndDistance', 'Speed')}
                        </Text>
                        <View className="gap-y-2">
                            {speedStats.map((stat) => (
                                <HudStat
                                    key={stat.label}
                                    label={stat.label}
                                    value={stat.value}
                                    valueClassName={stat.valueClassName}
                                />
                            ))}
                        </View>
                    </View>
                ),
            },
        ];
    }, [gpsStats, speedStats, summaryStats, t, tripSummary]);

    const rightSlides = useMemo<Slide[]>(() => {
        const slides: Slide[] = [];

        if (currentRegion) {
            const isSimulatedLocation = !currentLocation && IS_SIMULATOR_MODE;
            slides.push({
                key: 'map',
                disablePadding: true,
                content: (
                    <View className="gap-4">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t(
                                'trip.stats.currentLocationHeading',
                                'Current Location'
                            )}
                        </Text>
                        <View
                            style={{
                                height: 280,
                                width: '100%',
                                borderRadius: 24,
                                overflow: 'hidden',
                            }}
                        >
                            <MapView
                                ref={mapRef}
                                style={{ flex: 1 }}
                                region={currentRegion}
                                showsUserLocation
                                pitchEnabled={false}
                                rotateEnabled={false}
                                scrollEnabled={false}
                                zoomEnabled={false}
                            >
                                <Marker
                                    coordinate={currentRegion}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View
                                        style={{
                                            height: 22,
                                            width: 22,
                                            borderRadius: 11,
                                            borderWidth: 3,
                                            borderColor: '#FFFFFF',
                                            backgroundColor: '#2563EB',
                                            shadowColor: '#2563EB',
                                            shadowOpacity: 0.35,
                                            shadowRadius: 6,
                                            shadowOffset: { width: 0, height: 2 },
                                        }}
                                    />
                                </Marker>
                            </MapView>
                        </View>
                        {isSimulatedLocation && (
                            <Text className="text-secondary-400 text-xs uppercase font-semibold">
                                {t(
                                    'trip.stats.simulatedLocation',
                                    'Simulated preview'
                                )}
                            </Text>
                        )}
                    </View>
                ),
            });
        }

        if (showTemperatureSection) {
            slides.push({
                key: 'temperatures',
                content: (
                    <View className="gap-6">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t(
                                'trip.stats.temperaturesHeading',
                                'Temperatures'
                            )}
                        </Text>
                        <HStack className="gap-10">
                            <HudTemperature
                                title={t(
                                    'trip.stats.controllerTemperature',
                                    'Controller'
                                )}
                                value={mosTemperatureCelcius}
                                prefersFahrenheit={prefersFahrenheit}
                            />
                            <HudTemperature
                                title={t('trip.stats.motorTemperature')}
                                value={motorTemperatureCelcius}
                                prefersFahrenheit={prefersFahrenheit}
                            />
                        </HStack>
                    </View>
                ),
            });
        }

        if (isConnected || IS_SIMULATOR_MODE) {
            slides.push({
                key: 'motor-output',
                content: (
                    <View className="gap-6">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t('trip.stats.motorOutputHeading', 'Motor Output')}
                        </Text>
                        <HStack className="gap-6">
                            <AnimatedValueStat
                                label={t('trip.stats.currentRpm', 'Motor RPM')}
                                unit="RPM"
                                sharedValue={rpmSharedValue}
                            />
                            <AnimatedValueStat
                                label={t(
                                    'trip.stats.inputPower',
                                    'Input Power'
                                )}
                                unit="W"
                                sharedValue={wattsSharedValue}
                            />
                        </HStack>
                    </View>
                ),
            });
        }

        if (tripSummary) {
            slides.push({
                key: 'performance',
                content: (
                    <View className="gap-6">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t('trip.stats.performanceHeading', 'Performance')}
                        </Text>
                        <View className="gap-y-2">
                            {speedStats.map((stat) => (
                                <HudStat
                                    key={stat.label}
                                    label={stat.label}
                                    value={stat.value}
                                    valueClassName={stat.valueClassName}
                                />
                            ))}
                            <HudClockStat
                                label={t('trip.stats.timeElapsed')}
                                startTime={tripSummary.startTime}
                            />
                        </View>
                    </View>
                ),
            });

            slides.push({
                key: 'power',
                content: (
                    <View className="gap-6">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t(
                                'trip.stats.powerHeading',
                                'Power & Consumption'
                            )}
                        </Text>
                        <View className="gap-y-2">
                            {energyStats.map((stat) => (
                                <HudStat
                                    key={stat.label}
                                    label={stat.label}
                                    value={stat.value}
                                    valueClassName={stat.valueClassName}
                                />
                            ))}
                        </View>
                    </View>
                ),
            });
        }

        if (!slides.length) {
            slides.push({
                key: 'no-trip-right',
                content: (
                    <View className="flex-1 items-start justify-center">
                        <Text className="text-secondary-400">
                            {t('trip.noTripsFound')}
                        </Text>
                    </View>
                ),
            });
        }

        return slides;
    }, [
        energyStats,
        currentRegion,
        mosTemperatureCelcius,
        motorTemperatureCelcius,
        prefersFahrenheit,
        showTemperatureSection,
        rpmSharedValue,
        wattsSharedValue,
        isConnected,
        speedStats,
        t,
        tripSummary,
    ]);

    useEffect(() => {
        if (currentRegion && mapRef.current) {
            mapRef.current.animateToRegion(currentRegion, 0);
        }
    }, [currentRegion]);

    useEffect(() => {
        if (!leftScrollRef.current || !leftSectionWidth) {
            return;
        }
        leftScrollRef.current?.scrollTo({
            x: leftSlideIndex * leftSectionWidth,
            y: 0,
            animated: true,
        });
    }, [leftSlideIndex, leftSectionWidth]);

    useEffect(() => {
        if (!rightScrollRef.current || !rightSectionWidth) {
            return;
        }
        rightScrollRef.current?.scrollTo({
            x: rightSlideIndex * rightSectionWidth,
            y: 0,
            animated: true,
        });
    }, [rightSlideIndex, rightSectionWidth]);

    if (!isConnected) {
        return (
            <View
                className="flex-1 items-center justify-center gap-5 px-8"
                style={{
                    paddingLeft: insets.left + 32,
                    paddingRight: insets.right + 32,
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom + 16,
                }}
            >
                <View className="h-24 w-24 items-center justify-center rounded-full bg-secondary-500/10">
                    <Icon
                        as={LucideBluetoothOff}
                        size={48}
                        className="text-secondary-500"
                    />
                </View>
                <Text className="text-secondary-500 text-3xl font-bold text-center">
                    {controller.name}
                </Text>
                <Text className="text-secondary-400 text-lg font-semibold text-center">
                    {isScanning
                        ? t('common.searching')
                        : t('common.disconnected')}
                </Text>
                <Text
                    className="text-secondary-400 text-sm text-center"
                    style={{ maxWidth: 320 }}
                >
                    {t(
                        'common.connectToStart',
                        'Connect to this controller to see live telemetry.'
                    )}
                </Text>
            </View>
        );
    }

    // Mirrors the portrait HUD content while arranging it across a wider canvas.
    return (
        <View
            className="flex-1 px-8 py-6"
            style={{
                paddingLeft: insets.left + 32,
                paddingRight: insets.right + 32,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
            }}
        >
            <HStack className="flex-1 gap-4">
                <View
                    className="flex-1"
                    style={{ flexBasis: 0, flexGrow: 1.35 }}
                    onLayout={(event) =>
                        setLeftSectionWidth(event.nativeEvent.layout.width)
                    }
                >
                    <ScrollView
                        horizontal
                        pagingEnabled
                        snapToInterval={leftSnapInterval}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        scrollViewRef={leftScrollRef}
                        onMomentumScrollEnd={(event) => {
                            if (!leftSectionWidth) {
                                return;
                            }
                            const index = Math.round(
                                event.nativeEvent.contentOffset.x /
                                    Math.max(leftSectionWidth, 1)
                            );
                            setLeftSlideIndex(
                                Math.min(index, leftSlides.length - 1)
                            );
                        }}
                    >
                        {leftSlides.map((slide) => (
                            <View
                                key={slide.key}
                                style={{
                                    width: leftSectionWidth || undefined,
                                }}
                            >
                                <View style={{ paddingRight: 24 }}>
                                    {slide.content}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    {renderDotIndicators(
                        leftSlideIndex,
                        leftSlides.length,
                        'left',
                        (index) => {
                            const nextIndex = Math.max(
                                0,
                                Math.min(index, leftSlides.length - 1)
                            );
                            setLeftSlideIndex(nextIndex);
                        }
                    )}
                </View>

                <View
                    className="items-center"
                    style={{ width: 320, flexShrink: 0 }}
                >
                    <NumberTicker
                        hideWhenZero={false}
                        sharedValue={calculatedSpeedSharedValue}
                        fontSize={128}
                        width={320}
                    />
                    <HStack className="items-center mt-2 gap-2">
                        {usesGpsSpeed && (
                            <Icon
                                size={24}
                                as={LucideLocateFixed}
                                className="text-secondary-500"
                            />
                        )}
                        <Text className="text-secondary-500 text-2xl font-bold">
                            {prefersMph ? 'MPH' : 'KPH'}
                        </Text>
                    </HStack>

                    <View className="w-full mt-6">
                        {showBatteryInformation ? (
                            <HStack className="items-center gap-4">
                                <View className="flex-1">
                                    <BatteryBar
                                        height={24}
                                        socPercentage={parseInt(
                                            displayedBatterySoc,
                                            10
                                        )}
                                    />
                                </View>
                                <Text
                                    className={`${effectiveBatteryColor} text-2xl font-bold`}
                                >
                                    {displayedBatteryVoltage}V
                                </Text>
                            </HStack>
                        ) : (
                            <Text className="text-secondary-400 text-center">
                                {t('trip.stats.energyConsumed')}: --
                            </Text>
                        )}
                    </View>

                    <View
                        className="w-full mt-4"
                        onLayout={(event) => {
                            setBarsWidth(event.nativeEvent.layout.width);
                        }}
                    >
                        <AnimatedBars
                            width={barsWidth}
                            lineCurrent={lineCurrent}
                            phaseA={phaseACurrent}
                            phaseC={phaseCCurrent}
                            maxLine={maxLineValue}
                            maxPhase={maxPhaseValue}
                        />
                    </View>
                </View>

                <View
                    className="flex-1"
                    style={{ flexBasis: 0, flexGrow: 1.35 }}
                    onLayout={(event) =>
                        setRightSectionWidth(event.nativeEvent.layout.width)
                    }
                >
                    <ScrollView
                        horizontal
                        pagingEnabled
                        snapToInterval={rightSnapInterval}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        scrollViewRef={rightScrollRef}
                        onMomentumScrollEnd={(event) => {
                            if (!rightSectionWidth) {
                                return;
                            }
                            const index = Math.round(
                                event.nativeEvent.contentOffset.x /
                                    Math.max(rightSectionWidth, 1)
                            );
                            setRightSlideIndex(
                                Math.min(index, rightSlides.length - 1)
                            );
                        }}
                    >
                        {rightSlides.map((slide) => (
                            <View
                                key={slide.key}
                                style={{
                                    width: rightSectionWidth || undefined,
                                }}
                            >
                                <View style={{ paddingRight: 24 }}>
                                    {slide.content}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    {renderDotIndicators(
                        rightSlideIndex,
                        rightSlides.length,
                        'right',
                        (index) => {
                            const nextIndex = Math.max(
                                0,
                                Math.min(index, rightSlides.length - 1)
                            );
                            setRightSlideIndex(nextIndex);
                        }
                    )}
                </View>
            </HStack>
        </View>
    );
});

ControllerLandscapeView.displayName = 'ControllerLandscapeView';

const HudStat = ({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) => (
    <View className="w-full">
        <Text className="text-secondary-500 text-xs uppercase font-semibold">
            {label}
        </Text>
        <Text
            className={`text-secondary-600 text-xl font-bold ${
                valueClassName ?? ''
            }`}
        >
            {value}
        </Text>
    </View>
);

const HudClockStat = ({
    label,
    startTime,
}: {
    label: string;
    startTime: number;
}) => (
    <View className="w-full">
        <Text className="text-secondary-500 text-xs uppercase font-semibold">
            {label}
        </Text>
        <Clock
            startTime={startTime}
            className="text-secondary-600 text-xl font-bold"
        />
    </View>
);

const HudTemperature = ({
    title,
    value,
    prefersFahrenheit,
}: {
    title: string;
    value: number | undefined;
    prefersFahrenheit: boolean;
}) => {
    if (value === undefined) {
        return null;
    }
    const converted = prefersFahrenheit ? value * 1.8 + 32 : value;
    const unit = prefersFahrenheit ? '°F' : '°C';
    const color =
        value < 60
            ? 'text-green-500'
            : value < 80
              ? 'text-yellow-500'
              : 'text-red-500';

    return (
        <View className="items-start">
            <Text className="text-secondary-500 text-xs uppercase font-semibold">
                {title}
            </Text>
            <Text className={`text-3xl font-bold ${color}`}>
                {converted.toFixed(0)}
                {unit}
            </Text>
        </View>
    );
};

const AnimatedValueStat = ({
    label,
    unit,
    sharedValue,
}: {
    label: string;
    unit: string;
    sharedValue: any;
}) => (
    <View className="flex-1">
        <Text className="text-secondary-500 text-xs uppercase font-semibold">
            {label}
        </Text>
        <HStack className="items-end gap-2">
            <NumberTicker
                sharedValue={sharedValue}
                hideWhenZero={false}
                fontSize={64}
                width={180}
            />
            <Text className="text-secondary-400 text-lg font-semibold">
                {unit}
            </Text>
        </HStack>
    </View>
);

export default ControllerLandscapeView;
