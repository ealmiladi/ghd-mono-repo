import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import firestore from '@react-native-firebase/firestore';
import BigNumber from 'bignumber.js';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Device } from 'react-native-ble-plx';

import { useDevices } from '@/providers/BluetoothProvider';
import useLocation, { type LocationSample } from '@/hooks/useLocation';
import { IS_SIMULATOR_MODE } from '@/utils/env';
import { toFixed } from '@/utils';
import type { Controller } from '@/interfaces/Controller';
import type {
    ControllerState,
    CurrentTrip,
} from '@/fardriver/interfaces/ControllerState';
import type { TripSummary } from '@/components/dashboard/types';

export type UseControllerTelemetryArgs = {
    controller: Controller;
    prefersMph: boolean;
    translate: (key: string, options?: Record<string, any>) => string;
    isLandscape: boolean;
};

export type UseControllerTelemetryResult = {
    device: Device | undefined;
    deviceLoadingStates: Record<string, any>;
    isScanning: boolean;
    controllerFaults: { title: string; description: string }[];
    currentTrip: CurrentTrip | null;
    hasReceivedBatteryInformation: boolean;
    batteryVoltage: string | null;
    batterySoc: string | null;
    batteryColor: string;
    voltageSag: number;
    currentGear: string | null;
    currentGearPower: string | null;
    motorTemperatureCelcius: number | undefined;
    mosTemperatureCelcius: number | undefined;
    maxLineCurrent: string | null;
    maxPhaseCurrent: string | null;
    lineCurrent: SharedValue<number>;
    phaseACurrent: SharedValue<number>;
    phaseCCurrent: SharedValue<number>;
    calculatedSpeedSharedValue: SharedValue<number>;
    rpmSharedValue: SharedValue<number>;
    maxSpeedInRPM: SharedValue<number>;
    wattsSharedValue: SharedValue<number>;
    polePairsSharedValue: SharedValue<number>;
    motorCutoffApplied: SharedValue<boolean>;
    tripSummary: TripSummary | null;
    currentLocation: { latitude: number; longitude: number } | null;
    endCurrentTrip: (options?: { onSuccess?: () => void }) => Promise<void>;
    isEndingTrip: boolean;
};

const useControllerTelemetry = ({
    controller,
    prefersMph,
    translate,
    isLandscape,
}: UseControllerTelemetryArgs): UseControllerTelemetryResult => {
    const {
        connectedDevices,
        deviceLoadingStates,
        controllerStates,
        isScanning,
    } = useDevices();

    const locationCleanupRef = useRef<(() => void) | null>(null);

    const [currentGear, setCurrentGear] = useState<string | null>(null);
    const [currentGearPower, setCurrentGearPower] = useState<string | null>(
        null
    );

    const [batteryVoltage, setBatteryVoltage] = useState<string | null>(null);
    const [batterySoc, setBatterySoc] = useState<string | null>(null);
    const [maxLineCurrent, setMaxLineCurrent] = useState<string | null>(null);
    const [maxPhaseCurrent, setMaxPhaseCurrent] = useState<string | null>(null);

    const [currentTrip, setCurrentTrip] = useState<CurrentTrip | null>(null);
    const [controllerFaults, setControllerFaults] = useState<
        { title: string; description: string }[]
    >([]);
    const [voltageSag, setVoltageSag] = useState(0);
    const [motorTemperatureCelcius, setMotorTemperatureCelcius] = useState<
        number | undefined
    >(undefined);
    const [mosTemperatureCelcius, setMosTemperatureCelcius] = useState<
        number | undefined
    >(undefined);
    const [isEndingTrip, setEndingTrip] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    const calculatedSpeedSharedValue = useSharedValue(0);
    const rpmSharedValue = useSharedValue(0);
    const maxSpeedInRPM = useSharedValue(0);
    const wattsSharedValue = useSharedValue(0);
    const polePairsSharedValue = useSharedValue(0);
    const motorCutoffApplied = useSharedValue<boolean>(false);

    const lineCurrent = useSharedValue(0);
    const phaseACurrent = useSharedValue(0);
    const phaseCCurrent = useSharedValue(0);

    const device = useMemo(
        () =>
            connectedDevices.find(
                (candidate) => candidate.name === controller.localName
            ),
        [connectedDevices, controller.localName]
    );

    const handleLocationSample = useCallback(
        ({ location, timestamp }: LocationSample) => {
            const stateForController: ControllerState | undefined =
                controllerStates.current[controller.localName];

            if (!stateForController?.currentTrip) {
                return;
            }

            const { latitude, longitude, altitude, heading, speed } =
                location.coords;

            if (
                latitude === undefined ||
                longitude === undefined ||
                Number.isNaN(latitude) ||
                Number.isNaN(longitude)
            ) {
                return;
            }

            const lastSag = stateForController.currentTrip?.lastVoltageSag;
            const sagValue =
                lastSag === undefined || lastSag === null
                    ? null
                    : BigNumber.isBigNumber(lastSag)
                      ? lastSag.toNumber()
                      : Number(lastSag);

            stateForController.currentTrip.recordRoutePoint({
                timestamp,
                latitude,
                longitude,
                altitude: altitude ?? null,
                heading: heading ?? null,
                speedMps: speed ?? null,
                lineCurrent:
                    stateForController.lineCurrent !== undefined
                        ? Number(stateForController.lineCurrent)
                        : null,
                voltage:
                    stateForController.voltage !== undefined
                        ? Number(stateForController.voltage)
                        : null,
                inputPower:
                    stateForController.inputPower !== undefined
                        ? Number(stateForController.inputPower)
                        : null,
                mosTemperature:
                    stateForController.mosTemperatureCelcius !== undefined
                        ? Number(stateForController.mosTemperatureCelcius)
                        : null,
                motorTemperature:
                    stateForController.motorTemperatureCelcius !== undefined
                        ? Number(stateForController.motorTemperatureCelcius)
                        : null,
                voltageSag: sagValue,
            });

            stateForController.currentTrip.publishTripUpdate();

            setCurrentLocation({ latitude, longitude });

            if (speed !== null && speed !== undefined && speed >= 0) {
                stateForController.currentTrip?.recordGpsSpeed(speed);

                if (controller.preferGpsSpeed) {
                    const displaySpeed = prefersMph
                        ? speed * 2.23694
                        : speed * 3.6;
                    calculatedSpeedSharedValue.value = parseInt(displaySpeed);
                }
            }
        },
        [
            calculatedSpeedSharedValue,
            controller.localName,
            controller.preferGpsSpeed,
            controllerStates,
            prefersMph,
        ]
    );

    const { listen } = useLocation(
        calculatedSpeedSharedValue,
        prefersMph,
        handleLocationSample
    );

    const endCurrentTrip = useCallback(
        async (options?: { onSuccess?: () => void }) => {
            if (isEndingTrip) {
                return;
            }
            try {
                setEndingTrip(true);
                const currentState =
                    controllerStates.current?.[controller.localName];
                currentState?.currentTrip?.performEndTripCalculations();
                const tripToSave = currentState?.currentTrip || currentTrip;
                if (!tripToSave) {
                    return;
                }

                if (IS_SIMULATOR_MODE) {
                    currentState?.endTrip();
                    setCurrentTrip(null);
                    options?.onSuccess?.();
                    Toast.show({
                        type: 'success',
                        text1: translate('common.saved'),
                        text2: translate('trip.savedTrip'),
                    });
                    return;
                }

                await firestore()
                    .collection('controllers')
                    .doc(controller.serialNumber)
                    .collection('trips')
                    .add(JSON.parse(JSON.stringify(tripToSave)));

                currentState?.endTrip();
                setCurrentTrip(null);
                options?.onSuccess?.();

                Toast.show({
                    type: 'success',
                    text1: translate('common.saved'),
                    text2: translate('trip.savedTrip'),
                });
            } catch (error) {
                console.error(error);
                Toast.show({
                    type: 'error',
                    text1: translate('common.error'),
                    text2: translate('trip.savedTripError'),
                });
            } finally {
                setEndingTrip(false);
            }
        },
        [
            controller.localName,
            controller.serialNumber,
            controllerStates,
            currentTrip,
            isEndingTrip,
            translate,
        ]
    );

    useEffect(() => {
        if (!device) {
            setControllerFaults([]);
            setCurrentGear(null);
            setCurrentGearPower(null);
            setBatteryVoltage(null);
            setBatterySoc(null);
            setCurrentTrip(null);
            calculatedSpeedSharedValue.value = 0;
            rpmSharedValue.value = 0;
            wattsSharedValue.value = 0;
            polePairsSharedValue.value = 0;
            maxSpeedInRPM.value = 0;
            setVoltageSag(0);
            return;
        }

        const state: ControllerState =
            controllerStates.current[controller.localName];

        const parseIntegerValue = (value: any) => {
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'string') {
                return parseInt(value, 10);
            }
            if (value && typeof value.toString === 'function') {
                const parsed = parseInt(value.toString(), 10);
                return parsed;
            }
            return Number.NaN;
        };

        state.onReceive('gearMode', setCurrentGear);
        state.onReceive('gearPowerMode', setCurrentGearPower);
        state.onReceive('controllerFaults', setControllerFaults);
        state.onReceive('soc', setBatterySoc);
        state.onReceive('voltage', setBatteryVoltage);
        state.onReceive('maxLineCurrent', setMaxLineCurrent);
        state.onReceive('maxPhaseCurrent', setMaxPhaseCurrent);
        state.onReceive('voltageSag', (value: any) => {
            try {
                if (value == null) {
                    setVoltageSag(0);
                } else if (typeof value === 'number') {
                    setVoltageSag(value);
                } else if (typeof value === 'string') {
                    setVoltageSag(Number(value));
                } else if (value?.toNumber) {
                    setVoltageSag(value.toNumber());
                } else {
                    setVoltageSag(Number(value));
                }
            } catch (error) {
                console.error('Error parsing voltage sag', error);
                setVoltageSag(0);
            }
        });

        state.onReceive('motorCutoffApplied', (value: boolean) => {
            motorCutoffApplied.value = value;
        });

        state.onReceive('maxSpeed', (value: any) => {
            const parsed = parseIntegerValue(value);
            if (Number.isNaN(parsed)) {
                maxSpeedInRPM.value = 0;
                return;
            }
            if (polePairsSharedValue.value >= 16) {
                maxSpeedInRPM.value = Math.trunc(
                    (parsed * 4) / polePairsSharedValue.value
                );
            } else {
                maxSpeedInRPM.value = parsed;
            }
        });

        state.onReceive('currentTrip', (trip: CurrentTrip | null) => {
            if (!trip) {
                if (!IS_SIMULATOR_MODE) {
                    locationCleanupRef.current?.();
                    locationCleanupRef.current = null;
                }
                setCurrentTrip(null);
                return;
            }

            if (!IS_SIMULATOR_MODE && !locationCleanupRef.current) {
                listen()
                    .then((cleanup) => {
                        if (cleanup) {
                            locationCleanupRef.current = cleanup;
                        }
                    })
                    .catch((error) => {
                        console.warn('Location listener error', error);
                    });
            }

            setCurrentTrip(trip);
            trip.registerTripObserver((updatedTrip) => {
                const copiedTrip: any = { ...updatedTrip };
                if (polePairsSharedValue.value >= 16) {
                    const adjustedMax = Math.trunc(
                        (Number(updatedTrip.maxRPM) * 4) /
                            polePairsSharedValue.value
                    );
                    copiedTrip.maxRPM = adjustedMax;
                }
                setCurrentTrip(copiedTrip);
            });
        });

        state.onReceive('rpms', (value: any) => {
            const parsed = parseIntegerValue(value);
            if (Number.isNaN(parsed)) {
                rpmSharedValue.value = 0;
                return;
            }
            if (polePairsSharedValue.value >= 16) {
                rpmSharedValue.value = Math.trunc(
                    (parsed * 4) / polePairsSharedValue.value
                );
            } else {
                rpmSharedValue.value = parsed;
            }
        });

        state.onReceive('inputPower', (value: any) => {
            const parsed = parseIntegerValue(value);
            wattsSharedValue.value = Number.isNaN(parsed) ? 0 : parsed;
        });

        if (!controller.preferGpsSpeed) {
            state.onReceive('calculatedSpeed', (value: any) => {
                const nextSpeed = prefersMph ? value?.mph : value?.kph;
                const parsed = parseIntegerValue(nextSpeed);
                calculatedSpeedSharedValue.value = Number.isNaN(parsed)
                    ? 0
                    : parsed;
            });
        }

        state.onReceive(
            'motorPolePairs',
            (value) => (polePairsSharedValue.value = parseInt(value))
        );

        return () => {
            locationCleanupRef.current?.();
            locationCleanupRef.current = null;
            state.allOff();
        };
    }, [
        calculatedSpeedSharedValue,
        controller.localName,
        controller.preferGpsSpeed,
        controllerStates,
        device,
        listen,
        prefersMph,
        polePairsSharedValue,
        maxSpeedInRPM,
        rpmSharedValue,
        wattsSharedValue,
        motorCutoffApplied,
    ]);

    useEffect(() => {
        if (!device || !isLandscape) {
            return;
        }

        const state: ControllerState =
            controllerStates.current[controller.localName];

        state.onReceive('lineCurrent', (value: string) => {
            const parsed = parseInt(value, 10);
            if (!Number.isNaN(parsed)) {
                lineCurrent.value = parsed;
            }
        });
        state.onReceive('phaseACurrent', (value: string) => {
            const parsed = parseInt(value, 10);
            if (!Number.isNaN(parsed)) {
                phaseACurrent.value = parsed;
            }
        });
        state.onReceive('phaseCCurrent', (value: string) => {
            const parsed = parseInt(value, 10);
            if (!Number.isNaN(parsed)) {
                phaseCCurrent.value = parsed;
            }
        });
        state.onReceive('mosTemperatureCelcius', setMosTemperatureCelcius);
        state.onReceive('motorTemperatureCelcius', setMotorTemperatureCelcius);

        return () => {
            state.off('lineCurrent');
            state.off('phaseACurrent');
            state.off('phaseCCurrent');
            state.off('mosTemperatureCelcius');
            state.off('motorTemperatureCelcius');
        };
    }, [
        controller.localName,
        controllerStates,
        device,
        isLandscape,
        lineCurrent,
        phaseACurrent,
        phaseCCurrent,
    ]);

    useEffect(() => {
        if (!IS_SIMULATOR_MODE) {
            return;
        }

        const presetTrip = () => {
            setCurrentTrip(
                (existing) =>
                    existing ||
                    ({
                        avgPower: 100,
                        avgSpeed: 20,
                        cumulativeEnergyWh: new BigNumber(1000),
                        distanceInMeters: new BigNumber(1000),
                        maxRPM: 1000,
                        maxSpeedInMeters: 20,
                        startVoltage: 50,
                        startTime: Date.now(),
                        maxLineCurrent: 100,
                        endVoltage: 40,
                        estimatedDistanceRemainingInMeters: new BigNumber(1010),
                        maxInputPower: 1000,
                        performEndTripCalculations: () => {},
                    } as any)
            );
        };

        const timeout = setTimeout(() => {
            presetTrip();
            const interval = setInterval(() => {
                if (calculatedSpeedSharedValue.value > 120) {
                    calculatedSpeedSharedValue.value -= 10;
                } else {
                    calculatedSpeedSharedValue.value += 1;
                }
                rpmSharedValue.value = calculatedSpeedSharedValue.value * 12;
                wattsSharedValue.value = calculatedSpeedSharedValue.value * 24;
                lineCurrent.value = calculatedSpeedSharedValue.value * -2;
                phaseACurrent.value = calculatedSpeedSharedValue.value * 2;
            }, 100);
            locationCleanupRef.current = () => clearInterval(interval);
        }, 3000);

        return () => {
            clearTimeout(timeout);
            locationCleanupRef.current?.();
            locationCleanupRef.current = null;
        };
    }, [
        calculatedSpeedSharedValue,
        lineCurrent,
        phaseACurrent,
        rpmSharedValue,
        wattsSharedValue,
    ]);

    const hasReceivedBatteryInformation = useMemo(
        () => !!(device && batterySoc !== null && batteryVoltage !== null),
        [device, batterySoc, batteryVoltage]
    );

    const batteryColor = useMemo(() => {
        if (batterySoc == null) {
            return 'text-secondary-500';
        }
        const value = parseInt(batterySoc, 10);
        if (Number.isNaN(value)) {
            return 'text-secondary-300';
        }
        if (value > 50) {
            return 'text-secondary-500';
        }
        if (value > 20) {
            return 'text-yellow-500';
        }
        return 'text-red-500';
    }, [batterySoc]);

    const tripSummary = useMemo<TripSummary | null>(() => {
        if (!currentTrip) {
            return null;
        }

        const distanceMeters = currentTrip.distanceInMeters?.toNumber?.() ?? 0;
        const distance = toFixed(
            distanceMeters * (prefersMph ? 0.000621371 : 0.001)
        );

        const remainingMeters =
            currentTrip.estimatedDistanceRemainingInMeters?.toNumber?.() ?? 0;
        const remaining = toFixed(
            remainingMeters * (prefersMph ? 0.000621371 : 0.001),
            0
        );

        const cumulativeEnergy = toFixed(
            currentTrip.cumulativeEnergyWh?.toNumber?.() ?? 0
        );

        const maxSpeed = toFixed(
            (currentTrip.maxSpeedInMeters?.toNumber?.() ?? 0) *
                (prefersMph ? 2.23694 : 3.6),
            0
        );

        const avgSpeed = toFixed(
            (currentTrip.avgSpeed?.toNumber?.() ?? 0) *
                (prefersMph ? 2.23694 : 3.6),
            0
        );

        const avgPower = toFixed(currentTrip.avgPower?.toNumber?.() ?? 0, 0);

        const maxSagDisplay = toFixed(
            currentTrip.maxVoltageSag?.toNumber?.() ?? 0,
            1
        );

        const gpsSampleCount = Number(
            (currentTrip.gpsSampleCount as any)?.toNumber?.() ??
                currentTrip.gpsSampleCount ??
                0
        );
        const gpsMaxSpeed = toFixed(
            Number(
                (currentTrip.gpsMaxSpeedInMeters as any)?.toNumber?.() ??
                    currentTrip.gpsMaxSpeedInMeters ??
                    0
            ) * (prefersMph ? 2.23694 : 3.6),
            0
        );
        const gpsAvgSpeed = toFixed(
            Number(
                (currentTrip.gpsAvgSpeed as any)?.toNumber?.() ??
                    currentTrip.gpsAvgSpeed ??
                    0
            ) * (prefersMph ? 2.23694 : 3.6),
            0
        );

        const distanceForWh = currentTrip.distanceInMeters?.toNumber?.() ?? 0;
        const energyForWh = currentTrip.cumulativeEnergyWh?.toNumber?.() ?? 0;
        const whPerUnit = toFixed(
            (energyForWh / distanceForWh) * (prefersMph ? 1609.34 : 1000),
            0
        );

        return {
            distance,
            remaining,
            cumulativeEnergy,
            maxSpeed,
            avgSpeed,
            avgPower,
            whPerUnit,
            startTime: Number(currentTrip.startTime || 0),
            maxVoltageSag: maxSagDisplay,
            gpsMaxSpeed,
            gpsAvgSpeed,
            gpsSampleCount,
        };
    }, [currentTrip, prefersMph]);

    return {
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
    };
};

export default useControllerTelemetry;
