import { Controller } from '@/interfaces/Controller';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import BatteryBar from '@/components/dashboard/BatteryBar';
import AnimatedBike from './AnimatedBike';
import NumberTicker from '@/components/dashboard/NumberTicker';
import ControllerScrollView from '@/components/dashboard/ControllerScrollView';
import ControllerHeaderInformation from '@/components/dashboard/ControllerHeaderInformation';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/providers/UserContextProvider';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ControllerLandscapeView from '@/components/dashboard/ControllerLandscapeView';
import GearPortion from '@/components/dashboard/GearPortion';
import { Button, ButtonText } from '@/components/ui/button';
import { useColorScheme } from 'react-native';
import { LucideLocateFixed } from 'lucide-react-native';
import { Spinner } from '@/components/ui/spinner';
import ControllerPortraitView from '@/components/dashboard/ControllerPortraitView';
import FullscreenHud from '@/components/dashboard/FullscreenHud';
import useControllerTelemetry from '@/hooks/useControllerTelemetry';
import useControllerOrientation from '@/hooks/useControllerOrientation';
import useControllerAnimations from '@/hooks/useControllerAnimations';

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedHStack = Animated.createAnimatedComponent(HStack);

const FROM_TOP = 234.66;
const ControllerPage = ({ controller }: { controller: Controller }) => {
    const insets = useSafeAreaInsets();
    const paddingTop = FROM_TOP + insets.top;
    const { prefersMph, prefersFahrenheit } = useUser();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isLandscape = useControllerOrientation();

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
        animatedBikeView,
        animatedBikeOpacity,
        animatedMphStyle,
    } = useControllerAnimations({
        paddingTop,
        device,
        rpmSharedValue,
        isLandscape,
    });

    const [isHudVisible, setHudVisible] = useState(false);
    const openHud = useCallback(() => setHudVisible(true), []);
    const closeHud = useCallback(() => setHudVisible(false), []);

    const handleEndTrip = useCallback(async () => {
        await endCurrentTrip({ onSuccess: closeHud });
    }, [endCurrentTrip, closeHud]);

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
        <View className="flex-1">
            <ControllerScrollView
                {...{
                    device,
                    paddingTop,
                    scrollPosition,
                    controllerFaults,
                    currentTrip,
                    controller,
                    onEndTrip: handleEndTrip,
                    isEndingTrip,
                    onOpenHud: openHud,
                }}
            />
            <Animated.View
                style={[animatedView, { paddingTop: insets.top }]}
                className="absolute w-full px-4"
            >
                <ControllerHeaderInformation
                    {...{
                        name: controller.name,
                        localName: controller.localName,
                        device,
                    }}
                />
                <View className="h-2" />
                <View>
                    {hasReceivedBatteryInformation ? (
                        <Animated.View
                            entering={FadeIn.duration(500)}
                            exiting={FadeOut}
                        >
                            <View className="flex-row items-center gap-2">
                                <View className="w-20 mr-2">
                                    <BatteryBar
                                        height={24}
                                        socPercentage={parseInt(batterySoc!)}
                                    />
                                </View>
                                <Text
                                    className={`${batteryColor} flex-1 text-lg font-bold`}
                                >
                                    {batteryVoltage}V
                                </Text>
                                {!controllerFaults.length && (
                                    <AnimatedText
                                        entering={FadeIn}
                                        exiting={FadeOut}
                                        className={`text-secondary-500 text-lg font-bold`}
                                    >
                                        {t('common.ready')}
                                    </AnimatedText>
                                )}
                                {!!controllerFaults.length && (
                                    <AnimatedText
                                        entering={FadeIn}
                                        exiting={FadeOut}
                                        className={`text-error-500 text-lg font-bold`}
                                    >
                                        {t('common.faultDetected')}
                                    </AnimatedText>
                                )}
                            </View>
                        </Animated.View>
                    ) : (
                        <View style={{ height: 24.7 }}>
                            {!!deviceLoadingStates[controller.localName] && (
                                <Text className="text-secondary-500 text-lg font-bold">
                                    {t('common.connecting')}
                                </Text>
                            )}
                            {!deviceLoadingStates[controller.localName] &&
                                !device && (
                                    <>
                                        {isScanning && (
                                            <Text className="text-secondary-500 text-lg font-bold">
                                                {t('common.searching')}
                                            </Text>
                                        )}
                                        {!isScanning && (
                                            <Text className="text-secondary-500 text-lg font-bold">
                                                {t('common.noConnection')}
                                            </Text>
                                        )}
                                    </>
                                )}
                        </View>
                    )}
                </View>

                <GearPortion
                    motorCutoffApplied={motorCutoffApplied}
                    currentGear={currentGear}
                    currentGearPower={currentGearPower}
                    hasReceivedBatteryInformation={
                        hasReceivedBatteryInformation
                    }
                />

                <AnimatedHStack
                    className="h-40 relative items-center"
                    style={animatedBikeView}
                >
                    <View className="absolute">
                        <AnimatedBike
                            gearMode={currentGear}
                            animatedBikeOpacity={animatedBikeOpacity}
                            maxSpeedInRPM={maxSpeedInRPM}
                            polePairsSharedValue={polePairsSharedValue}
                            rpmSharedValue={rpmSharedValue}
                            wattsSharedValue={wattsSharedValue}
                            calculatedSpeedSharedValue={
                                calculatedSpeedSharedValue
                            }
                        />
                    </View>
                    <Animated.View className="w-48" style={animatedMphStyle}>
                        <NumberTicker
                            sharedValue={calculatedSpeedSharedValue}
                            width={192}
                        />
                        <HStack className="items-center mt-2 gap-1">
                            {controller.preferGpsSpeed && (
                                <Icon
                                    size={24}
                                    as={LucideLocateFixed}
                                    className="text-secondary-500"
                                />
                            )}
                            <Text className="text-secondary-500 text-xl font-bold">
                                {prefersMph ? 'MPH' : 'KPH'}
                            </Text>
                        </HStack>
                    </Animated.View>
                </AnimatedHStack>
            </Animated.View>
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
        </View>
    );
};

export default ControllerPage;
