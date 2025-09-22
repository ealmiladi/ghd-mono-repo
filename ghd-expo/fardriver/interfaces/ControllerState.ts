// src/AppState.ts
import BigNumber from 'bignumber.js';
import { SoCEstimator } from '@/utils/soc-estimator';
import { EnergyIntegrator } from '@/fardriver/utils/EnergyIntegrator';

const OBSERVER_INTERVAL_IN_MS = 2000;
const RESTING_CURRENT_THRESHOLD = new BigNumber(5);
const LOAD_CURRENT_THRESHOLD = new BigNumber(20);
const RESTING_VOLTAGE_ALPHA = new BigNumber(0.1);

export class ControllerState {
    // Flash memory array
    public flashMemory: number[];

    // Frame reception count
    public frameReceptionCount: number;

    // Battery Management System flag
    public isBatteryManagementSystemEnabled: boolean;

    // Language/Country flag
    public isChineseLanguage: boolean;

    // Versioning information
    public controllerVersionMajor: string;
    public controllerVersionMinor: string;
    public softwareVersion: number;
    public softwareVersionMajor: number | string;
    public softwareVersionMinor: number;

    // Configuration indices
    public motorPolePairs: number;
    public followConfiguration: number;
    public parkConfiguration: number;

    // Speed and voltage ratings
    public maxSpeed: number;
    public ratedVoltage: number;
    public ratedPower: number;
    public ratedPowerPercentage: number;
    public ratedSpeed: number;
    public lowSpeed: number;
    public midSpeed: number;
    public maxPhaseCurrent: number;
    public maxLineCurrent: number;
    public customMaxLineCurrent: number;
    public customMaxPhaseCurrent: number;
    public stopBackCurrent: number;

    // Relay and direction configurations
    public relayDelay: number;
    public seriesConfiguration: number;
    public enabledMaxLineCurrent: number;
    public enabledMaxPhaseCurrent: number;

    // Motor and battery parameters
    public batteryRatedCapacityInAh: number;
    public hallSensorType: number;
    public generalParameter0: number;

    // Custom codes and serial numbers
    public customCodePrimary: string;
    public customCodeSecondary: string;
    public customData: string;
    public specialCode: string;
    public parameterIndexPrimary: string;
    public parameterIndexSecondary: string;
    public parameterIndex: number;

    // Serial reception status and buffers
    public serialReceptionStatus: number;
    public serialBuffer: number[];

    // Timing variables
    public minutes: number;
    public hours: number;
    public lowSpeedLineCurrent: number;
    public midSpeedLineCurrent: number;
    public lowSpeedPhaseCurrent: number;
    public midSpeedPhaseCurrent: number;

    // Motor direction toggles
    public isDirectionToggled: boolean = false;
    public isHighSpeedToggled: boolean = false;
    public isLeftTurnToggled: boolean;
    public isParkingGearToggled: boolean;
    public isBrakeControlToggled: boolean;
    public isAutoBackProtectionToggled: boolean;
    public isPushAssistToggled: boolean;
    public isGearMemoryEnabled: boolean;
    public isForceDriveSystemEnabled: boolean;

    // Version and serial number flags
    public isNewBlueKeyEnabled: boolean;
    public isVCUFrameReceived: boolean;
    public hasSerialNumber: number;

    // Other miscellaneous parameters
    public morseCodeSignal: number;
    public hardwareVersion: string = '';
    public highSpeedNameValue: number = 0;
    public midSpeedNameValue: number = 0;
    public serialNumber: any = '';
    public focusedSerialNumber: string = '';
    public throttleInsert: number = 0;
    public lowVoltageRestoreThreshold: number = 0;
    public lowVoltageProtectionThreshold: number = 0;
    public ratedVoltageDisplayName: string = '';
    public observers = new Map<
        string,
        (newValue: any, oldValue: any) => void
    >();

    // not sure what this is
    public enModify: number = 0;

    public accelerationCoefficient: number = 0;
    public isReceivedVCUFrame: boolean = false;
    public serialNumberFoc: any = '';
    public motorDiameter: number = 0;
    public voltage: number = 0;
    public lineCurrent: number = 0;
    public inputPower: number = 0;
    public throttleDepth: number = 0;
    public throttleVoltage: any = 0;
    phaseACurrent: number = 0;
    phaseCCurrent: number = 0;
    phaseBCurrent: number = 0;
    avgPower: number = 0;
    avgSpeed: number = 0;
    motorTemperatureCelcius: number = 0;
    mosTemperatureCelcius: number = 0;
    globalState1: number = 0;
    globalState2: number = 0;
    globalState3: number = 0;
    globalState4: number = 0;
    weakStatus: string = '';
    learnStatus: string = '';
    motorStatus: string = '';
    motorStopState: number = 0;
    motorRunningState: number = 0;
    distanceL: number = 0;
    distanceH: number = 0;
    distance: number = 0;
    crcInfoC0: number = 0;
    crcInfoC1: number = 0;
    totalTime: number = 0;
    rpms: number = 0;

    public controllerFocVisible: boolean = false;
    public controllerBmsVisible: boolean = false;
    public bms: boolean = false;
    public gear: number = 0;
    public xsControl: number = 0;
    public roll: number = 0;
    public passOk: number = 0;
    public compPhoneOk: boolean = false;
    public functionState: number = 0;
    public motorCutoffApplied: boolean = false;
    public modulation: number = 0;
    public controllerFaults: { title: string; description: string }[] = [];
    public error: boolean = false;
    public errorNum: number = 0;
    public alarmMessage: string = '';
    public alarmMessageColor: string = '';
    public fdalarm: boolean = false;
    soc: any = '';
    gearMode: string = '';
    gearPowerMode: string = '';
    motorGearRatio: number = 0;

    wheelRatio: number = 0;
    wheelRadius: number = 0;
    wheelWidth: number = 0;
    rateRatio: number = 0;
    calculatedSpeed: {
        kmh: number;
        kph: number;
        mph: number;
        speedInMetersPerSecond: number;
        deltaDistanceInMeters: number;
    } = {
        kmh: 0,
        mph: 0,
        kph: 0,
        speedInMetersPerSecond: 0,
        deltaDistanceInMeters: 0,
    };
    odometerInMeters: BigNumber = new BigNumber(0);
    currentTrip: CurrentTrip | null = null;
    lastDistanceUpdateTime: number = 0;

    public voltageEMA: BigNumber = new BigNumber(0);
    public smoothingFactor = new BigNumber(0.15);
    public restingVoltageEMA: BigNumber = new BigNumber(0);
    public voltageSag: BigNumber = new BigNumber(0);
    public maxVoltageSag: BigNumber = new BigNumber(0);
    public maxVoltageSagCurrent: BigNumber = new BigNumber(0);
    public maxVoltageSagTimestamp: number = 0;

    smoothVoltage(newVoltage: BigNumber) {
        if (this.voltageEMA.isZero()) {
            this.voltageEMA = newVoltage;
        }
        this.voltageEMA = newVoltage
            .multipliedBy(this.smoothingFactor)
            .plus(
                this.voltageEMA.multipliedBy(
                    new BigNumber(1).minus(this.smoothingFactor)
                )
            );
    }

    updateVoltageSag(voltage: BigNumber, lineCurrent: BigNumber) {
        const absoluteCurrent = lineCurrent.abs();

        if (absoluteCurrent.lte(RESTING_CURRENT_THRESHOLD)) {
            if (this.restingVoltageEMA.isZero()) {
                this.restingVoltageEMA = voltage;
            }
            this.restingVoltageEMA = voltage
                .multipliedBy(RESTING_VOLTAGE_ALPHA)
                .plus(
                    this.restingVoltageEMA.multipliedBy(
                        new BigNumber(1).minus(RESTING_VOLTAGE_ALPHA)
                    )
                );
        }

        if (
            absoluteCurrent.gte(LOAD_CURRENT_THRESHOLD) &&
            !this.restingVoltageEMA.isZero()
        ) {
            const sag = BigNumber.maximum(
                this.restingVoltageEMA.minus(voltage),
                new BigNumber(0)
            );
            this.voltageSag = sag;
            const timestamp = Date.now();

            if (sag.gt(this.maxVoltageSag)) {
                this.maxVoltageSag = sag;
                this.maxVoltageSagCurrent = lineCurrent;
                this.maxVoltageSagTimestamp = timestamp;
            }

            this.currentTrip?.recordVoltageSag(
                sag,
                lineCurrent,
                timestamp
            );
        } else {
            this.voltageSag = new BigNumber(0);
        }
    }

    constructor() {
        this.flashMemory = Array(160).fill(0);
        this.frameReceptionCount = 0;
        this.isBatteryManagementSystemEnabled = false;
        this.isChineseLanguage = false;

        // Versioning
        this.controllerVersionMajor = '0';
        this.controllerVersionMinor = '0';
        this.softwareVersion = 0;
        this.softwareVersionMajor = 0;
        this.softwareVersionMinor = 0;

        // Configurations
        this.motorPolePairs = 0;
        this.followConfiguration = 0;
        this.parkConfiguration = 0;

        // Speed and voltage
        this.maxSpeed = 0;
        this.ratedVoltage = 0;
        this.ratedPower = 0;
        this.ratedPowerPercentage = 0;
        this.ratedSpeed = 0;
        this.lowSpeed = 0;
        this.midSpeed = 0;
        this.maxPhaseCurrent = 0;
        this.maxLineCurrent = 0;
        this.customMaxLineCurrent = 0;
        this.customMaxPhaseCurrent = 0;
        this.stopBackCurrent = 0;

        // Relay and direction
        this.relayDelay = 0;
        this.seriesConfiguration = 0;
        this.enabledMaxLineCurrent = 0;
        this.enabledMaxPhaseCurrent = 0;

        // Motor and battery
        this.batteryRatedCapacityInAh = 0;
        this.hallSensorType = 0;
        this.generalParameter0 = 0;

        // Custom codes
        this.customCodePrimary = ' ';
        this.customCodeSecondary = ' ';
        this.customData = '';
        this.specialCode = ' ';
        this.parameterIndexPrimary = '0';
        this.parameterIndexSecondary = '_';
        this.parameterIndex = 0;

        // Serial reception
        this.serialReceptionStatus = 0;
        this.serialBuffer = Array(14).fill(32);

        // Timing
        this.minutes = 0;
        this.hours = 0;
        this.lowSpeedLineCurrent = 0;
        this.midSpeedLineCurrent = 0;
        this.lowSpeedPhaseCurrent = 0;
        this.midSpeedPhaseCurrent = 0;

        // Direction toggles
        this.isDirectionToggled = false;
        this.isHighSpeedToggled = false;
        this.isLeftTurnToggled = false;
        this.isParkingGearToggled = false;
        this.isBrakeControlToggled = false;
        this.isAutoBackProtectionToggled = false;
        this.isPushAssistToggled = false;
        this.isGearMemoryEnabled = false;
        this.isForceDriveSystemEnabled = false;

        // Flags
        this.isNewBlueKeyEnabled = false;
        this.isVCUFrameReceived = false;
        this.hasSerialNumber = 0;

        // Miscellaneous
        this.morseCodeSignal = 0;

        // Observers
        return new Proxy(this, {
            set: (target, key, value) => {
                if (key in target) {
                    const oldValue = target[key as keyof this];
                    target[key as keyof this] = value;

                    const observer = this.observers.get(key as string);
                    if (observer) observer(value, oldValue);
                    return true;
                } else {
                    console.warn(
                        `Property "${String(key)}" does not exist on ControllerState.`
                    );
                    return false;
                }
            },
        });
    }

    onReceive(key: string, callback: (newValue: any, oldValue: any) => void) {
        this.observers.set(key, callback);
    }

    off(key: string) {
        this.observers.delete(key);
    }

    allOff() {
        this.observers.clear();
    }

    endTrip() {
        if (this.currentTrip) {
            this.currentTrip = null;
        }
    }

    setGearRatio(number: number) {
        if (number) this.motorGearRatio = number;
    }

    setWheelWidth(number: number) {
        if (number) this.wheelWidth = number;
    }

    setWheelRatio(number: number) {
        if (number) this.wheelRatio = number;
    }

    setWheelRadius(number: number | undefined) {
        if (number) this.wheelRadius = number;
    }

    public reconcileEnergyWithControllerTime(rawTotalTime: number) {
        this.currentTrip?.reconcileEnergyWithControllerTime(rawTotalTime);
    }
}

export class CurrentTrip {
    public id: string = '';
    public maxInputPower: BigNumber = new BigNumber(0);
    public maxSpeedInMeters: BigNumber = new BigNumber(0);
    public maxRPM: BigNumber = new BigNumber(0);

    public route: RoutePoint[] = [];
    private lastRouteSampleTimestamp: number = 0;

    public lastVoltageSag: BigNumber = new BigNumber(0);
    public maxVoltageSag: BigNumber = new BigNumber(0);
    public maxVoltageSagCurrent: BigNumber = new BigNumber(0);
    public maxVoltageSagTimestamp: number = 0;
    public gpsMaxSpeedInMeters: BigNumber = new BigNumber(0);
    public gpsCumulativeSpeed: BigNumber = new BigNumber(0);
    public gpsSampleCount: BigNumber = new BigNumber(0);
    public gpsAvgSpeed: BigNumber = new BigNumber(0);

    // implement the rest of the properties later
    public maxPhaseACurrent: BigNumber = new BigNumber(0);
    public maxPhaseBCurrent: BigNumber = new BigNumber(0);
    public maxPhaseCCurrent: BigNumber = new BigNumber(0);
    public phaseACurrent: BigNumber = new BigNumber(0);
    public phaseBCurrent: BigNumber = new BigNumber(0);
    public phaseCCurrent: BigNumber = new BigNumber(0);

    public maxVoltage: BigNumber = new BigNumber(0);
    public minVoltage: BigNumber = new BigNumber(Infinity);
    public maxLineCurrent: BigNumber = new BigNumber(0);

    public startVoltage: BigNumber = new BigNumber(0);
    public endVoltage: BigNumber = new BigNumber(0);
    public voltage: BigNumber = new BigNumber(0);

    public avgSpeed: BigNumber = new BigNumber(0);
    public avgPower: BigNumber = new BigNumber(0);

    public mosTemperatureCelcius: BigNumber = new BigNumber(0);
    public motorTemperatureCelcius: BigNumber = new BigNumber(0);

    public startTime: BigNumber = new BigNumber(0);
    public endTime: BigNumber = new BigNumber(0);
    public lastTotalWhUpdateTime: BigNumber = new BigNumber(0);
    public distanceInMeters: BigNumber = new BigNumber(0);

    // New cumulative totals for averages
    public cumulativeSpeed: BigNumber = new BigNumber(0);
    public cumulativeEnergyWh: BigNumber = new BigNumber(0);
    public ratedCapacityAh: BigNumber = new BigNumber(0);

    private readingCount: BigNumber = new BigNumber(0); // Number of speed and power readings

    private lastPublishToObserver: BigNumber = new BigNumber(Date.now());
    private onTripUpdateCallback: ((trip: CurrentTrip) => void) | null = null;

    public estimatedDistanceRemainingInMeters: BigNumber = new BigNumber(0);
    public ratedVoltage: BigNumber = new BigNumber(0);
    public motorPolePairs: BigNumber = new BigNumber(0);
    public maxInputPowerVoltage: BigNumber = new BigNumber(0);
    public maxInputPowerCurrent: BigNumber = new BigNumber(0);
    public lowVoltageProtectionThreshold: number = 0;

    private readonly energyIntegrator = new EnergyIntegrator({
        timeTrackerOptions: {
            controllerTimeUnitInMs: 60000,
            maxControllerDeltaMs: 600000,
        },
    });

    private lastVoltageEMA: BigNumber = new BigNumber(0);

    reconcileEnergyWithControllerTime(rawTotalTime: number) {
        const correction = this.energyIntegrator.applyControllerTimestamp(
            rawTotalTime
        );

        if (!correction.isZero()) {
            this.applyEnergyDelta(correction, this.lastVoltageEMA);
        }
    }

    private incrementTotalWh(
        watts: BigNumber,
        currentTime: BigNumber,
        voltageEMA: BigNumber
    ) {
        const energyDelta = this.energyIntegrator.recordSample(
            watts,
            currentTime.toNumber()
        );

        this.lastTotalWhUpdateTime = currentTime;
        this.lastVoltageEMA = voltageEMA;

        if (!energyDelta.isZero()) {
            this.applyEnergyDelta(energyDelta, voltageEMA);
        } else {
            this.updateRangeEstimate(voltageEMA);
        }
    }

    private applyEnergyDelta(
        deltaEnergyWh: BigNumber,
        voltageEMA: BigNumber
    ) {
        if (deltaEnergyWh.isZero()) {
            return;
        }

        this.cumulativeEnergyWh = this.cumulativeEnergyWh.plus(deltaEnergyWh);
        this.updateRangeEstimate(voltageEMA);
    }

    private updateRangeEstimate(voltageEMA: BigNumber) {
        const distanceFactor = this.distanceInMeters.gt(0)
            ? this.cumulativeEnergyWh.dividedBy(this.distanceInMeters)
            : new BigNumber(0);

        const remaining = this.calculateRangeMeters(
            this.ratedVoltage,
            voltageEMA,
            this.ratedCapacityAh,
            distanceFactor,
            this.lowVoltageProtectionThreshold
        );

        this.estimatedDistanceRemainingInMeters = remaining.isNaN()
            ? new BigNumber(0)
            : remaining;
    }

    calculateRangeMeters(
        nominalVoltage: BigNumber,
        currentVoltage: BigNumber,
        ratedCapacityAh: BigNumber,
        energyConsumptionPerMeter: BigNumber,
        lowVoltageProtectionThreshold: number
    ) {
        if (currentVoltage.isLessThan(lowVoltageProtectionThreshold)) {
            return new BigNumber(0);
        }

        // Get SoC from non-linear voltage curve
        const soc = new SoCEstimator(this.ratedVoltage.toNumber()).calculateSoC(
            currentVoltage.toNumber()
        );

        // Use SoC to estimate remaining energy
        const totalCapacityWh = nominalVoltage.multipliedBy(ratedCapacityAh);
        const remainingEnergyWh = new BigNumber(soc * 0.01)
            .multipliedBy(totalCapacityWh)
            .multipliedBy(0.95); // 90% efficiency

        // Calculate range
        const rangeMeters = remainingEnergyWh.dividedBy(
            energyConsumptionPerMeter
        );

        return BigNumber.max(rangeMeters, new BigNumber(0)); // Ensure non-negative result
    }

    recordConsumptionData(
        voltage: BigNumber,
        lineCurrent: BigNumber,
        voltageEMA: BigNumber
    ) {
        const inputPower = voltage.multipliedBy(lineCurrent);
        this.incrementTotalWh(
            inputPower,
            new BigNumber(Date.now()),
            voltageEMA
        );

        if (inputPower.gt(this.maxInputPower)) {
            this.maxInputPower = inputPower;
            this.maxInputPowerVoltage = voltage;
            this.maxInputPowerCurrent = lineCurrent;
        }
        this.maxLineCurrent = BigNumber.maximum(
            this.maxLineCurrent,
            lineCurrent
        );
        this.maxVoltage = BigNumber.maximum(this.maxVoltage, voltage);
        this.minVoltage = BigNumber.minimum(this.minVoltage, voltage);
        this.voltage = voltage;
        this.endVoltage = voltage;
    }

    recordTemperatureData(
        mosTemperature: BigNumber,
        motorTemperature: BigNumber
    ) {
        if (!this.mosTemperatureCelcius.eq(mosTemperature)) {
            this.mosTemperatureCelcius = mosTemperature;
        }
        if (!this.motorTemperatureCelcius.eq(motorTemperature)) {
            this.motorTemperatureCelcius = motorTemperature;
        }
    }

    registerTripObserver(callback: (trip: CurrentTrip) => void) {
        this.onTripUpdateCallback = callback;
    }

    publishTripUpdate() {
        if (this.onTripUpdateCallback) {
            this.onTripUpdateCallback(this);
        }
    }

    recordSpeedAndDistanceData(
        rpm: BigNumber,
        speedMetersPerSecond: BigNumber,
        deltaDistanceInMeters: BigNumber
    ) {
        this.maxSpeedInMeters = BigNumber.maximum(
            this.maxSpeedInMeters,
            speedMetersPerSecond
        );

        this.maxRPM = BigNumber.maximum(this.maxRPM, rpm);
        this.readingCount = this.readingCount.plus(1);
        this.cumulativeSpeed = this.cumulativeSpeed.plus(speedMetersPerSecond);
        this.distanceInMeters =
            this.distanceInMeters.plus(deltaDistanceInMeters) ||
            new BigNumber(0);

        if (
            new BigNumber(Date.now())
                .minus(this.lastPublishToObserver)
                .gt(OBSERVER_INTERVAL_IN_MS)
        ) {
            this.calculateAverages();
            this.publishTripUpdate();
            this.lastPublishToObserver = new BigNumber(Date.now());
        }
    }

    recordGpsSpeed(speedMetersPerSecond: number) {
        if (!Number.isFinite(speedMetersPerSecond) || speedMetersPerSecond < 0) {
            return;
        }

        const speed = new BigNumber(speedMetersPerSecond);
        this.gpsSampleCount = this.gpsSampleCount.plus(1);
        this.gpsCumulativeSpeed = this.gpsCumulativeSpeed.plus(speed);
        if (!this.gpsSampleCount.isZero()) {
            this.gpsAvgSpeed = this.gpsCumulativeSpeed.dividedBy(
                this.gpsSampleCount
            );
        }
        if (speed.gt(this.gpsMaxSpeedInMeters)) {
            this.gpsMaxSpeedInMeters = speed;
        }
    }

    recordVoltageSag(
        sag: BigNumber,
        lineCurrent: BigNumber,
        timestamp: number
    ) {
        this.lastVoltageSag = sag;
        if (sag.gt(this.maxVoltageSag)) {
            this.maxVoltageSag = sag;
            this.maxVoltageSagCurrent = lineCurrent;
            this.maxVoltageSagTimestamp = timestamp;
        }
    }

    calculateAverages(endTime: BigNumber = new BigNumber(Date.now())) {
        if (this.startTime.gt(0)) {
            const totalTimeSeconds = endTime
                .minus(this.startTime)
                .dividedBy(1000);
            const totalTimeHours = totalTimeSeconds.dividedBy(3600);

            // Correct average speed using total distance
            this.avgSpeed = totalTimeSeconds.gt(0)
                ? this.distanceInMeters.dividedBy(totalTimeSeconds)
                : new BigNumber(0); // Distance-based average speed

            // Average power remains unchanged
            this.avgPower = totalTimeHours.gt(0)
                ? this.cumulativeEnergyWh.dividedBy(totalTimeHours)
                : new BigNumber(0); // Energy-based average power
        }
    }

    performEndTripCalculations() {
        if (this.endTime.eq(0)) {
            this.endTime = new BigNumber(Date.now());
        }
        this.calculateAverages(this.endTime);
    }

    recordRoutePoint(sample: RoutePoint) {
        if (
            sample.latitude === undefined ||
            sample.longitude === undefined ||
            Number.isNaN(sample.latitude) ||
            Number.isNaN(sample.longitude)
        ) {
            return;
        }

        const timestamp = sample.timestamp ?? Date.now();

        if (
            this.lastRouteSampleTimestamp !== 0 &&
            timestamp - this.lastRouteSampleTimestamp < 800
        ) {
            return;
        }

        if (this.route.length > 0) {
            const lastPoint = this.route[this.route.length - 1];
            if (timestamp <= lastPoint.timestamp) {
                return;
            }
        }

        const newPoint: RoutePoint = {
            timestamp,
            latitude: sample.latitude,
            longitude: sample.longitude,
            altitude: sample.altitude ?? null,
            heading: sample.heading ?? null,
            speedMps:
                sample.speedMps === undefined
                    ? null
                    : Number(sample.speedMps),
            lineCurrent:
                sample.lineCurrent === undefined
                    ? null
                    : Number(sample.lineCurrent),
            voltage:
                sample.voltage === undefined ? null : Number(sample.voltage),
            inputPower:
                sample.inputPower === undefined
                    ? null
                    : Number(sample.inputPower),
            mosTemperature:
                sample.mosTemperature === undefined
                    ? null
                    : Number(sample.mosTemperature),
            motorTemperature:
                sample.motorTemperature === undefined
                    ? null
                    : Number(sample.motorTemperature),
        };

        this.route.push(newPoint);
        this.lastRouteSampleTimestamp = timestamp;
    }
}

export interface RoutePoint {
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    heading: number | null;
    speedMps: number | null;
    lineCurrent: number | null;
    voltage: number | null;
    inputPower: number | null;
    mosTemperature: number | null;
    motorTemperature: number | null;
}
