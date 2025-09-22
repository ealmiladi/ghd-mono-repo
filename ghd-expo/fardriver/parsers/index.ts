// src/FardriverParser.ts

import { Packet, ParsersRegistry } from '../interfaces';
import { bytesToString, combineBytes, extractChar } from '../utils/byteHelpers';
import { logError, logInfo, logWarn } from '../utils/logger';
import {
    ControllerState,
    CurrentTrip,
} from '@/fardriver/interfaces/ControllerState';
import { SoCEstimator } from '@/utils/soc-estimator';
import BigNumber from 'bignumber.js';

/**
 * FardriverParser Class
 * Responsible for parsing incoming data packets and updating the application state.
 */
export class FardriverParser {
    private readonly parsers: ParsersRegistry;
    private readonly flashReadAddr: number[];
    private state: ControllerState;

    constructor(state: ControllerState) {
        this.parsers = {};
        this.flashReadAddr = this.initializeFlashReadAddr();
        this.state = state;
        this.registerParsers();
    }

    /**
     * Initializes the FlashReadAddr array based on your specific mapping.
     * Adjust the values according to your application's requirements.
     * @returns Initialized FlashReadAddr array.
     */
    private initializeFlashReadAddr(): number[] {
        // Example initialization; replace with actual values from your FlashReadAddr in C#
        return [
            226, 232, 238, 0, 6, 12, 18, 226, 232, 238, 24, 30, 36, 42, 226,
            232, 238, 48, 93, 99, 105, 226, 232, 238, 124, 130, 136, 142, 226,
            232, 238, 148, 154, 160, 166, 226, 232, 238, 172, 178, 184, 190,
            226, 232, 238, 196, 202, 208, 226, 232, 238, 214, 220, 244, 250,
        ];
    }

    /**
     * Registers all parser functions with their corresponding num2 values.
     * Populate this method with actual parser registrations.
     */
    private registerParsers(): void {
        // Register parser functions based on num2 values

        // 226, 0, 6, 12, 18, 24, 30, 36, 42, 48, 99, 105, 124, 130, 136, 142,
        //     148, 154, 160, 166, 172, 178, 184, 190, 196, 202, 208,

        // log in comment which ones we're missing

        this.parsers[226] = this.parse226.bind(this);
        this.parsers[0] = this.parse0.bind(this);
        this.parsers[6] = this.parse6.bind(this);
        this.parsers[12] = this.parse12.bind(this);
        this.parsers[18] = this.parse18.bind(this);
        this.parsers[24] = this.parse24.bind(this);
        this.parsers[30] = this.parse30.bind(this);
        this.parsers[36] = this.parse36.bind(this);
        this.parsers[42] = this.parse42.bind(this);
        this.parsers[48] = this.parse48.bind(this);

        this.parsers[60] = this.parse60.bind(this);
        this.parsers[66] = this.parse66.bind(this);
        this.parsers[72] = this.parse72.bind(this);
        this.parsers[78] = this.parse78.bind(this);
        this.parsers[84] = this.parse84.bind(this);
        this.parsers[90] = this.parse90.bind(this);
        this.parsers[96] = this.parse96.bind(this);
        this.parsers[154] = this.parse154.bind(this);
        this.parsers[160] = this.parse160.bind(this);
        this.parsers[166] = this.parse166.bind(this);
        this.parsers[172] = this.parse172.bind(this);
        this.parsers[178] = this.parse178.bind(this);
        this.parsers[184] = this.parse184.bind(this);
        this.parsers[190] = this.parse190.bind(this);
        this.parsers[196] = this.parse196.bind(this);
        this.parsers[202] = this.parse202.bind(this);
        this.parsers[208] = this.parse208.bind(this);

        // 99, 105, 124, 130, 136, 142, 148
        this.parsers[99] = this.parse99.bind(this);
        this.parsers[105] = this.parse105.bind(this);
        this.parsers[124] = this.parse124.bind(this);
        this.parsers[130] = this.parse130.bind(this);
        this.parsers[136] = this.parse136.bind(this);
        this.parsers[142] = this.parse142.bind(this);
        this.parsers[148] = this.parse148.bind(this);

        // graph page parsers
        this.parsers[214] = this.parse214.bind(this);
        this.parsers[244] = this.parse244.bind(this);
        this.parsers[232] = this.parse232.bind(this);
        this.parsers[238] = this.parse238.bind(this);
        this.parsers[250] = this.parse250.bind(this);
    }

    private parse244(packet: Packet): void {
        const packetsCombined = combineBytes(packet.data[1], packet.data[0]);
        this.state.motorTemperatureCelcius =
            packetsCombined > 32767 ? packetsCombined - 65536 : packetsCombined;
    }

    private parse208(packet: Packet): void {
        const arg = packet.data;

        this.state.avgPower = arg[3] * 4;
        this.state.avgSpeed = arg[6];

        if (
            !this.state.wheelRatio ||
            !this.state.wheelRadius ||
            !this.state.wheelWidth ||
            !this.state.motorGearRatio
        ) {
            this.state.wheelRatio = arg[4];
            this.state.wheelRadius = arg[5];
            this.state.wheelWidth = arg[7];
            this.state.rateRatio = combineBytes(arg[9], arg[8]);
            this.state.motorGearRatio = this.state.rateRatio / 1000;
        }
    }

    calculateSpeedAndDistance(
        wheelWidth: number, // Tire width in millimeters
        wheelRatio: number, // Aspect ratio (sidewall height as % of width)
        wheelRadiusInches: number, // Rim radius in inches
        gearRatio: number, // Gear ratio
        motorRPM: number, // Motor RPM
        currentTime: number // Timestamp in milliseconds
    ) {
        // Convert inputs to BigNumber for precision
        const width = new BigNumber(wheelWidth);
        const ratio = new BigNumber(wheelRatio).dividedBy(100); // Convert percentage to decimal
        const rimRadius = new BigNumber(wheelRadiusInches);
        const rpm = new BigNumber(motorRPM);
        const gear = new BigNumber(gearRatio);

        // Constants
        const inchesToMeters = new BigNumber(0.0254); // Conversion factor for inches to meters
        const secondsPerMinute = new BigNumber(60);

        // Calculate the tire's overall radius in inches
        const sidewallHeight = width.multipliedBy(ratio).dividedBy(25.4); // Convert mm to inches
        const totalRadiusInches = rimRadius.plus(sidewallHeight);

        // Convert radius to meters
        const radiusMeters = totalRadiusInches.multipliedBy(inchesToMeters);

        // Calculate tire circumference in meters
        const circumferenceMeters = radiusMeters
            .multipliedBy(2)
            .multipliedBy(Math.PI);

        // Calculate speed in meters per second
        const speedInMetersPerSecond = circumferenceMeters
            .multipliedBy(rpm)
            .dividedBy(gear)
            .dividedBy(secondsPerMinute);

        const deltaDistanceInMeters = this.getDistanceTraveledInMeters(
            speedInMetersPerSecond,
            new BigNumber(currentTime)
        );

        return {
            kmh: speedInMetersPerSecond.multipliedBy(3.6).toNumber(), // Convert m/s to km/h
            kph: speedInMetersPerSecond.multipliedBy(3.6).toNumber(), // Alias for km/h
            mph: speedInMetersPerSecond.multipliedBy(2.23694).toNumber(), // Convert m/s to mph
            speedInMetersPerSecond: speedInMetersPerSecond.toNumber(), // Speed in m/s
            deltaDistanceInMeters: deltaDistanceInMeters.toNumber(), // Distance traveled in meters
        };
    }

    private getDistanceTraveledInMeters(
        speedMetersPerSecond: BigNumber,
        currentTime: BigNumber
    ): BigNumber {
        let distance = new BigNumber(0);

        if (!new BigNumber(this.state.lastDistanceUpdateTime).isZero()) {
            const deltaTimeSeconds = currentTime
                .minus(this.state.lastDistanceUpdateTime)
                .dividedBy(1000);

            distance = speedMetersPerSecond.multipliedBy(deltaTimeSeconds);

            this.state.odometerInMeters = new BigNumber(
                this.state.odometerInMeters
            ).plus(distance);
        }

        this.state.lastDistanceUpdateTime = currentTime.toNumber();
        return distance;
    }

    private parse250(packet: Packet): void {
        const arg = packet.data;

        this.state.motorStopState = (arg[5] << 8) | arg[4];
        this.state.motorRunningState = arg[9] << 8;
    }

    private parse214(packet: Packet): void {
        const arg = packet.data;

        this.state.mosTemperatureCelcius = (arg[11] << 8) | arg[10];
        this.state.currentTrip?.recordTemperatureData(
            new BigNumber(this.state.mosTemperatureCelcius),
            new BigNumber(this.state.motorTemperatureCelcius)
        );

        this.state.globalState1 = (arg[3] << 8) | arg[2];
        this.state.globalState2 = (arg[5] << 8) | arg[4];
        this.state.globalState3 = (arg[7] << 8) | arg[6];
        this.state.globalState4 = (arg[9] << 8) | arg[8];

        if ((this.state.globalState2 & 0x08) !== 0) {
            this.state.weakStatus = 'Weak';
            // Update UI element color to Green
        } else {
            this.state.weakStatus = 'MTPA';
            // Update UI element color to Dark Green
        }

        if ((this.state.globalState1 & 0x20) !== 0) {
            this.state.learnStatus = 'AutoLearn';
        } else {
            this.state.learnStatus = '';
        }

        if ((this.state.globalState1 & 0x2000) !== 0) {
            this.state.motorStatus = 'MotorRun';
            // Update UI element color to Dark Blue
        } else {
            this.state.motorStatus = 'MotorStop';
            // Update UI element color to Black
        }
    }

    private parse238(packet: Packet): void {
        const arg = packet.data;

        // Function to handle signed 24-bit numbers
        const toSigned24Bit = (value) => {
            // Check if the 24-bit value is negative (bit 23 is set)
            return value & 0x800000 ? value - 0x1000000 : value;
        };

        // Process phase A current
        let num5 = (arg[4] << 16) | (arg[5] << 8) | arg[6];
        num5 = toSigned24Bit(num5);
        this.state.phaseACurrent = 1.953125 * Math.sqrt(Math.abs(num5));

        // Process phase C current
        num5 = (arg[7] << 16) | (arg[8] << 8) | arg[9];
        num5 = toSigned24Bit(num5);
        this.state.phaseCCurrent = 1.953125 * Math.sqrt(Math.abs(num5));

        // Calculate phase B current
        this.state.phaseBCurrent = -(
            this.state.phaseACurrent + this.state.phaseCCurrent
        );
    }

    private parse232(packet: Packet): void {
        const arg = packet.data;

        const voltageData = (arg[1] << 8) | arg[0];
        this.state.voltage = voltageData / 10.0;
        this.state.smoothVoltage(new BigNumber(this.state.voltage));
        if (this.state.ratedVoltage > 0) {
            this.state.soc = new SoCEstimator(
                this.state.ratedVoltage
            ).calculateSoC(this.state.voltage);
            if (this.state.currentTrip) {
                this.state.currentTrip.ratedVoltage = new BigNumber(
                    this.state.ratedVoltage
                );
            }
        }

        const arg4 = arg[4] ?? 0;
        const arg5 = arg[5] ?? 0;

        const lineCurrentData = (arg5 << 8) | arg4;
        if (
            isNaN(lineCurrentData) ||
            lineCurrentData < 0 ||
            lineCurrentData > 0xffff
        ) {
            console.log('Invalid lineCurrentData:', lineCurrentData);
            console.error('Invalid lineCurrentData:', lineCurrentData);
            return;
        }

        const signedLineCurrentData =
            lineCurrentData & 0x8000
                ? lineCurrentData - 0x10000
                : lineCurrentData;

        const lineCurrent = Number(signedLineCurrentData / 4.0);
        this.state.inputPower = this.state.voltage * lineCurrent;
        this.state.lineCurrent = lineCurrent;
        this.state.throttleDepth = (arg[11] << 8) | arg[10];

        this.startTripIfNeeded();
        this.state.currentTrip?.recordConsumptionData(
            new BigNumber(this.state.voltage),
            new BigNumber(this.state.lineCurrent),
            new BigNumber(this.state.voltageEMA)
        );

        this.state.updateVoltageSag(
            new BigNumber(this.state.voltage),
            new BigNumber(this.state.lineCurrent)
        );
    }

    public parse105(packet: Packet): void {
        // Update flashMemory indices 60 to 65
        this.state.flashMemory[60] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[61] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[62] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[63] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[64] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[65] = combineBytes(
            packet.data[11],
            packet.data[10]
        );

        // Extract parameter index and special code
        this.state.parameterIndex = packet.data[10];
        this.state.specialCode = extractChar(packet.data[11]);

        // Update parameter index secondary based on special code
        if (
            this.state.specialCode >= '0' &&
            this.state.specialCode < '\u007f'
        ) {
            this.state.parameterIndexSecondary = this.state.specialCode;
        } else {
            this.state.parameterIndexSecondary = '_';
        }

        // Update parameter index primary based on parameterIndex value
        if (this.state.parameterIndex < 10) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex + 48
            );
        } else if (this.state.parameterIndex < 20) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex + 48 - 10
            );
        } else {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex
            );
        }

        this.state.distanceL = (packet.data[9] << 8) | packet.data[8];
    }

    public parse124(packet: Packet): void {
        this.state.flashMemory[66] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[67] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[68] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[69] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[70] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[71] = combineBytes(
            packet.data[11],
            packet.data[10]
        );

        const data = packet.data;

        // Compute crcInfoC0
        this.state.crcInfoC0 =
            (data[5] << 24) | (data[4] << 16) | (data[3] << 8) | data[2];

        // Compute crcInfoC1
        this.state.crcInfoC1 =
            (data[9] << 24) | (data[8] << 16) | (data[7] << 8) | data[6];

        // Update total time
        this.state.totalTime = this.state.crcInfoC0;

        this.state.currentTrip?.reconcileEnergyWithControllerTime(
            this.state.totalTime
        );

        // Compute rcvDistanceH
        this.state.distanceH = (data[13] << 8) | data[12];

        // Compute rcvDistance using previously stored rcvDistanceL
        this.state.distance =
            (this.state.distanceH << 16) + this.state.distanceL;
    }

    public parse130(packet: Packet): void {
        this.state.flashMemory[72] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[73] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[74] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[75] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[76] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[77] = combineBytes(
            packet.data[11],
            packet.data[10]
        );
        this.state.controllerVersionMajor = extractChar(packet.data[11]);
        this.state.controllerVersionMinor = extractChar(packet.data[12]);
        this.state.softwareVersion = packet.data[13];
        this.state.hardwareVersion = this.state.controllerVersionMajor;
        this.state.softwareVersionMajor = this.state.controllerVersionMinor;
        this.state.softwareVersionMinor = this.state.softwareVersion;

        const data = packet.data;

        // Compute throttleVoltage
        this.state.throttleVoltage = ((data[1] << 8) | data[0]) * 0.01;

        // Extract rcv_kzqVersion0
        // this.state.rcvKzqVersion0 = String.fromCharCode(data[9])
    }

    public parse136(packet: Packet): void {
        this.state.flashMemory[78] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[79] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[80] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[81] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[82] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[83] = combineBytes(
            packet.data[11],
            packet.data[10]
        );
    }

    public parse142(packet: Packet): void {
        this.state.flashMemory[84] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[85] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[86] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[87] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[88] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[89] = combineBytes(
            packet.data[11],
            packet.data[10]
        );
    }

    public parse148(packet: Packet): void {
        this.state.flashMemory[90] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[91] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[92] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[93] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[94] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[95] = combineBytes(
            packet.data[11],
            packet.data[10]
        );
    }

    /**
     * Parses an incoming byte array packet.
     * @param arg - Incoming byte array (Uint8Array).
     */
    public parsePacket(arg: Uint8Array): void {
        try {
            if (arg.length !== 16) {
                logWarn(
                    `Invalid packet length: ${arg.length}. Expected 16 bytes.`
                );
                return;
            }

            if (arg[0] !== 170) {
                // 0xAA
                logWarn(`Invalid start byte: ${arg[0]}. Expected 170 (0xAA).`);
                return;
            }

            // Check if top two bits are '10'
            if ((arg[1] & 0xc0) === 0x80) {
                const num = arg[1] & 0x7f;
                if (num >= this.flashReadAddr.length) {
                    logWarn(
                        `Received num (${num}) exceeds FlashReadAddr length (${this.flashReadAddr.length}).`
                    );
                    return;
                }

                const num2 = this.flashReadAddr[num];
                this.state.frameReceptionCount += 1;

                this.updateUI(num2);

                const parser = this.parsers[num2];
                if (parser) {
                    const packet: Packet = {
                        startByte: arg[0],
                        idByte: arg[1],
                        data: Array.from(arg.slice(2, 14)),
                        checksum: combineBytes(arg[14], arg[15]),
                    };
                    parser(packet);
                } else {
                    logWarn(`No parser registered for num2: ${num2}.`);
                }
            } else {
                // Handle checksum or other packet types
                this.handleChecksum(arg);
            }
        } catch (error) {
            logError(`Error parsing packet: ${(error as Error).message}`);
        }
    }

    /**
     * Handles packets that do not meet the primary condition.
     * Typically involves checksum verification or other packet types.
     * @param arg - Incoming byte array (Uint8Array).
     */
    private handleChecksum(arg: Uint8Array): void {
        // Implement checksum verification if applicable
        const calculatedChecksum = Array.from(arg.slice(0, 14)).reduce(
            (sum, byte) => sum + byte,
            0
        );
        const receivedChecksum = combineBytes(arg[14], arg[15]);
        if (calculatedChecksum === receivedChecksum) {
            logInfo('Checksum valid.');
            this.state.frameReceptionCount += 1;

            // Update UI elements based on arg[1]
            const idByte = arg[1];
            this.updateUIBasedOnID(idByte, arg);
        } else {
            logWarn(
                `Checksum invalid. Calculated: ${calculatedChecksum}, Received: ${receivedChecksum}.`
            );
        }
    }

    /**
     * Updates UI elements based on the received num2 value.
     * Implement this method to interact with your UI framework/library.
     * @param num2 - Identifier for determining which UI elements to update.
     */
    private updateUI(num2: number): void {
        // Example implementation; replace with actual UI update logic
        logInfo(`Updating UI for num2: ${num2}.`);
        // e.g., Update received frame count, toggle states, text fields, etc.
    }

    /**
     * Updates UI elements based on the ID byte when handling checksum packets.
     * @param idByte - The ID byte from the packet.
     * @param arg - The entire byte array.
     */
    private updateUIBasedOnID(idByte: number, arg: Uint8Array): void {
        // Implement UI updates based on arg[1] values similar to the C# switch statement
        switch (idByte) {
            case 0:
                this.parse0Checksum(arg);
                break;
            case 8:
                this.parse8Checksum(arg);
                break;
            case 9:
                this.parse9Checksum(arg);
                break;
            case 10:
                this.parse10Checksum(arg);
                break;
            case 11:
                this.parse11Checksum(arg);
                break;
            case 12:
                this.parse12Checksum(arg);
                break;
            case 13:
                this.parse13Checksum(arg);
                break;
            case 14:
                this.parse14Checksum(arg);
                break;
            case 15:
                this.parse15Checksum(arg);
                break;
            case 18:
                this.parse18Checksum(arg);
                break;
            case 19:
                this.parse19Checksum(arg);
                break;
            case 20:
                this.parse20Checksum(arg);
                break;
            case 21:
                this.parse21Checksum(arg);
                break;
            case 32:
                this.parse32Checksum(arg);
                break;
            case 41:
                this.parse41Checksum(arg);
                break;
            case 43:
                this.parse43Checksum(arg);
                break;
            case 47:
                this.parse47Checksum(arg);
                break;
            default:
                // Handle other IDs or ignore
                logWarn(`No UI parser registered for ID byte: ${idByte}.`);
                break;
        }
    }

    /**
     * Placeholder methods for checksum-based parsers.
     * Implement these methods similarly to the num2 parsers.
     */

    private parse0Checksum(arg: Uint8Array): void {
        this.genName();
        this.state.isBatteryManagementSystemEnabled = false;
        this.state.followConfiguration = arg[5] & 0x03;
    }

    private parse8Checksum(arg: Uint8Array): void {
        this.state.motorPolePairs = arg[10];
        const num5 = arg[11];
        this.state.isDirectionToggled = num5 !== 0;
        this.state.ratedVoltage = combineBytes(arg[12], arg[13]) / 10;
    }

    private parse9Checksum(arg: Uint8Array): void {
        this.state.ratedSpeed = combineBytes(arg[4], arg[5]);
        this.state.maxSpeed = combineBytes(arg[6], arg[7]);
        this.state.midSpeed = combineBytes(arg[8], arg[9]);

        // Update UI elements related to speed
        logInfo(`Rated Speed: ${this.state.ratedSpeed}`);
        logInfo(`Max Speed: ${this.state.maxSpeed}`);
        logInfo(`Mid Speed: ${this.state.midSpeed}`);
    }

    private parse10Checksum(arg: Uint8Array): void {
        this.state.maxLineCurrent = combineBytes(arg[0], arg[1]) / 4;
        this.state.maxPhaseCurrent = combineBytes(arg[6], arg[7]) / 4;
        this.state.parameterIndex = arg[5];

        if (this.state.parameterIndex < 10) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex + 48
            );
            this.state.parameterIndexSecondary = '_';
        } else if (this.state.parameterIndex < 20) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex + 48 - 10
            );
            this.state.parameterIndexSecondary = 'R';
        } else if (this.state.parameterIndex < 58) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex
            );
            this.state.parameterIndexSecondary =
                this.state.specialCode === '\0' ? '_' : this.state.specialCode;
        } else if (this.state.parameterIndex < 91) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex
            );
            this.state.parameterIndexSecondary = '_';
        } else {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex - 32
            );
            this.state.parameterIndexSecondary = 'R';
        }

        this.state.hallSensorType = arg[6];
        this.state.ratedPowerPercentage = arg[7];
        this.state.ratedPower = arg[7] * 100;

        if (this.state.customMaxPhaseCurrent > 0) {
            logInfo(
                `High Speed Name Value: ${(this.state.maxPhaseCurrent * 100) / this.state.customMaxPhaseCurrent}`
            );
        } else {
            logInfo(`High Speed Name Value: 100.0`);
        }

        this.state.customMaxLineCurrent = this.state.maxLineCurrent;
        this.state.customMaxPhaseCurrent = this.state.maxPhaseCurrent;
    }

    private parse11Checksum(arg: Uint8Array): void {
        this.state.lowVoltageRestoreThreshold =
            combineBytes(arg[8], arg[9]) / 10.0;
        this.state.lowVoltageProtectionThreshold =
            combineBytes(arg[6], arg[7]) / 10.0;
        console.log(
            'Low Voltage Protection Threshold: ',
            this.state.lowVoltageProtectionThreshold
        );
        this.state.stopBackCurrent = combineBytes(arg[10], arg[11]) / 4;
    }

    private parse12Checksum(arg: Uint8Array): void {
        this.state.softwareVersion = arg[13];
        this.state.softwareVersionMinor = this.state.softwareVersion;
    }

    private parse13Checksum(arg: Uint8Array): void {
        this.state.controllerVersionMajor = extractChar(arg[10]);
        this.state.controllerVersionMinor = extractChar(arg[11]);
        this.state.hardwareVersion = this.state.controllerVersionMajor;
        this.state.softwareVersionMajor = this.state.controllerVersionMinor;

        console.log('Controller Version: ', this.state.controllerVersionMajor);

        this.state.batteryRatedCapacityInAh = arg[5];
    }

    private parse14Checksum(arg: Uint8Array): void {
        this.state.customCodePrimary = extractChar(arg[2]);
        this.state.customCodeSecondary = extractChar(arg[3]);
        this.state.customData =
            this.state.customCodePrimary + this.state.customCodeSecondary;
        this.state.hallSensorType = (arg[11] >> 2) & 0x01;

        this.state.parkConfiguration = ((arg[11] >> 1) & 0x01) << 1;
        this.state.lowSpeed = combineBytes(arg[12], arg[13]);
        logInfo(`Low Speed: ${(this.state.lowSpeed * 100) / 12000}`);
    }

    private parse15Checksum(arg: Uint8Array): void {
        if ((arg[4] & 0x01) !== 0 && !this.state.isNewBlueKeyEnabled) {
            this.state.isNewBlueKeyEnabled = true;
        }
    }

    private parse18Checksum(arg: Uint8Array): void {
        if (this.state.isBatteryManagementSystemEnabled) {
            this.state.parameterIndexPrimary = extractChar(arg[2]);
            this.state.parameterIndexSecondary = extractChar(arg[9]);
            this.state.seriesConfiguration = arg[8];
        } else {
            this.state.lowSpeedLineCurrent = Math.round((arg[7] * 100) / 128);
            this.state.midSpeedLineCurrent = Math.round((arg[8] * 100) / 128);
            this.state.lowSpeedPhaseCurrent = Math.round((arg[9] * 100) / 128);
            this.state.midSpeedPhaseCurrent = Math.round((arg[10] * 100) / 128);
            logInfo(
                `High Speed Name Value: ${(this.state.maxPhaseCurrent * 100) / this.state.customMaxPhaseCurrent}`
            );
        }
    }

    private parse19Checksum(arg: Uint8Array): void {
        for (let m = 0; m < 8; m++) {
            this.state.serialBuffer[m] =
                arg[m] > 32 && arg[m] <= 126 ? arg[m] : 32;
        }
        this.state.serialReceptionStatus = 1;
    }

    private parse20Checksum(arg: Uint8Array): void {
        for (let l = 0; l < 12; l++) {
            this.state.serialBuffer[l + 8] =
                arg[l] > 32 && arg[l] <= 126 ? arg[l] : 32;
        }
        if (this.state.serialReceptionStatus === 1) {
            this.state.focusedSerialNumber = bytesToString(
                this.state.serialBuffer
            ).trim();
            if (!this.state.isVCUFrameReceived) {
                this.state.serialNumber = this.state.focusedSerialNumber;
            }
            this.state.serialReceptionStatus = 2;
            this.state.hasSerialNumber = 2;
        }
    }

    private parse21Checksum(arg: Uint8Array): void {
        this.state.enabledMaxLineCurrent = combineBytes(arg[2], arg[3]);
        this.state.enabledMaxPhaseCurrent = combineBytes(arg[4], arg[5]);
        this.state.generalParameter0 = arg[8];
    }

    private parse32Checksum(arg: Uint8Array): void {
        this.state.isBatteryManagementSystemEnabled = true;
        this.genName();
    }

    private parse41Checksum(arg: Uint8Array): void {
        this.state.ratedVoltage = combineBytes(arg[9], arg[10]) / 10;
        this.state.controllerVersionMajor = extractChar(arg[11]);
        this.state.controllerVersionMinor = extractChar(arg[12]);
        this.state.softwareVersion = arg[13];
        this.state.softwareVersionMinor = this.state.softwareVersion;
    }

    private parse43Checksum(arg: Uint8Array): void {
        // Assuming there are fields for OverChargeCurrent and OverDisChargeCurrent
        // Implement accordingly if these fields exist in ControllerState
    }

    private parse47Checksum(arg: Uint8Array): void {
        this.state.customCodePrimary = extractChar(arg[12]);
        this.state.customCodeSecondary = extractChar(arg[13]);
        this.state.customData =
            this.state.customCodePrimary + this.state.customCodeSecondary;
    }

    /**
     * Generates a name based on current state or logic.
     * Implement the actual logic as per your application's requirements.
     */
    private genName(): void {
        // Implement the genName function logic
        logInfo('Generating name...');
        // it's customData, ratedVoltage, maxPhaseAmps
        // Example:
        // this.state.customData = "GeneratedName";
    }

    /**
     * Parser for num2 = 226.
     * @param packet - Parsed packet data.
     */
    private parse226(packet: Packet): void {
        this.genName();
        this.state.isBatteryManagementSystemEnabled = false;
        this.state.hallSensorType = (packet.data[1] >> 5) & 0x01;

        // Adjust indices by subtracting 2 due to the 2-byte offset
        const data = packet.data;

        // UI visibility flags
        this.state.controllerFocVisible = true;
        this.state.controllerBmsVisible = false;
        this.state.bms = false;
        // Extract num4 from data[0]
        let num4 = data[0] & 0x0f;

        // Compute gear
        this.state.gear = num4 & 0x03;

        // Compute xsControl
        this.state.xsControl = (num4 >> 2) & 0x03;

        // Compute rollingV and reversing
        const rollingV = (data[0] >> 5) & 0x01;
        const reversing = (data[0] >> 4) & 0x01;
        // Determine roll state
        if (rollingV === 0) {
            this.state.roll = 0;
        } else if (reversing === 0) {
            if (this.state.gear < 2 || this.state.gear === 3) {
                this.state.roll = 1;
            } else {
                this.state.roll = -1;
            }
        } else if (this.state.gear >= 2 || this.state.gear === 3) {
            this.state.roll = 1;
        } else {
            this.state.roll = -1;
        }

        // Extract PassOk and CompPhoneOk
        this.state.passOk = (data[1] & 0x18) >> 3;
        this.state.compPhoneOk = (data[0] & 0x80) === 0x80;

        // Update function state
        if ((data[1] & 0x80) !== 0) {
            this.state.functionState = 128;
        } else {
            this.state.functionState = 0;
        }

        // Handle errors
        this.handleErrors226(data as any);

        // Update stop state
        this.state.motorCutoffApplied = (data[3] & 0x80) === 0x80;

        // Update modulation
        this.state.modulation = data[4] / 128.0;

        // Compute measure speed
        this.state.rpms = (data[7] << 8) | data[6];

        const hasAllInformationNecessaryToCalculateSpeed =
            this.state.motorGearRatio > 0 &&
            this.state.wheelRadius > 0 &&
            this.state.motorPolePairs > 0;
        if (hasAllInformationNecessaryToCalculateSpeed) {
            const time = new Date().getTime();
            const adjustedRpms =
                this.state.motorPolePairs >= 16
                    ? (this.state.rpms * 4) / this.state.motorPolePairs
                    : this.state.rpms;
            this.state.calculatedSpeed = this.calculateSpeedAndDistance(
                this.state.wheelWidth,
                this.state.wheelRatio,
                this.state.wheelRadius,
                this.state.motorGearRatio,
                adjustedRpms,
                time
            );
            this.state.currentTrip?.recordSpeedAndDistanceData(
                new BigNumber(this.state.rpms),
                new BigNumber(
                    this.state.calculatedSpeed.speedInMetersPerSecond
                ),
                new BigNumber(this.state.calculatedSpeed.deltaDistanceInMeters)
            );
        }

        if ((this.state.motorStopState & 0x02) !== 0) {
            const isCruiseMode = (this.state.motorStopState & 2) !== 0;
            this.setGearAndMode(isCruiseMode ? 'CRUISE' : 'PARKED');
        } else if (this.state.gear === 1) {
            if ((this.state.globalState3 & 0x04) !== 0) {
                this.setGearAndMode('BOOST');
            } else if (this.state.xsControl === 0) {
                this.setGearAndMode('D_LOW');
            } else if (this.state.xsControl === 1) {
                this.setGearAndMode('D_MEDIUM');
            } else {
                this.setGearAndMode('D_HIGH');
            }
        } else if (this.state.gear === 2) {
            this.setGearAndMode('REVERSE');
        } else if (this.state.gear === 0) {
            this.setGearAndMode('NEUTRAL');
        } else {
            this.setGearAndMode('D_LOW');
        }
    }

    /**
     * Parser for num2 = 0.
     * @param packet - Parsed packet data.
     */
    private parse0(packet: Packet): void {
        this.state.flashMemory[0] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[1] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[2] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[3] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[4] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[5] = combineBytes(
            packet.data[11],
            packet.data[10]
        );
    }

    /**
     * Parser for num2 = 6.
     * @param packet - Parsed packet data.
     */
    private parse6(packet: Packet): void {
        this.state.flashMemory[6] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[7] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[8] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[9] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[10] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[11] = combineBytes(
            packet.data[11],
            packet.data[10]
        );

        // Use local variables instead of state properties
        const arg = packet.data[0];
        const num3 = (packet.data[5] & 0x80) >> 7;
        this.updateDirection(num3);

        const cfg11l = packet.data[10];
        const cfg11h = packet.data[11];
        this.state.parkConfiguration = (cfg11h >> 5) & 0x03;
    }

    /**
     * Parser for num2 = 12.
     * @param packet - Parsed packet data.
     */
    private parse12(packet: Packet): void {
        this.state.flashMemory[12] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[13] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[14] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[15] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[16] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[17] = combineBytes(
            packet.data[11],
            packet.data[10]
        );
    }

    /**
     * Parser for num2 = 18.
     * @param packet - Parsed packet data.
     */
    private parse18(packet: Packet): void {
        this.state.flashMemory[18] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[19] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[20] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[21] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[22] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[23] = combineBytes(
            packet.data[11],
            packet.data[10]
        );

        this.state.motorPolePairs = packet.data[4];
        if (this.state.currentTrip) {
            this.state.currentTrip.motorPolePairs = new BigNumber(
                this.state.motorPolePairs
            );
        }
        this.state.maxSpeed = combineBytes(packet.data[7], packet.data[6]);
        this.updateSpeedUI(this.state.maxSpeed);
        this.state.ratedVoltage =
            combineBytes(packet.data[11], packet.data[10]) / 10;

        this.state.ratedPower = combineBytes(packet.data[9], packet.data[8]);
        this.state.ratedPowerPercentage = this.state.ratedPower / 100;
    }

    private parse24(packet: Packet): void {
        // Update flashMemory indices 24 to 29
        this.state.flashMemory[24] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[25] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[26] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[27] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[28] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[29] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        this.state.ratedSpeed = combineBytes(packet.data[1], packet.data[0]);
        this.state.batteryRatedCapacityInAh = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        if (this.state.currentTrip) {
            this.state.currentTrip.ratedCapacityAh = new BigNumber(
                this.state.batteryRatedCapacityInAh
            );
        }

        this.state.maxLineCurrent =
            combineBytes(packet.data[3], packet.data[2]) / 4;
        this.state.followConfiguration = packet.data[6] & 0x03;

        logInfo(`Rated Speed: ${this.state.ratedSpeed}`);
        logInfo(
            `Battery Rated Capacity: ${this.state.batteryRatedCapacityInAh}`
        );
        logInfo(`Max Line Current: ${this.state.maxLineCurrent}`);
        logInfo(`Follow Configuration: ${this.state.followConfiguration}`);
    }

    // Continue updating the rest of the parser methods similarly...

    /**
     * Updates the direction status based on the received flag.
     * @param num3 - Direction flag.
     */
    private updateDirection(num3: number): void {
        this.state.isDirectionToggled = num3 !== 0;
    }

    /**
     * Updates the speed UI elements based on max speed.
     * @param maxSpeed - Maximum speed value.
     */
    private updateSpeedUI(maxSpeed: number): void {
        const speedPercentage = (maxSpeed * 100) / 12000;
        logInfo(`High Speed Name Value: ${speedPercentage}`);
        // Update UI element accordingly
        this.state.highSpeedNameValue = speedPercentage;
    }

    /**
     * Updates the mid speed UI elements based on mid speed.
     * @param midSpeed - Mid speed value.
     */
    private updateMidSpeedUI(midSpeed: number): void {
        const speedPercentage = (midSpeed * 100) / 12000;
        logInfo(`Mid Speed Name Value: ${speedPercentage}`);
        // Update UI element accordingly
        this.state.midSpeedNameValue = speedPercentage;
    }

    private parse30(packet: Packet): void {
        // Update flashMemory indices 30 to 35
        this.state.flashMemory[30] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[31] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[32] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[33] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[34] = combineBytes(
            packet.data[10],
            packet.data[11]
        );
        // Since packet.data[12] and packet.data[13] may not exist, default to 0
        this.state.flashMemory[35] = combineBytes(
            packet.data[12] || 0,
            packet.data[13] || 0
        );

        // Extract custom codes from packet data
        this.state.customCodePrimary = extractChar(packet.data[4]);
        this.state.customCodeSecondary = extractChar(packet.data[5]);
        this.state.customData =
            this.state.customCodePrimary + this.state.customCodeSecondary;

        // Extract relay delay value
        this.state.relayDelay = combineBytes(packet.data[6], packet.data[7]);

        this.state.lowVoltageProtectionThreshold =
            combineBytes(packet.data[3], packet.data[2]) / 10.0;
        this.state.lowVoltageRestoreThreshold =
            this.state.lowVoltageProtectionThreshold + 2.0;

        // Update toggle states based on relayDelay bits
        this.state.isHighSpeedToggled =
            ((this.state.relayDelay >> 4) & 1) === 1;
        this.state.isLeftTurnToggled = ((this.state.relayDelay >> 1) & 1) === 1;
        this.state.isParkingGearToggled =
            ((this.state.relayDelay >> 2) & 1) === 1;
        this.state.isBrakeControlToggled = (this.state.relayDelay & 1) === 1;
        this.state.isAutoBackProtectionToggled =
            ((this.state.relayDelay >> 3) & 1) === 1;
        this.state.isPushAssistToggled =
            ((this.state.relayDelay >> 6) & 1) === 1;
        this.state.isGearMemoryEnabled =
            ((this.state.relayDelay >> 10) & 1) === 1;
        this.state.isForceDriveSystemEnabled =
            ((this.state.relayDelay >> 7) & 1) === 1;

        logInfo(
            `Parsed num2 = 30: CustomCode=${this.state.customData}, RelayDelay=${this.state.relayDelay}`
        );
    }

    private parse36(packet: Packet): void {
        // Update flashMemory indices 36 to 41
        this.state.flashMemory[36] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[37] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[38] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[39] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[40] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[41] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract time information
        this.state.minutes = packet.data[1];
        this.state.hours = packet.data[2];

        // Extract custom max currents
        this.state.customMaxLineCurrent =
            combineBytes(packet.data[4], packet.data[5]) / 4;
        this.state.customMaxPhaseCurrent =
            combineBytes(packet.data[6], packet.data[7]) / 4;

        this.state.lowSpeed = combineBytes(packet.data[8], packet.data[9]);

        // Update low speed percentage
        this.state.lowSpeedLineCurrent = (this.state.lowSpeed * 100) / 12000;

        logInfo(
            `Parsed num2 = 36: Time=${this.state.hours}:${this.state.minutes}, CustomMaxLineCurrent=${this.state.customMaxLineCurrent}, CustomMaxPhaseCurrent=${this.state.customMaxPhaseCurrent}, LowSpeed=${this.state.lowSpeed}`
        );
    }

    private parse42(packet: Packet): void {
        // Update flashMemory indices 42 to 47
        this.state.flashMemory[42] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[43] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[44] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[45] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[46] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[47] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract mid speed and max phase current
        this.state.midSpeed = combineBytes(packet.data[0], packet.data[1]);
        this.state.maxPhaseCurrent =
            combineBytes(packet.data[7], packet.data[6]) / 4;

        // Update mid speed percentage
        this.updateMidSpeedUI(this.state.midSpeed);

        // Calculate high speed name value
        if (this.state.customMaxPhaseCurrent > 0) {
            this.state.highSpeedNameValue =
                (this.state.maxPhaseCurrent * 100) /
                this.state.customMaxPhaseCurrent;
        } else {
            this.state.highSpeedNameValue = 100.0;
        }

        logInfo(
            `Parsed num2 = 42: MidSpeed=${this.state.midSpeed}, MaxPhaseCurrent=${this.state.maxPhaseCurrent}`
        );
    }

    private parse48(packet: Packet): void {
        // Update flashMemory indices 48 to 53
        this.state.flashMemory[48] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[49] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[50] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[51] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[52] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[53] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract low and mid speed line currents
        this.state.lowSpeedLineCurrent = Math.round(
            (packet.data[6] * 100) / 128
        );
        this.state.midSpeedLineCurrent = Math.round(
            (packet.data[7] * 100) / 128
        );
        this.state.lowSpeedPhaseCurrent = Math.round(
            (packet.data[8] * 100) / 128
        );
        this.state.midSpeedPhaseCurrent = Math.round(
            (packet.data[9] * 100) / 128
        );

        // Extract stop back current
        this.state.stopBackCurrent = combineBytes(
            packet.data[0],
            packet.data[1]
        );

        logInfo(
            `Parsed num2 = 48: LowSpeedLineCurrent=${this.state.lowSpeedLineCurrent}, MidSpeedLineCurrent=${this.state.midSpeedLineCurrent}`
        );
    }

    private parse99(packet: Packet): void {
        this.state.flashMemory[54] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[55] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[56] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[57] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[58] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[59] = combineBytes(
            packet.data[11],
            packet.data[10]
        );

        // Extract max line and phase currents
        this.state.enabledMaxLineCurrent =
            combineBytes(packet.data[1], packet.data[0]) / 4;
        this.state.enabledMaxPhaseCurrent =
            combineBytes(packet.data[3], packet.data[2]) / 4;

        // we're missing enabledMaxLineCurrent and enabledMaxPhaseCurrent

        // this.state.motorGearRatio = packet.data[4];
        // console.log(this.state.motorGearRatio);
    }

    private parse60(packet: Packet): void {
        // Update flashMemory indices 60 to 65
        this.state.flashMemory[60] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[61] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[62] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[63] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[64] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[65] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract parameter index and special code
        this.state.parameterIndex = packet.data[12];
        this.state.specialCode = extractChar(packet.data[13]);

        // Update parameter index primary and secondary
        if (
            this.state.specialCode >= '0' &&
            this.state.specialCode <= '~' // '~' is ASCII 126
        ) {
            this.state.parameterIndexSecondary = this.state.specialCode;
        } else {
            this.state.parameterIndexSecondary = '_';
        }

        if (this.state.parameterIndex < 10) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex + 48
            );
        } else if (this.state.parameterIndex < 20) {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex + 48 - 10
            );
        } else {
            this.state.parameterIndexPrimary = String.fromCharCode(
                this.state.parameterIndex
            );
        }

        logInfo(
            `Parsed num2 = 60: ParameterIndex=${this.state.parameterIndex}, SpecialCode=${this.state.specialCode}`
        );
    }

    private parse66(packet: Packet): void {
        // Update flashMemory indices 66 to 71
        this.state.flashMemory[66] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[67] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[68] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[69] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[70] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[71] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse72(packet: Packet): void {
        // Update flashMemory indices 72 to 77
        this.state.flashMemory[72] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[73] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[74] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[75] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[76] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[77] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract controller version and software version
        this.state.controllerVersionMajor = extractChar(packet.data[10]);
        this.state.controllerVersionMinor = extractChar(packet.data[11]);
        this.state.softwareVersion = packet.data[12];

        // Update hardware and software versions
        this.state.hardwareVersion = this.state.controllerVersionMajor;
        this.state.softwareVersionMajor = this.state.controllerVersionMinor;
        this.state.softwareVersionMinor = this.state.softwareVersion;

        logInfo(
            `Parsed num2 = 72: ControllerVersion=${this.state.controllerVersionMajor}.${this.state.controllerVersionMinor}, SoftwareVersion=${this.state.softwareVersion}`
        );
    }

    private parse78(packet: Packet): void {
        // Update flashMemory indices 78 to 83
        this.state.flashMemory[78] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[79] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[80] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[81] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[82] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[83] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse84(packet: Packet): void {
        // Update flashMemory indices 84 to 89
        this.state.flashMemory[84] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[85] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[86] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[87] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[88] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[89] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse90(packet: Packet): void {
        // Update flashMemory indices 90 to 95
        this.state.flashMemory[90] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[91] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[92] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[93] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[94] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[95] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse96(packet: Packet): void {
        // Update flashMemory indices 96 to 101
        this.state.flashMemory[96] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[97] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[98] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[99] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[100] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[101] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse154(packet: Packet): void {
        // Update flashMemory indices 154 to 159
        this.state.flashMemory[154] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[155] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[156] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[157] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[158] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[159] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse160(packet: Packet): void {
        // Update flashMemory indices 160 to 165
        this.state.flashMemory[160] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[161] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[162] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[163] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[164] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[165] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract serial buffer data
        // Extract serial buffer data
        for (let i = 2; i < 12; i++) {
            this.state.serialBuffer[i - 2] =
                packet.data[i] > 32 && packet.data[i] <= 126
                    ? packet.data[i]
                    : 32;
        }
        this.state.serialReceptionStatus = 1;
        this.state.serialReceptionStatus = 1;

        logInfo(`Parsed num2 = 160: Serial buffer updated.`);
    }

    private parse166(packet: Packet): void {
        // Update flashMemory indices 108 to 113
        this.state.flashMemory[108] = combineBytes(
            packet.data[1],
            packet.data[0]
        );
        this.state.flashMemory[109] = combineBytes(
            packet.data[3],
            packet.data[2]
        );
        this.state.flashMemory[110] = combineBytes(
            packet.data[5],
            packet.data[4]
        );
        this.state.flashMemory[111] = combineBytes(
            packet.data[7],
            packet.data[6]
        );
        this.state.flashMemory[112] = combineBytes(
            packet.data[9],
            packet.data[8]
        );
        this.state.flashMemory[113] = combineBytes(
            packet.data[11],
            packet.data[10]
        );

        // Adjusted for loop to process bytes starting from packet.data[0]
        for (let i = 0; i < 10; i++) {
            const dataByte = packet.data[i];
            this.state.serialBuffer[i + 10] =
                dataByte > 32 && dataByte <= 126 ? dataByte : 32;
        }

        // Process serial number if reception status is 1
        if (this.state.serialReceptionStatus === 1) {
            this.state.focusedSerialNumber = bytesToString(
                this.state.serialBuffer
            ).trim();
            if (!this.state.isVCUFrameReceived) {
                this.state.serialNumber = this.state.focusedSerialNumber;
            }
            this.state.serialReceptionStatus = 2;
            this.state.hasSerialNumber = 2;
        }

        logInfo(`Parsed num2 = 166: Serial number updated.`);
    }

    private parse172(packet: Packet): void {
        // Update flashMemory indices 172 to 177
        this.state.flashMemory[172] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[173] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[174] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[175] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[176] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[177] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse178(packet: Packet): void {
        // Update flashMemory indices 178 to 183
        this.state.flashMemory[178] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[179] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[180] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[181] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[182] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[183] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private parse184(packet: Packet): void {
        // Update flashMemory indices 184 to 189
        this.state.flashMemory[184] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[185] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[186] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[187] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[188] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[189] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract general parameter 0 and EnModify
        this.state.generalParameter0 = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        // EnModify is bits 12 and 13 of generalParameter0
        this.state.enModify = (this.state.generalParameter0 >> 12) & 0x03;

        // Check for new blue key flag
        if ((packet.data[11] & 0x80) !== 0 && !this.state.isNewBlueKeyEnabled) {
            this.state.isNewBlueKeyEnabled = true;
        }

        logInfo(
            `Parsed num2 = 184: GeneralParameter0=${this.state.generalParameter0}, EnModify=${this.state.enModify}`
        );
    }

    private parse190(packet: Packet): void {
        // Update flashMemory indices 190 to 195
        this.state.flashMemory[190] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[191] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[192] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[193] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[194] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[195] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract configuration and acceleration coefficient
        const cfg190l = packet.data[0];
        const cfg190h = packet.data[1];
        this.state.accelerationCoefficient = packet.data[1] >> 4;

        logInfo(
            `Parsed num2 = 190: AccelerationCoefficient=${this.state.accelerationCoefficient}`
        );
    }

    private parse196(packet: Packet): void {
        // Update flashMemory indices 196 to 201
        this.state.flashMemory[196] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[197] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[198] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[199] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[200] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[201] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Extract throttle insert value
        this.state.throttleInsert = combineBytes(
            packet.data[8],
            packet.data[9]
        );

        logInfo(
            `Parsed num2 = 196: ThrottleInsert=${this.state.throttleInsert}`
        );
    }

    private parse202(packet: Packet): void {
        // Update flashMemory indices 202 to 207
        this.state.flashMemory[202] = combineBytes(
            packet.data[0],
            packet.data[1]
        );
        this.state.flashMemory[203] = combineBytes(
            packet.data[2],
            packet.data[3]
        );
        this.state.flashMemory[204] = combineBytes(
            packet.data[4],
            packet.data[5]
        );
        this.state.flashMemory[205] = combineBytes(
            packet.data[6],
            packet.data[7]
        );
        this.state.flashMemory[206] = combineBytes(
            packet.data[8],
            packet.data[9]
        );
        this.state.flashMemory[207] = combineBytes(
            packet.data[10],
            packet.data[11]
        );

        // Additional logic can be added here if needed
    }

    private handleErrors226(data: Uint8Array): void {
        // Adjust indices based on the 2-byte offset
        // data[2] corresponds to arg[4] in the original C# code
        const errorByte1 = data[2];
        const errorByte2 = data[3];

        // Initialize an array to hold error objects with title and description
        let breakDownMessages: { title: string; description: string }[] = [];

        // Check if there are no errors
        if (errorByte1 === 0 && (errorByte2 & 0x7f) === 0) {
            this.state.errorNum++;
            if (this.state.errorNum === 6) {
                this.state.controllerFaults = [];
            }
        } else {
            // Reset error counter
            this.state.errorNum = 0;

            // Build the error messages based on the bits set in errorByte1 and errorByte2

            // Error 1: Motor Hall Error
            if ((errorByte1 & 0x01) !== 0) {
                breakDownMessages.push({
                    title: '1. Motor Hall Error',
                    description:
                        'The motor hall sensor is faulty or disconnected.',
                });
            }

            // Error 2: Throttle Error
            if ((errorByte1 & 0x02) !== 0) {
                breakDownMessages.push({
                    title: '2. Throttle Error',
                    description:
                        'The throttle input is out of range or faulty.',
                });
            }

            // Error 3: Current Protect Restart
            if ((errorByte1 & 0x04) !== 0) {
                breakDownMessages.push({
                    title: '3. Current Protect Restart',
                    description:
                        'The controller has restarted due to overcurrent protection.',
                });
            }

            // Error 4: Phase Current Surge Protect
            if ((errorByte1 & 0x08) !== 0) {
                breakDownMessages.push({
                    title: '4. Phase Current Surge Protect',
                    description: 'Sudden surge detected in phase current.',
                });
            }

            // Error 5 or 18: Voltage Alarm
            if ((errorByte1 & 0x10) !== 0) {
                if ((this.state.globalState2 & 0x8000) !== 0) {
                    // Over Voltage Alarm
                    breakDownMessages.push({
                        title: '5. Over Voltage Alarm',
                        description: 'Input voltage exceeds the maximum limit.',
                    });
                } else {
                    // Under Voltage Alarm
                    breakDownMessages.push({
                        title: '18. Under Voltage Alarm',
                        description:
                            'Input voltage is below the minimum threshold.',
                    });
                }
            }

            // Error 6: Alarm Protect
            if ((errorByte1 & 0x20) !== 0) {
                breakDownMessages.push({
                    title: '6. Alarm Protect',
                    description: 'Security alarm has been triggered.',
                });
                this.state.fdalarm = true;
            } else {
                this.state.fdalarm = false;
            }

            // Error 7: Motor Temp Protect
            if ((errorByte1 & 0x40) !== 0) {
                breakDownMessages.push({
                    title: '7. Motor Temp Protect',
                    description:
                        'Motor temperature exceeds safe operating limits.',
                });
            }

            // Error 8: Controller Temp Protect
            if ((errorByte1 & 0x80) !== 0) {
                breakDownMessages.push({
                    title: '8. Controller Temp Protect',
                    description:
                        'Controller temperature exceeds safe operating limits.',
                });
            }

            // Error 9: Phase Current Overflow Protect
            if ((errorByte2 & 0x01) !== 0) {
                breakDownMessages.push({
                    title: '9. Phase Current Overflow Protect',
                    description:
                        'Phase current has exceeded the maximum allowable value.',
                });
            }

            // Error 10: Phase Zero Error
            if ((errorByte2 & 0x02) !== 0) {
                breakDownMessages.push({
                    title: '10. Phase Zero Error',
                    description: 'Phase zero-crossing error detected.',
                });
            }

            // Error 11 or 17: Phase Short or Lost Alarm
            if ((errorByte2 & 0x04) !== 0) {
                if ((this.state.globalState1 & 0x0800) !== 0) {
                    // Phase Lost Alarm
                    breakDownMessages.push({
                        title: '17. Phase Lost Alarm',
                        description:
                            'One or more motor phases are not detected.',
                    });
                } else {
                    // Phase Short Alarm
                    breakDownMessages.push({
                        title: '11. Phase Short Alarm',
                        description:
                            'Short circuit detected in motor phase wiring.',
                    });
                }
            }

            // Error 12: Line Current Zero Error
            if ((errorByte2 & 0x08) !== 0) {
                breakDownMessages.push({
                    title: '12. Line Current Zero Error',
                    description: 'Line current zero-crossing error detected.',
                });
            }

            // Error 13: MOSFET High Side Error
            if ((errorByte2 & 0x10) !== 0) {
                breakDownMessages.push({
                    title: '13. MOSFET High Side Error',
                    description: 'High side MOSFET failure detected.',
                });
            }

            // Error 14: MOSFET Low Side Error
            if ((errorByte2 & 0x20) !== 0) {
                breakDownMessages.push({
                    title: '14. MOSFET Low Side Error',
                    description: 'Low side MOSFET failure detected.',
                });
            }

            // Error 15: MOE Current Protect
            if ((errorByte2 & 0x40) !== 0) {
                breakDownMessages.push({
                    title: '15. MOE Current Protect',
                    description: 'Motor overcurrent event detected.',
                });
            }

            // Error 16: Brake Alarm
            if ((this.state.motorStopState & 0x8000) !== 0) {
                breakDownMessages.push({
                    title: '16. Brake Alarm',
                    description: 'Brake system error detected.',
                });
            }

            // Update the controller faults in the state with the detailed error messages
            this.state.controllerFaults = breakDownMessages;
        }
    }

    private setGearAndMode(status: string) {
        switch (status) {
            case 'CRUISE':
                this.state.gearMode = 'Cruise';
                this.state.gearPowerMode = 'C';
                break;
            case 'PARKED':
                this.state.gearMode = 'Parked';
                this.state.gearPowerMode = 'P';
                break;
            case 'D_LOW':
                this.state.gearMode = 'Drive';
                this.state.gearPowerMode = '1';
                break;
            case 'D_MEDIUM':
                this.state.gearMode = 'Drive';
                this.state.gearPowerMode = '2';
                break;
            case 'D_HIGH':
                this.state.gearMode = 'Drive';
                this.state.gearPowerMode = '3';
                break;
            case 'REVERSE':
                this.state.gearMode = 'Reverse';
                this.state.gearPowerMode = 'R';
                break;
            case 'BOOST':
                this.state.gearMode = 'Boost';
                this.state.gearPowerMode = 'B';
                break;
            case 'NEUTRAL':
                this.state.gearMode = 'Neutral';
                this.state.gearPowerMode = 'N';
                break;
            default:
                break;
        }
    }

    private startTripIfNeeded() {
        if (this.state.lineCurrent > 0 && !this.state.currentTrip) {
            const trip = new CurrentTrip();
            trip.startTime = new BigNumber(new Date().getTime());
            trip.startVoltage = new BigNumber(this.state.voltage);
            trip.voltage = new BigNumber(this.state.voltage);
            trip.ratedVoltage = new BigNumber(this.state.ratedVoltage);
            trip.ratedCapacityAh = new BigNumber(
                this.state.batteryRatedCapacityInAh
            );
            trip.motorPolePairs = new BigNumber(this.state.motorPolePairs);
            trip.lowVoltageProtectionThreshold =
                this.state.lowVoltageProtectionThreshold;
            this.state.currentTrip = trip;
        }
    }
}
