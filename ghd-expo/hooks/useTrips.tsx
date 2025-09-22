import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { CurrentTrip } from '@/fardriver/interfaces/ControllerState';
import { IS_SIMULATOR_MODE } from '@/utils/env';
import BigNumber from 'bignumber.js';

const createSimulatedTrip = (id: string, config: {
    distanceMeters: number;
    energyWh: number;
    remainingMeters: number;
    maxSpeedMeters: number;
    avgSpeedMeters: number;
    avgPower: number;
    startOffsetMinutes: number;
    durationMinutes: number;
    maxLineCurrent: number;
    maxPhaseCurrent: number;
    gpsSampleCount: number;
    gpsAvgSpeed: number;
    gpsMaxSpeed: number;
    endVoltage: number;
    startVoltage: number;
}) => {
    const trip = new CurrentTrip();
    trip.id = id;
    trip.distanceInMeters = new BigNumber(config.distanceMeters);
    trip.cumulativeEnergyWh = new BigNumber(config.energyWh);
    trip.estimatedDistanceRemainingInMeters = new BigNumber(
        config.remainingMeters
    );
    trip.maxSpeedInMeters = new BigNumber(config.maxSpeedMeters);
    trip.avgSpeed = new BigNumber(config.avgSpeedMeters);
    trip.avgPower = new BigNumber(config.avgPower);
    const endTime = Date.now() - config.startOffsetMinutes * 60 * 1000;
    const startTime = endTime - config.durationMinutes * 60 * 1000;
    trip.startTime = new BigNumber(startTime);
    trip.endTime = new BigNumber(endTime);
    trip.maxRPM = new BigNumber(3200);
    trip.maxLineCurrent = new BigNumber(config.maxLineCurrent);
    trip.maxPhaseCurrent = new BigNumber(config.maxPhaseCurrent);
    trip.gpsSampleCount = new BigNumber(config.gpsSampleCount);
    trip.gpsAvgSpeed = new BigNumber(config.gpsAvgSpeed);
    trip.gpsMaxSpeedInMeters = new BigNumber(config.gpsMaxSpeed);
    trip.endVoltage = new BigNumber(config.endVoltage);
    trip.startVoltage = new BigNumber(config.startVoltage);
    trip.ratedVoltage = new BigNumber(72);
    trip.ratedCapacityAh = new BigNumber(60);
    trip.motorPolePairs = new BigNumber(16);
    return trip;
};

const SIMULATED_TRIPS: CurrentTrip[] = [
    createSimulatedTrip('sim-trip-1', {
        distanceMeters: 14280,
        energyWh: 1185,
        remainingMeters: 8200,
        maxSpeedMeters: 28,
        avgSpeedMeters: 17,
        avgPower: 2300,
        startOffsetMinutes: 20,
        durationMinutes: 45,
        maxLineCurrent: 180,
        maxPhaseCurrent: 220,
        gpsSampleCount: 540,
        gpsAvgSpeed: 15,
        gpsMaxSpeed: 31,
        endVoltage: 67,
        startVoltage: 72,
    }),
    createSimulatedTrip('sim-trip-2', {
        distanceMeters: 6800,
        energyWh: 560,
        remainingMeters: 9200,
        maxSpeedMeters: 24,
        avgSpeedMeters: 14,
        avgPower: 1800,
        startOffsetMinutes: 75,
        durationMinutes: 35,
        maxLineCurrent: 150,
        maxPhaseCurrent: 190,
        gpsSampleCount: 360,
        gpsAvgSpeed: 13,
        gpsMaxSpeed: 26,
        endVoltage: 69,
        startVoltage: 73,
    }),
];

const useTrips = (serialNumber: string) => {
    const [trips, setTrips] = useState<CurrentTrip[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (IS_SIMULATOR_MODE) {
            const timeout = setTimeout(() => {
                setTrips(SIMULATED_TRIPS);
                setLoading(false);
            }, 150);
            return () => clearTimeout(timeout);
        }

        const sub = firestore()
            .collection('controllers')
            .doc(serialNumber)
            .collection('trips')
            .orderBy('startTime', 'desc')
            .onSnapshot((querySnapshot) => {
                const nextTrips: any[] = [];
                querySnapshot.forEach((documentSnapshot) => {
                    nextTrips.push({
                        id: documentSnapshot.id,
                        ...documentSnapshot.data(),
                    });
                });
                setTrips(nextTrips);
                setLoading(false);
            });
        return () => sub();
    }, [serialNumber]);

    return { trips, loading };
};

export default useTrips;
