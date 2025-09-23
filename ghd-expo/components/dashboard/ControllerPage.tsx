import { Controller } from '@/interfaces/Controller';
import { Linking, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
    FadeIn,
    FadeOut,
    Layout,
    interpolateColor,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import BatteryBar from '@/components/dashboard/BatteryBar';
import AnimatedBike from './AnimatedBike';
import NumberTicker from '@/components/dashboard/NumberTicker';
import ControllerHeaderInformation from '@/components/dashboard/ControllerHeaderInformation';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/providers/UserContextProvider';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ControllerLandscapeView from '@/components/dashboard/ControllerLandscapeView';
import GearPortion from '@/components/dashboard/GearPortion';
import { Button, ButtonText } from '@/components/ui/button';
import { useColorScheme } from 'react-native';
import {
    LucideLocateFixed,
    LucideMaximize2,
    LucideRoute,
    LucideSettings,
    LucideX,
} from 'lucide-react-native';
import FullscreenHud from '@/components/dashboard/FullscreenHud';
import useControllerTelemetry from '@/hooks/useControllerTelemetry';
import useControllerOrientation from '@/hooks/useControllerOrientation';
import useControllerAnimations from '@/hooks/useControllerAnimations';
import { toFixed } from '@/utils';
import AlertDialog from '@/components/dashboard/AlertDialog';
import ControllerFault from '@/components/dashboard/ControllerFault';
import { Heading } from '@/components/ui/heading';

const AnimatedScrollView = Animated.ScrollView;
const AnimatedCard = Animated.createAnimatedComponent(View);

const HERO_FADE_DISTANCE = 320;
const BUSINESS_EMAIL = 'ealmiladi@gmail.com';

const ControllerPage = ({ controller }: { controller: Controller }) => {
    const insets = useSafeAreaInsets();
    const paddingTop = HERO_FADE_DISTANCE;
    const { prefersMph, prefersFahrenheit, unbindController } = useUser();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isLandscape = useControllerOrientation();
    const navigation: any = useNavigation();

    const {
        device,
        deviceLoadingStates,
        isScanning,
        controllerFaults,
        currentTrip,
        hasReceivedBatteryInformation,
        batteryVoltage,
        batterySoc,
        batteryColor,
        voltageSag,
        currentGear,
        currentGearPower,
        motorTemperatureCelcius,
        mosTemperatureCelcius,
        maxLineCurrent,
        maxPhaseCurrent,
        lineCurrent,
        phaseACurrent,
        phaseCCurrent,
        calculatedSpeedSharedValue,
        rpmSharedValue,
        maxSpeedInRPM,
        wattsSharedValue,
        polePairsSharedValue,
        motorCutoffApplied,
        tripSummary,
        currentLocation,
        endCurrentTrip,
        isEndingTrip,
    } = useControllerTelemetry({
        controller,
        prefersMph,
        translate: t,
        isLandscape,
    });

    const {
        scrollPosition,
        animatedView,
        animatedBikeOpacity,
        animatedMphStyle,
    } = useControllerAnimations({
        paddingTop,
        device,
        rpmSharedValue,
        isLandscape,
    });

    const [isHudVisible, setHudVisible] = useState(false);
    const [isUnbindModalOpen, setUnbindModalOpen] = useState(false);
    const [tripElapsed, setTripElapsed] = useState<string | null>(null);

    const openHud = useCallback(() => setHudVisible(true), []);
    const closeHud = useCallback(() => setHudVisible(false), []);

    const handleEndTrip = useCallback(async () => {
        await endCurrentTrip({ onSuccess: closeHud });
    }, [endCurrentTrip, closeHud]);

    const onUnboundConfirmed = useCallback(async () => {
        try {
            if (device) {
                await device.cancelConnection();
            }
            await unbindController(controller.serialNumber);
            setUnbindModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    }, [controller.serialNumber, device, unbindController]);

    const onScroll = useAnimatedScrollHandler(
        (event) => {
            const y = event.contentOffset.y;
            if (y > 0) {
                scrollPosition.value = y;
            }
        },
        [scrollPosition]
    );

    const heroCardClass =
        'rounded-3xl bg-secondary-100 px-6 py-6 border border-secondary-200/60 shadow-soft-1';
    const cardHeadingClass = 'text-secondary-900';
    const cardBodyTextClass = 'text-secondary-500';
    const cardClass =
        'rounded-3xl bg-secondary-100 px-5 py-6 border border-secondary-200/60 shadow-soft-1';
    const sectionHeadingClass = 'text-secondary-900 text-xl font-semibold';
    const sectionSubtitleClass = 'text-secondary-500 mt-1';
    const statLabelClass = 'text-secondary-400 text-xs uppercase font-semibold';
    const statValueClass = 'text-secondary-600 text-lg font-bold';

    const showHeroTelemetry = hasReceivedBatteryInformation;

    const statusText = useMemo(() => {
        if (controllerFaults.length) {
            return t('common.faultDetected');
        }
        if (device && hasReceivedBatteryInformation) {
            return '';
        }
        if (device && !hasReceivedBatteryInformation) {
            return t(
                'controller.hero.initializingTelemetry',
                'Initializing telemetry…'
            );
        }
        if (deviceLoadingStates[controller.localName]) {
            return t('common.connecting');
        }
        if (isScanning) {
            return t('common.searching');
        }
        return t('common.noConnection');
    }, [
        controllerFaults.length,
        controller.localName,
        device,
        deviceLoadingStates,
        hasReceivedBatteryInformation,
        isScanning,
        t,
    ]);

    const statusTone = controllerFaults.length
        ? 'text-error-500'
        : 'text-secondary-500';

    const formatTemperature = useCallback(
        (value?: number | null) => {
            if (value === undefined || value === null) {
                return '—';
            }
            if (prefersFahrenheit) {
                return `${toFixed(value * 1.8 + 32, 0)}°F`;
            }
            return `${toFixed(value, 0)}°C`;
        },
        [prefersFahrenheit]
    );

    const toNumeric = useCallback((value: any) => {
        if (value === null || value === undefined) {
            return null;
        }
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return Number.isNaN(parsed) ? null : parsed;
        }
        if (typeof value?.toNumber === 'function') {
            try {
                return value.toNumber();
            } catch (error) {
                console.warn('Failed to convert value via toNumber', error);
                return null;
            }
        }
        const coerced = Number(value);
        return Number.isNaN(coerced) ? null : coerced;
    }, []);

    const rawTripMetrics = (controller as any)?.tripMetrics ?? null;
    const totalDistanceMeters = useMemo(() => {
        const metricsDistanceMeters = toNumeric(
            rawTripMetrics?.totalDistanceMeters
        );
        if (metricsDistanceMeters !== null) {
            return metricsDistanceMeters;
        }

        const metricsDistanceKilometers = toNumeric(
            rawTripMetrics?.totalDistanceKilometers
        );
        if (metricsDistanceKilometers !== null) {
            return metricsDistanceKilometers * 1000;
        }

        const metricsDistanceMiles = toNumeric(
            rawTripMetrics?.totalDistanceMiles
        );
        if (metricsDistanceMiles !== null) {
            return metricsDistanceMiles * 1609.34;
        }

        const odometerMeters = toNumeric((controller as any)?.odometerInMeters);
        if (odometerMeters !== null) {
            return odometerMeters;
        }

        const odometerValue = toNumeric((controller as any)?.odometer);
        if (odometerValue !== null) {
            return odometerValue;
        }

        const fardriverMeters = toNumeric(controller.fardriverOdometer);
        if (fardriverMeters !== null) {
            return fardriverMeters;
        }

        return 0;
    }, [controller.fardriverOdometer, controller, rawTripMetrics, toNumeric]);

    const totalDistanceValue = toFixed(
        totalDistanceMeters * (prefersMph ? 0.000621371 : 0.001),
        0
    );
    const totalDistanceDisplay = `${totalDistanceValue} ${
        prefersMph ? t('common.miles') : t('common.kilometers')
    }`;

    useEffect(() => {
        if (!currentTrip) {
            setTripElapsed(null);
            return;
        }

        const computeElapsed = () => {
            const start = toNumeric((currentTrip as any)?.startTime) ?? 0;
            if (!start) {
                setTripElapsed(null);
                return;
            }

            const endRaw = (currentTrip as any)?.endTime;
            const endNumeric = toNumeric(endRaw);
            const end =
                endNumeric && endNumeric > start ? endNumeric : Date.now();

            const diff = Math.max(0, end - start);
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTripElapsed(
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        computeElapsed();

        if ((currentTrip as any)?.endTime) {
            return;
        }

        const interval = setInterval(computeElapsed, 1000);
        return () => clearInterval(interval);
    }, [currentTrip, toNumeric]);

    const isTripActive = useMemo(() => {
        if (!currentTrip) {
            return false;
        }
        const endTimeNumeric = toNumeric((currentTrip as any)?.endTime);
        if (endTimeNumeric === null) {
            return true;
        }
        return endTimeNumeric <= 0;
    }, [currentTrip, toNumeric]);

    const heroAccent = useSharedValue(device ? 1 : 0);

    useEffect(() => {
        heroAccent.value = withTiming(device ? 1 : 0, {
            duration: 400,
        });
    }, [device, heroAccent]);

    const heroCardAnimatedStyle = useAnimatedStyle(() => {
        const inactiveBorder =
            colorScheme === 'dark'
                ? 'rgba(71,85,105,0.7)'
                : 'rgba(226,232,240,0.7)';

        console.log(heroAccent.value);
        if (heroAccent.value <= 0.01) {
            return {
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
            };
        }

        const borderColor = interpolateColor(
            heroAccent.value,
            [0, 1],
            [inactiveBorder, '#2563EB']
        );
        const shadowColor = interpolateColor(
            heroAccent.value,
            [0, 1],
            ['rgba(15,23,42,0.18)', 'rgba(37,99,235,0.45)']
        );

        return {
            borderColor,
            shadowColor,
            shadowOpacity: 0.18 + heroAccent.value * 0.2,
            shadowRadius: 12 + heroAccent.value * 6,
            shadowOffset: { width: 0, height: 4 + heroAccent.value * 2 },
            elevation: 6 + heroAccent.value * 3,
        };
    }, [heroAccent, colorScheme]);

    if (isLandscape) {
        return (
            <ControllerLandscapeView
                controller={controller}
                controllerFaults={controllerFaults}
                device={device}
                batteryVoltage={batteryVoltage}
                batterySoc={batterySoc}
                batteryColor={batteryColor}
                hasReceivedBatteryInformation={hasReceivedBatteryInformation}
                currentGear={currentGear}
                currentGearPower={currentGearPower}
                motorCutoffApplied={motorCutoffApplied}
                prefersMph={prefersMph}
                prefersFahrenheit={prefersFahrenheit}
                calculatedSpeedSharedValue={calculatedSpeedSharedValue}
                lineCurrent={lineCurrent}
                phaseACurrent={phaseACurrent}
                phaseCCurrent={phaseCCurrent}
                maxLineCurrent={maxLineCurrent}
                maxPhaseCurrent={maxPhaseCurrent}
                rpmSharedValue={rpmSharedValue}
                wattsSharedValue={wattsSharedValue}
                mosTemperatureCelcius={mosTemperatureCelcius}
                motorTemperatureCelcius={motorTemperatureCelcius}
                tripSummary={tripSummary}
                isScanning={isScanning}
                usesGpsSpeed={controller.preferGpsSpeed}
                voltageSag={voltageSag}
                currentLocation={currentLocation}
                insets={insets}
            />
        );
    }

    return (
        <View className="flex-1 bg-background-0">
            <AnimatedScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 16,
                    paddingBottom: 128,
                }}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
            >
                <View className="px-5">
                    <AnimatedCard
                        layout={Layout.duration(220)
                            .springify()
                            .damping(32)
                            .stiffness(150)}
                        className={heroCardClass}
                        style={[animatedView, heroCardAnimatedStyle]}
                    >
                        <ControllerHeaderInformation
                            {...{
                                name: controller.name,
                                localName: controller.localName,
                                device,
                            }}
                        />
                        {statusText ? (
                            <Text
                                className={`${statusTone} text-sm font-semibold mt-2`}
                            >
                                {statusText}
                            </Text>
                        ) : null}
                        {showHeroTelemetry && (
                            <>
                                <Animated.View
                                    entering={FadeIn.duration(220)}
                                    className="mt-4 w-full flex-row items-center gap-3"
                                >
                                    <View style={{ width: 140 }}>
                                        <BatteryBar
                                            height={24}
                                            socPercentage={
                                                batterySoc
                                                    ? parseInt(batterySoc, 10)
                                                    : 0
                                            }
                                        />
                                    </View>
                                    <Text
                                        className={`${batteryColor} text-lg font-semibold`}
                                    >
                                        {batteryVoltage
                                            ? `${batteryVoltage}V`
                                            : '—'}
                                    </Text>
                                </Animated.View>

                                <Animated.View
                                    entering={FadeIn.duration(220).delay(90)}
                                    className="mt-3"
                                >
                                    <GearPortion
                                        motorCutoffApplied={motorCutoffApplied}
                                        currentGear={currentGear}
                                        currentGearPower={currentGearPower}
                                        hasReceivedBatteryInformation={
                                            hasReceivedBatteryInformation
                                        }
                                        emphasize
                                    />
                                </Animated.View>
                            </>
                        )}
                    </AnimatedCard>

                    {isTripActive && (
                        <View className="mt-6">
                            <Animated.View
                                layout={Layout.duration(220)
                                    .springify()
                                    .damping(32)
                                    .stiffness(150)}
                                className={cardClass}
                            >
                                <Heading className={sectionHeadingClass}>
                                    {t(
                                        'controller.currentTrip.title',
                                        'Current trip'
                                    )}
                                </Heading>
                                <Text className={sectionSubtitleClass}>
                                    {tripElapsed
                                        ? `${t(
                                              'controller.currentTrip.elapsed',
                                              'Elapsed'
                                          )}: ${tripElapsed}`
                                        : t(
                                              'controller.currentTrip.subtitle',
                                              'Live telemetry while your trip is active.'
                                          )}
                                </Text>

                                <View className="mt-3 flex-row items-center justify-between gap-6">
                                    <View>
                                        <NumberTicker
                                            sharedValue={
                                                calculatedSpeedSharedValue
                                            }
                                            width={160}
                                        />
                                        <HStack className="items-center justify-start self-start mt-2 gap-1">
                                            {controller.preferGpsSpeed && (
                                                <Icon
                                                    size={20}
                                                    as={LucideLocateFixed}
                                                    className="text-secondary-500"
                                                />
                                            )}
                                            <Text className="text-secondary-500 text-lg font-bold">
                                                {prefersMph ? 'MPH' : 'KPH'}
                                            </Text>
                                        </HStack>
                                    </View>

                                    <View className="h-40 flex-1 items-center justify-center">
                                        <AnimatedBike
                                            gearMode={currentGear}
                                            animatedBikeOpacity={
                                                animatedBikeOpacity
                                            }
                                            maxSpeedInRPM={maxSpeedInRPM}
                                            polePairsSharedValue={
                                                polePairsSharedValue
                                            }
                                            rpmSharedValue={rpmSharedValue}
                                            wattsSharedValue={wattsSharedValue}
                                            calculatedSpeedSharedValue={
                                                calculatedSpeedSharedValue
                                            }
                                            shouldShiftBike={false}
                                            preferredWidth={240}
                                        />
                                    </View>
                                </View>

                                <View className="mt-6 flex-row flex-wrap gap-3">
                                    <Button
                                        variant="solid"
                                        size="lg"
                                        onPress={openHud}
                                    >
                                        <Icon
                                            as={LucideMaximize2}
                                            size={18}
                                            className="text-primary-50 mr-2"
                                        />
                                        <ButtonText>
                                            {t(
                                                'controller.currentTrip.fullscreen',
                                                'Go fullscreen'
                                            )}
                                        </ButtonText>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onPress={handleEndTrip}
                                        isDisabled={isEndingTrip}
                                    >
                                        <Icon
                                            as={LucideX}
                                            size={18}
                                            className="text-error-500 mr-2"
                                        />
                                        <ButtonText className="text-error-500">
                                            {t(
                                                'controller.currentTrip.endTrip',
                                                'End trip'
                                            )}
                                        </ButtonText>
                                    </Button>
                                </View>
                            </Animated.View>
                        </View>
                    )}
                </View>

                {controllerFaults?.length > 0 && (
                    <View className="px-5 mt-4 gap-3">
                        {controllerFaults.map((fault, index) => (
                            <ControllerFault key={index} fault={fault} />
                        ))}
                    </View>
                )}

                <View className="px-5 mt-6 gap-5">
                    <View className={cardClass}>
                        <Heading className={sectionHeadingClass}>
                            {t('controller.quickActions', 'Quick actions')}
                        </Heading>
                        <View className="mt-4 gap-3">
                            {device ? (
                                <Animated.View
                                    entering={FadeIn.duration(200)}
                                    exiting={FadeOut.duration(200)}
                                >
                                    <Button
                                        variant="solid"
                                        size="lg"
                                        onPress={openHud}
                                    >
                                        <Icon
                                            as={LucideMaximize2}
                                            size={18}
                                            className="text-primary-50 mr-2"
                                        />
                                        <ButtonText>
                                            {t(
                                                'controller.currentTrip.fullscreen',
                                                'Go fullscreen'
                                            )}
                                        </ButtonText>
                                    </Button>
                                </Animated.View>
                            ) : null}
                            <Button
                                variant="outline"
                                size="lg"
                                onPress={() =>
                                    navigation.navigate('Trips', {
                                        serialNumber: controller.serialNumber,
                                    })
                                }
                            >
                                <Icon
                                    as={LucideRoute}
                                    size={18}
                                    className="text-secondary-500 mr-2"
                                />
                                <ButtonText>
                                    {t(
                                        'controller.viewTrips',
                                        'Trips & route replay'
                                    )}
                                </ButtonText>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onPress={() =>
                                    navigation.navigate(
                                        'DisplayOptions' as never,
                                        {
                                            controller,
                                            localName: controller.localName,
                                        }
                                    )
                                }
                            >
                                <Icon
                                    as={LucideSettings}
                                    size={18}
                                    className="text-secondary-500 mr-2"
                                />
                                <ButtonText>
                                    {t(
                                        'controller.tuneDisplay',
                                        'Customize display layout'
                                    )}
                                </ButtonText>
                            </Button>
                        </View>
                    </View>

                    <View className={cardClass}>
                        <Heading className={sectionHeadingClass}>
                            {t('controller.aboutController', 'Controller info')}
                        </Heading>
                        <Text className={sectionSubtitleClass}>
                            {t(
                                'controller.aboutControllerSubtitle',
                                'Identifiers and maintenance shortcuts.'
                            )}
                        </Text>
                        <View className="mt-4 gap-3">
                            <View>
                                <Text className={statLabelClass}>
                                    {t(
                                        'controller.serialNumber',
                                        'Serial number'
                                    )}
                                </Text>
                                <Text className={statValueClass}>
                                    {controller.serialNumber}
                                </Text>
                            </View>
                            <View>
                                <Text className={statLabelClass}>
                                    {t(
                                        'trip.summary.totalDistance',
                                        'Total distance'
                                    )}
                                </Text>
                                <Text className={statValueClass}>
                                    {totalDistanceDisplay}
                                </Text>
                            </View>
                        </View>
                        <Button
                            variant="outline"
                            size="lg"
                            className="mt-6"
                            onPress={() => setUnbindModalOpen(true)}
                        >
                            <Icon
                                as={LucideX}
                                size={18}
                                className="text-error-500 mr-2"
                            />
                            <ButtonText className="text-error-500">
                                {t('controller.removeAccess', 'Remove access')}
                            </ButtonText>
                        </Button>
                    </View>

                    <View className={cardClass}>
                        <Heading className={sectionHeadingClass}>
                            {t('controller.aboutApp', 'About GDriver')}
                        </Heading>
                        <View className="mt-3 gap-1">
                            <Text className={statLabelClass}>Version</Text>
                            <Text className={statValueClass}>
                                v{require('../../app.json').expo.version}
                            </Text>
                        </View>
                        <View className="mt-4">
                            <Text className={statLabelClass}>
                                {t('common.businessInquiry')}
                            </Text>
                            <TouchableOpacity
                                className="mt-1"
                                onPress={() =>
                                    Linking.openURL(`mailto:${BUSINESS_EMAIL}`)
                                }
                            >
                                <Text className={statValueClass}>
                                    {BUSINESS_EMAIL}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </AnimatedScrollView>

            <FullscreenHud
                visible={isHudVisible}
                onClose={closeHud}
                onEndTrip={handleEndTrip}
                isEndingTrip={isEndingTrip}
                controller={controller}
                controllerFaults={controllerFaults}
                currentTrip={currentTrip}
                device={device}
                batteryVoltage={batteryVoltage}
                batterySoc={batterySoc}
                batteryColor={batteryColor}
                hasReceivedBatteryInformation={hasReceivedBatteryInformation}
                currentGear={currentGear}
                currentGearPower={currentGearPower}
                lineCurrent={lineCurrent}
                phaseACurrent={phaseACurrent}
                phaseCCurrent={phaseCCurrent}
                maxLineCurrent={maxLineCurrent}
                maxPhaseCurrent={maxPhaseCurrent}
                motorTemperatureCelcius={motorTemperatureCelcius}
                mosTemperatureCelcius={mosTemperatureCelcius}
                calculatedSpeedSharedValue={calculatedSpeedSharedValue}
                rpmSharedValue={rpmSharedValue}
                wattsSharedValue={wattsSharedValue}
                polePairsSharedValue={polePairsSharedValue}
                maxSpeedInRPM={maxSpeedInRPM}
                animatedBikeOpacity={animatedBikeOpacity}
                animatedMphStyle={animatedMphStyle}
                prefersMph={prefersMph}
                prefersFahrenheit={prefersFahrenheit}
                tripSummary={tripSummary}
                isScanning={isScanning}
                colorScheme={colorScheme}
                motorCutoffApplied={motorCutoffApplied}
                voltageSag={voltageSag}
                currentLocation={currentLocation}
            />

            <AlertDialog
                heading={t('devices.unbindModalTitle')}
                description={t('devices.unbindModalDescription')}
                buttonTitle={t('common.continue')}
                cancelButtonTitle={t('common.cancel')}
                isOpen={isUnbindModalOpen}
                onButtonClick={onUnboundConfirmed}
                setOpen={() => setUnbindModalOpen(false)}
            />
        </View>
    );
};

export default ControllerPage;
