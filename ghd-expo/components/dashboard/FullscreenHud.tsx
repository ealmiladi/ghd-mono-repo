import React, { memo } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LucideTimerOff, LucideX } from 'lucide-react-native';
import { Spinner } from '@/components/ui/spinner';
import ControllerLandscapeView from '@/components/dashboard/ControllerLandscapeView';
import ControllerPortraitView from '@/components/dashboard/ControllerPortraitView';
import type { Controller } from '@/interfaces/Controller';
import type { Device } from 'react-native-ble-plx';
import type { TripSummary } from '@/components/dashboard/types';
import useControllerOrientation from '@/hooks/useControllerOrientation';
import { SharedValue } from 'react-native-reanimated';

type FullscreenHudProps = {
    visible: boolean;
    onClose: () => void;
    onEndTrip: () => Promise<void>;
    isEndingTrip: boolean;
    controller: Controller;
    controllerFaults: { title: string; description: string }[];
    currentTrip: any;
    device: Device | undefined;
    batteryVoltage: string | null;
    batterySoc: string | null;
    batteryColor: string | null;
    hasReceivedBatteryInformation: boolean;
    currentGear: string | null;
    currentGearPower: string | null;
    lineCurrent: any;
    phaseACurrent: any;
    phaseCCurrent: any;
    maxLineCurrent: string | null;
    maxPhaseCurrent: string | null;
    motorTemperatureCelcius: number | undefined;
    mosTemperatureCelcius: number | undefined;
    calculatedSpeedSharedValue: any;
    rpmSharedValue: any;
    wattsSharedValue: any;
    prefersMph: boolean;
    prefersFahrenheit: boolean;
    tripSummary: TripSummary | null;
    isScanning: boolean;
    motorCutoffApplied: SharedValue<boolean>;
    colorScheme: string | null | undefined;
    voltageSag: number;
    currentLocation: { latitude: number; longitude: number } | null;
};

const FullscreenHud = memo((props: FullscreenHudProps) => {
    const {
        visible,
        onClose,
        onEndTrip,
        isEndingTrip,
        controller,
        controllerFaults,
        currentTrip,
        device,
        batteryVoltage,
        batterySoc,
        batteryColor,
        hasReceivedBatteryInformation,
        currentGear,
        currentGearPower,
        lineCurrent,
        phaseACurrent,
        phaseCCurrent,
        maxLineCurrent,
        maxPhaseCurrent,
        motorTemperatureCelcius,
        mosTemperatureCelcius,
        calculatedSpeedSharedValue,
        rpmSharedValue,
        wattsSharedValue,
        prefersMph,
        prefersFahrenheit,
        tripSummary,
        isScanning,
        motorCutoffApplied,
        voltageSag,
        currentLocation,
    } = props;

    const hudInsets = useSafeAreaInsets();
    const isLandscape = useControllerOrientation();
    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            supportedOrientations={[
                'portrait',
                'portrait-upside-down',
                'landscape',
                'landscape-left',
                'landscape-right',
            ]}
            onRequestClose={onClose}
        >
            <View className="bg-background-0 flex-1">
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingTop: hudInsets.top + 12,
                        zIndex: 10,
                    }}
                >
                    <Button variant="outline" size="sm" onPress={onClose}>
                        <Icon as={LucideX} className="text-secondary-500" />
                        <ButtonText>{'Close'}</ButtonText>
                    </Button>
                    {!!currentTrip && (
                        <Button
                            variant="solid"
                            size="sm"
                            action="primary"
                            disabled={isEndingTrip}
                            onPress={onEndTrip}
                        >
                            {isEndingTrip ? (
                                <Spinner />
                            ) : (
                                <Icon
                                    as={LucideTimerOff}
                                    className="text-secondary-100"
                                />
                            )}
                            <ButtonText>{'End Trip'}</ButtonText>
                        </Button>
                    )}
                </View>

                <View
                    style={{
                        flex: 1,
                        paddingTop: 16,
                        paddingBottom: hudInsets.bottom + 16,
                    }}
                >
                    {isLandscape ? (
                        <ControllerLandscapeView
                            controller={controller}
                            controllerFaults={controllerFaults}
                            device={device}
                            batteryVoltage={batteryVoltage}
                            batterySoc={batterySoc}
                            batteryColor={batteryColor}
                            hasReceivedBatteryInformation={
                                hasReceivedBatteryInformation
                            }
                            currentGear={currentGear}
                            currentGearPower={currentGearPower}
                            motorCutoffApplied={motorCutoffApplied}
                            prefersMph={prefersMph}
                            prefersFahrenheit={prefersFahrenheit}
                            calculatedSpeedSharedValue={
                                calculatedSpeedSharedValue
                            }
                            rpmSharedValue={rpmSharedValue}
                            wattsSharedValue={wattsSharedValue}
                            lineCurrent={lineCurrent}
                            phaseACurrent={phaseACurrent}
                            phaseCCurrent={phaseCCurrent}
                            maxLineCurrent={maxLineCurrent}
                            maxPhaseCurrent={maxPhaseCurrent}
                            mosTemperatureCelcius={mosTemperatureCelcius}
                            motorTemperatureCelcius={motorTemperatureCelcius}
                            tripSummary={tripSummary}
                            isScanning={isScanning}
                            usesGpsSpeed={controller.preferGpsSpeed}
                            voltageSag={voltageSag}
                            currentLocation={currentLocation}
                            insets={hudInsets}
                        />
                    ) : (
                        <ControllerPortraitView
                            {...{
                                controller,
                                controllerFaults,
                                device,
                                batteryVoltage,
                                batterySoc,
                                batteryColor,
                                hasReceivedBatteryInformation,
                                currentGear,
                                currentGearPower,
                                motorCutoffApplied,
                                prefersMph,
                                prefersFahrenheit,
                                usesGpsSpeed: controller.preferGpsSpeed,
                                calculatedSpeedSharedValue,
                                rpmSharedValue,
                                wattsSharedValue,
                                lineCurrent,
                                phaseACurrent,
                                phaseCCurrent,
                                maxLineCurrent,
                                maxPhaseCurrent,
                                mosTemperatureCelcius,
                                motorTemperatureCelcius,
                                tripSummary,
                                isScanning,
                                voltageSag,
                                currentLocation,
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
});

FullscreenHud.displayName = 'FullscreenHud';

export default FullscreenHud;
