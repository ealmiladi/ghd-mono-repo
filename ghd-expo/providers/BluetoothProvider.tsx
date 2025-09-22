import { useUser } from '@/providers/UserContextProvider';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import BLEService from '@/services/BLEService';
import { Controller } from '@/interfaces/Controller';
import { Device } from 'react-native-ble-plx';
import { FardriverParser } from '@/fardriver/parsers';
import {
    ControllerState,
    CurrentTrip,
} from '@/fardriver/interfaces/ControllerState';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { IS_SIMULATOR_MODE } from '@/utils/env';
import BigNumber from 'bignumber.js';

const BluetoothConnectionsContext = createContext<any>({});
const bleService = new BLEService();

const CHARACTERISTIC_UUID = '0000ffec-0000-1000-8000-00805f9b34fb';
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';

const sleepFunction = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const REAL_SIMULATION_INTERVAL_MS = 1000;

const RealBluetoothConnectionsProvider = ({ children }: any) => {
    const { controllers, loadingControllers } = useUser();
    const controllerStates = useRef<Record<string, ControllerState>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [scannedDevices, setScannedDevices] = useState<any[]>([]);
    const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
    const [deviceLoadingStates, setDeviceLoadingStates] = useState<any[]>([]);
    const navigation: any = useNavigation();
    const { t } = useTranslation();
    const userInitiatedDisconnect = useRef(false);

    const disconnectFromDevice = useCallback(async (device: Device) => {
        try {
            userInitiatedDisconnect.current = true;
            await device.cancelConnection();
        } catch (error) {
            console.log('Error disconnecting from device:', error);
        }
    }, []);

    useEffect(() => {
        if (!loadingControllers) {
            refreshBle();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingControllers]);

    useEffect(() => {
        return () => bleService.disconnectEverything();
    }, []);

    const connectToDevice = useCallback(
        async (device: Device) => {
            setDeviceLoadingStates((prevStates) => ({
                ...prevStates,
                [device.name!]: true,
            }));

            await sleepFunction(1000);

            try {
                await bleService.connectToDevice(device);

                const connectedDevice =
                    await bleService.discoverAllServicesAndCharacteristicsForDevice(
                        device
                    );

                device.onDisconnected((error, device) => {
                    setIsScanning(false);
                    subscription?.remove();
                    console.log(
                        'Device disconnected at',
                        new Date().getTime(),
                        connectedDevice.name,
                        ` user initiated: ${userInitiatedDisconnect.current}`
                    );

                    if (device && !userInitiatedDisconnect.current) {
                        refreshBle();
                    }
                    userInitiatedDisconnect.current = false;

                    const controllerState =
                        controllerStates.current[
                            (connectedDevice.name || connectedDevice.localName)!
                        ];
                    if (controllerState?.currentTrip) {
                        controllerState.currentTrip.performEndTripCalculations();
                        firestore()
                            .collection('controllers')
                            .doc(controller.serialNumber)
                            .collection('trips')
                            .add(
                                JSON.parse(
                                    JSON.stringify(controllerState.currentTrip)
                                )
                            );
                        Toast.show({
                            type: 'success',
                            text1: t('bt.deviceDisconnected'),
                            text2: t('trip.savedTrip'),
                        });
                        controllerState.endTrip();
                    }

                    setConnectedDevices((prevDevices) =>
                        prevDevices.filter(
                            (d) => d.name !== connectedDevice.name
                        )
                    );
                });
                setScannedDevices((prevDevices) =>
                    prevDevices.filter((d) => d.name !== connectedDevice.name)
                );
                setConnectedDevices((prevDevices) => {
                    if (
                        prevDevices.some((d) => d.name === connectedDevice.name)
                    ) {
                        return prevDevices;
                    }
                    return [...prevDevices, connectedDevice];
                });

                const existingController = controllersRef.current.find(
                    (c: Controller) => c.localName === connectedDevice.name
                );

                const controllerState = new ControllerState();
                controllerState.setWheelWidth(
                    existingController?.tireWidth || undefined
                );
                controllerState.setWheelRatio(
                    existingController?.tireAspectRatio || undefined
                );
                controllerState.setWheelRadius(
                    existingController?.rimDiameter / 2 || undefined
                );
                controllerState.setGearRatio(
                    existingController?.gearRatio || undefined
                );
                const controller: Controller = {
                    ...existingController,
                    state: controllerState,
                    device: connectedDevice,
                };
                if (existingController) {
                    existingController.state = controllerState;
                    existingController.device = connectedDevice;
                }
                controllerStates.current[
                    (connectedDevice.name || connectedDevice.localName)!
                ] = controllerState;
                const farDriverParser = new FardriverParser(controllerState);
                const subscription =
                    bleService.manager.monitorCharacteristicForDevice(
                        connectedDevice.id,
                        SERVICE_UUID,
                        CHARACTERISTIC_UUID,
                        (error, characteristic) => {
                            if (error) {
                                return;
                            }

                            if (!characteristic?.value) {
                                return;
                            }

                            const binaryString = atob(characteristic.value);

                            const uintArray = new Uint8Array(
                                binaryString.length
                            );
                            for (let i = 0; i < binaryString.length; i++) {
                                uintArray[i] = binaryString.charCodeAt(i);
                            }

                            farDriverParser.parsePacket(
                                new Uint8Array(uintArray)
                            );
                        }
                    );

                if (!existingController) {
                    navigation.navigate('AddDeviceModal', {
                        controller,
                    });
                }
            } catch (error) {
                console.error('Error connecting to device:', error);
            } finally {
                setDeviceLoadingStates((prevStates) => ({
                    ...prevStates,
                    [device.name!]: false,
                }));
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [navigation, t]
    );

    const controllersRef = useRef(controllers);

    useEffect(() => {
        controllersRef.current = controllers;
    }, [controllers]);

    const refreshBle = useCallback(async () => {
        setIsScanning(true);
        try {
            await bleService.initializeBLE();
        } catch (error) {
            console.log('Error initializing BLE:', error);
            setIsScanning(false);
            return;
        }

        try {
            await bleService.scanDevices(
                async (device: Device) => {
                    if (
                        !device.services ||
                        !device.serviceUUIDs?.some(
                            (service) => service === SERVICE_UUID
                        )
                    ) {
                        console.log('Ignoring device', device.name);
                        return;
                    }
                    setScannedDevices((prevDevices) => {
                        if (
                            prevDevices.some((d) => d.id === device.id) ||
                            !device.name
                        ) {
                            return prevDevices;
                        }
                        const existingController = controllersRef.current.find(
                            (c: Controller) => {
                                return c.localName === device.name;
                            }
                        );
                        if (existingController) {
                            connectToDevice(device);
                        }
                        return [...prevDevices, device];
                    });
                },
                [SERVICE_UUID],
                () => setIsScanning(false)
            );
        } catch (error) {
            console.log('Error scanning for devices:', error);
        }
    }, [connectToDevice, controllersRef]);

    const { unconnectedDevices } = useMemo(() => {
        const connectedDeviceIds = connectedDevices.map(
            (device: Device) => device.id
        );
        const unconnectedDevices = scannedDevices.filter(
            (device: Device) => !connectedDeviceIds.includes(device.id)
        );
        return { unconnectedDevices };
    }, [scannedDevices, connectedDevices]);

    const stopScan = useCallback(() => {
        bleService.stopScan();
        setIsScanning(false);
    }, []);

    return (
        <BluetoothConnectionsContext.Provider
            value={{
                scannedDevices,
                connectToDevice,
                connectedDevices,
                unconnectedDevices,
                refreshBle,
                deviceLoadingStates,
                controllerStates,
                stopScan,
                isScanning,
                disconnectFromDevice,
            }}
        >
            {children}
        </BluetoothConnectionsContext.Provider>
    );
};

const computeSimulatedSpeed = (rpm: number, controller: Controller) => {
    const wheelWidth = controller.tireWidth ?? 120;
    const wheelRatio = controller.tireAspectRatio ?? 70;
    const rimDiameter = controller.rimDiameter ?? 12;
    const gearRatio = controller.gearRatio && controller.gearRatio > 0 ? controller.gearRatio : 11;

    const sidewallInches = (wheelWidth * (wheelRatio / 100)) / 25.4;
    const rimRadiusInches = rimDiameter / 2;
    const totalRadiusInches = rimRadiusInches + sidewallInches;
    const radiusMeters = totalRadiusInches * 0.0254;
    const circumferenceMeters = 2 * Math.PI * radiusMeters;

    const speedInMetersPerSecond =
        (circumferenceMeters * rpm) / gearRatio / 60;
    const kmh = speedInMetersPerSecond * 3.6;
    const mph = speedInMetersPerSecond * 2.23694;

    return {
        speedInMetersPerSecond,
        kmh,
        mph,
        deltaDistanceInMeters:
            speedInMetersPerSecond * (REAL_SIMULATION_INTERVAL_MS / 1000),
    };
};

const SimulatedBluetoothConnectionsProvider = ({ children }: any) => {
    const { controllers, loadingControllers } = useUser();
    const controllerStates = useRef<Record<string, ControllerState>>({});
    const simulationTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [scannedDevices, setScannedDevices] = useState<any[]>([]);
    const [connectedDevices, setConnectedDevices] = useState<any[]>([]);
    const [deviceLoadingStates, setDeviceLoadingStates] = useState<
        Record<string, boolean>
    >({});

    const ensureControllerState = useCallback(
        (controller: Controller, deviceName: string) => {
            if (controllerStates.current[deviceName]) {
                return controllerStates.current[deviceName];
            }
            const state = new ControllerState();
            state.serialNumber = controller.serialNumber;
            state.hasSerialNumber = 1;
            state.gearMode = 'Drive';
            state.gearPowerMode = '2';
            state.motorPolePairs = (controller as any).motorPolePairs || 16;
            state.ratedVoltage = (controller as any).ratedVoltage || 72;
            state.batteryRatedCapacityInAh =
                (controller as any).batteryRatedCapacity ?? 60;
            state.motorGearRatio = controller.gearRatio ?? 11;
            state.wheelRatio = controller.tireAspectRatio ?? 70;
            state.wheelWidth = controller.tireWidth ?? 120;
            state.wheelRadius = controller.rimDiameter
                ? controller.rimDiameter / 2
                : 6;
            controllerStates.current[deviceName] = state;
            controller.state = state as any;
            return state;
        },
        []
    );

    const stopSimulation = useCallback((deviceId: string) => {
        const timer = simulationTimers.current[deviceId];
        if (timer) {
            clearInterval(timer);
            delete simulationTimers.current[deviceId];
        }
    }, []);

    const startSimulation = useCallback(
        (device: any, controller: Controller) => {
            const deviceName = device.name;
            const state = ensureControllerState(controller, deviceName);
            controller.device = device;
            const ratedVoltage = (controller as any).ratedVoltage || 72;
            const capacityAh = (controller as any).batteryRatedCapacity ?? 60;

            if (!state.currentTrip) {
                const trip = new CurrentTrip();
                const now = Date.now();
                trip.startTime = new BigNumber(now);
                trip.startVoltage = new BigNumber(ratedVoltage);
                trip.voltage = new BigNumber(ratedVoltage);
                trip.ratedVoltage = new BigNumber(ratedVoltage);
                trip.ratedCapacityAh = new BigNumber(capacityAh);
                trip.motorPolePairs = new BigNumber(state.motorPolePairs || 16);
                state.currentTrip = trip;
            }

            let tick = 0;
            stopSimulation(device.id);
            const timer = setInterval(() => {
                tick += 1;
                const rpm = Math.max(
                    0,
                    2200 + 600 * Math.sin(tick / 4)
                );
                const current = 80 + 35 * Math.sin(tick / 3);
                const voltage =
                    ratedVoltage - 2 * Math.sin(tick / 8) - tick * 0.01;
                const tempshift = Math.sin(tick / 5);
                const speedMetrics = computeSimulatedSpeed(rpm, controller);

                state.rpms = Math.round(rpm);
                state.lineCurrent = Number(current.toFixed(1));
                state.maxLineCurrent = Math.max(
                    state.maxLineCurrent || 0,
                    Math.abs(current)
                );
                state.voltage = Number(voltage.toFixed(1));
                state.inputPower = Math.round(Math.abs(current * voltage));
                state.mosTemperatureCelcius = 44 + 5 * tempshift;
                state.motorTemperatureCelcius = 46 + 6 * tempshift;
                state.calculatedSpeed = {
                    mph: Number(speedMetrics.mph.toFixed(0)),
                    kph: Number(speedMetrics.kmh.toFixed(0)),
                    kmh: Number(speedMetrics.kmh.toFixed(0)),
                    speedInMetersPerSecond: Number(
                        speedMetrics.speedInMetersPerSecond.toFixed(2)
                    ),
                    deltaDistanceInMeters: speedMetrics.deltaDistanceInMeters,
                };
                state.gearMode = 'Drive';
                state.gearPowerMode = '2';
                state.soc = `${Math.max(12, 96 - tick * 0.25).toFixed(1)}%`;

                const trip = state.currentTrip as CurrentTrip;
                const rpmBn = new BigNumber(rpm);
                const speedBn = new BigNumber(
                    speedMetrics.speedInMetersPerSecond
                );
                const deltaBn = new BigNumber(
                    speedMetrics.deltaDistanceInMeters
                );
                const voltageBn = new BigNumber(voltage);
                const lineCurrentBn = new BigNumber(Math.abs(current));

                trip.recordSpeedAndDistanceData(rpmBn, speedBn, deltaBn);
                trip.recordConsumptionData(
                    voltageBn,
                    lineCurrentBn,
                    voltageBn
                );
                trip.recordTemperatureData(
                    new BigNumber(state.mosTemperatureCelcius),
                    new BigNumber(state.motorTemperatureCelcius)
                );
                trip.recordGpsSpeed(speedMetrics.speedInMetersPerSecond);
                trip.publishTripUpdate();
            }, REAL_SIMULATION_INTERVAL_MS);

            simulationTimers.current[device.id] = timer;
        },
        [ensureControllerState, stopSimulation]
    );

    const buildDeviceForController = useCallback(
        (controller: Controller) => {
            const name =
                controller.localName ||
                controller.name ||
                controller.serialNumber ||
                'Simulated Controller';
            const id = `sim-${name}`;
            return {
                id,
                name,
                localName: name,
                controller,
                rssi: -40,
            };
        },
        []
    );

    const disconnectFromDevice = useCallback(
        async (device: any) => {
            stopSimulation(device.id);
            setConnectedDevices((prev) =>
                prev.filter((existing) => existing.id !== device.id)
            );
            setScannedDevices((prev) => {
                if (prev.find((existing) => existing.id === device.id)) {
                    return prev;
                }
                return [...prev, device];
            });
        },
        [stopSimulation]
    );

    const connectToDevice = useCallback(
        async (device: any) => {
            setDeviceLoadingStates((prev) => ({
                ...prev,
                [device.name]: true,
            }));
            const controller: Controller = device.controller;
            await sleepFunction(300);
            startSimulation(device, controller);
            device.cancelConnection = async () => {
                await disconnectFromDevice(device);
            };
            setConnectedDevices((prev) => {
                if (prev.find((existing) => existing.id === device.id)) {
                    return prev;
                }
                return [...prev, device];
            });
            setScannedDevices((prev) =>
                prev.filter((existing) => existing.id !== device.id)
            );
            setDeviceLoadingStates((prev) => ({
                ...prev,
                [device.name]: false,
            }));
        },
        [disconnectFromDevice, startSimulation]
    );

    const refreshBle = useCallback(async () => {
        setIsScanning(true);
        await sleepFunction(200);
        const connectedIds = new Set(connectedDevices.map((d) => d.id));
        const nextDevices = controllers.map((controller) =>
            buildDeviceForController(controller)
        );
        setScannedDevices(
            nextDevices.filter((device) => !connectedIds.has(device.id))
        );
        setIsScanning(false);
    }, [buildDeviceForController, connectedDevices, controllers]);

    useEffect(() => {
        if (!loadingControllers) {
            refreshBle();
        }
    }, [loadingControllers, refreshBle]);

    useEffect(() => {
        return () => {
            Object.values(simulationTimers.current).forEach((timer) =>
                clearInterval(timer)
            );
        };
    }, []);

    const unconnectedDevices = useMemo(() => {
        const connectedIds = new Set(connectedDevices.map((d) => d.id));
        return scannedDevices.filter(
            (device) => !connectedIds.has(device.id)
        );
    }, [connectedDevices, scannedDevices]);

    const stopScan = useCallback(() => {
        setIsScanning(false);
    }, []);

    return (
        <BluetoothConnectionsContext.Provider
            value={{
                scannedDevices,
                connectToDevice,
                connectedDevices,
                unconnectedDevices,
                refreshBle,
                deviceLoadingStates,
                controllerStates,
                stopScan,
                isScanning,
                disconnectFromDevice,
            }}
        >
            {children}
        </BluetoothConnectionsContext.Provider>
    );
};

const BluetoothConnectionsProvider = ({ children }: any) => {
    if (IS_SIMULATOR_MODE) {
        return (
            <SimulatedBluetoothConnectionsProvider>
                {children}
            </SimulatedBluetoothConnectionsProvider>
        );
    }
    return (
        <RealBluetoothConnectionsProvider>
            {children}
        </RealBluetoothConnectionsProvider>
    );
};

const useDevices = () => {
    const context = useContext(BluetoothConnectionsContext);
    if (context === undefined) {
        throw new Error(
            'useDevices must be used within a BluetoothConnectionsProvider'
        );
    }
    return context;
};

export { BluetoothConnectionsProvider, useDevices };
