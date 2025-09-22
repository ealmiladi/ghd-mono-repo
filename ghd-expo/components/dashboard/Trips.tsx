import React, { memo, useCallback, useMemo } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import {
    CurrentTrip,
    RoutePoint,
} from '@/fardriver/interfaces/ControllerState';
import useTrips from '@/hooks/useTrips';
import { Spinner } from '@/components/ui/spinner';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { toFixed } from '@/utils';
import { DateTime } from 'luxon';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { LucideBike, LucideChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SoCEstimator } from '@/utils/soc-estimator';
import { Button, ButtonText } from '@/components/ui/button';
import AlertDialog from '@/components/dashboard/AlertDialog';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/Toast';
import { useUser } from '@/providers/UserContextProvider';
import { useTranslation } from 'react-i18next';
import BigNumber from 'bignumber.js';
import RouteReplay from '@/components/dashboard/RouteReplay';

const Trips = memo(({ route }: { route: any }) => {
    const serialNumber = route.params.serialNumber;
    const { trips, loading } = useTrips(serialNumber);
    const { t } = useTranslation();
    const { controllers, prefersMph } = useUser();

    const controller = useMemo(
        () =>
            controllers?.find((item) => item.serialNumber === serialNumber) ||
            null,
        [controllers, serialNumber]
    );

    const metricsSummary = useMemo(() => {
        const metrics = controller?.tripMetrics;
        if (!metrics) {
            return null;
        }

        const toNumber = (value) => {
            if (value === null || value === undefined) {
                return 0;
            }
            if (typeof value === 'number') {
                return Number.isFinite(value) ? value : 0;
            }
            if (typeof value === 'string') {
                const parsed = parseFloat(value);
                return Number.isFinite(parsed) ? parsed : 0;
            }
            if (
                typeof value === 'object' &&
                typeof value.toString === 'function'
            ) {
                const parsed = parseFloat(value.toString());
                return Number.isFinite(parsed) ? parsed : 0;
            }
            return 0;
        };

        const totalDistanceMeters = toNumber(metrics.totalDistanceMeters);
        const totalEnergyWh = toNumber(metrics.totalEnergyWh);
        const avgWhPerKm = toNumber(metrics.averageWhPerKm);
        const avgWhPerMile = toNumber(metrics.averageWhPerMile);
        const maxVoltageSag = toNumber(metrics.maxVoltageSag);
        const tripCount = toNumber(metrics.tripCount);
        const totalDurationMs = toNumber(metrics.totalDurationMs);
        const gpsSampleCount = toNumber(metrics.gpsSampleCount);
        const gpsMaxSpeedMeters = toNumber(metrics.gpsMaxSpeedInMeters);
        const gpsAvgSpeedMeters = toNumber(metrics.gpsAvgSpeedInMeters);

        const totalDistanceDisplay = prefersMph
            ? `${toFixed(totalDistanceMeters / 1609.34, 1)} ${t('common.miles')}`
            : `${toFixed(totalDistanceMeters / 1000, 1)} ${t('common.kilometers')}`;
        const totalEnergyDisplay = `${toFixed(totalEnergyWh, 1)} Wh`;
        const avgConsumptionValue = prefersMph ? avgWhPerMile : avgWhPerKm;
        const avgConsumptionDisplay = `${toFixed(avgConsumptionValue, 1)} ${
            prefersMph ? 'Wh/mi' : 'Wh/km'
        }`;
        const maxVoltageSagDisplay = `${toFixed(maxVoltageSag, 1)} V`;

        const formatDuration = (ms) => {
            if (!ms) {
                return '—';
            }
            const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            if (hours === 0 && minutes === 0) {
                return '<1m';
            }
            return `${hours}h ${minutes}m`;
        };

        const totalDurationDisplay = formatDuration(totalDurationMs);
        const gpsMaxSpeedDisplay = prefersMph
            ? `${toFixed(gpsMaxSpeedMeters * 2.23694, 0)} mph`
            : `${toFixed(gpsMaxSpeedMeters * 3.6, 0)} km/h`;
        const gpsAvgSpeedDisplay = prefersMph
            ? `${toFixed(gpsAvgSpeedMeters * 2.23694, 0)} mph`
            : `${toFixed(gpsAvgSpeedMeters * 3.6, 0)} km/h`;

        return {
            tripCount,
            totalDistanceDisplay,
            totalEnergyDisplay,
            avgConsumptionDisplay,
            maxVoltageSagDisplay,
            totalDurationDisplay,
            gpsSampleCount,
            gpsMaxSpeedDisplay,
            gpsAvgSpeedDisplay,
        };
    }, [controller, prefersMph, t]);

    return (
        <ScrollView className="flex-1 p-4">
            <Heading className="text-3xl mb-4">{t('trip.trips')}</Heading>

            {metricsSummary && (
                <View className="bg-secondary-100 rounded-xl p-4 mb-6">
                    <Heading className="text-xl">
                        {t('trip.summary.title')}
                    </Heading>
                    <View className="mt-1 w-full">
                        <TripDetail
                            label={t('trip.summary.totalTrips')}
                            value={`${metricsSummary.tripCount}`}
                        />
                        <TripDetail
                            label={t('trip.summary.totalDistance')}
                            value={metricsSummary.totalDistanceDisplay}
                        />
                        <TripDetail
                            label={t('trip.summary.totalEnergy')}
                            value={metricsSummary.totalEnergyDisplay}
                        />
                        <TripDetail
                            label={t('trip.summary.avgConsumption')}
                            value={metricsSummary.avgConsumptionDisplay}
                        />
                        <TripDetail
                            label={t('trip.summary.totalDuration')}
                            value={metricsSummary.totalDurationDisplay}
                        />
                        <TripDetail
                            label={t('trip.stats.maxVoltageSag')}
                            value={metricsSummary.maxVoltageSagDisplay}
                        />
                        {metricsSummary.gpsSampleCount > 0 && (
                            <TripDetail
                                label={t('trip.stats.maxSpeedGps')}
                                value={metricsSummary.gpsMaxSpeedDisplay}
                            />
                        )}
                        {metricsSummary.gpsSampleCount > 0 && (
                            <TripDetail
                                label={t('trip.stats.avgSpeedGps')}
                                value={metricsSummary.gpsAvgSpeedDisplay}
                            />
                        )}
                    </View>
                </View>
            )}

            {loading && <Spinner />}
            {!trips.length && !loading && (
                <Text className="text-secondary-500 text-center">
                    {t('trip.noTripsFound')}
                </Text>
            )}
            {trips.map((trip, index) => (
                <CondensedTrip
                    key={index}
                    trip={trip}
                    serialNumber={serialNumber}
                />
            ))}
        </ScrollView>
    );
});

const CondensedTrip = memo(
    ({ trip, serialNumber }: { trip: CurrentTrip; serialNumber: string }) => {
        // Destructuring the trip object
        const {
            distanceInMeters,
            startTime,
            endTime,
            cumulativeEnergyWh,
            maxSpeedInMeters,
        } = trip;

        const navigation: any = useNavigation();
        const { prefersMph, prefersFahrenheit } = useUser();
        const { t } = useTranslation();

        // Convert distance using BigNumber
        const distance = new BigNumber(distanceInMeters)
            .multipliedBy(prefersMph ? 0.000621371 : 0.001) // Convert meters to miles or kilometers
            .toFixed(1);

        // Convert max speed using BigNumber
        const maxSpeed = new BigNumber(maxSpeedInMeters)
            .multipliedBy(prefersMph ? 2.23694 : 3.6) // Convert m/s to mph or km/h
            .toFixed(0);

        // Format cumulative energy with BigNumber
        const cumulativeEnergy = new BigNumber(cumulativeEnergyWh).toFixed(2);

        // Format start time
        const tripStartFormatted = DateTime.fromMillis(
            Number(startTime || 0)
        ).toLocaleString(DateTime.DATETIME_MED);

        // Calculate trip duration using BigNumber
        const tripDuration =
            new BigNumber(
                Number(endTime || Date.now()) - Number(startTime || Date.now())
            )
                .dividedBy(60000) // Convert milliseconds to minutes
                .toFixed(1) + ' min';

        return (
            <TouchableOpacity
                onPress={() => {
                    navigation.navigate('TripDetail', {
                        trip,
                        serialNumber,
                    });
                }}
            >
                <View className="bg-secondary-100 rounded-xl p-4 mb-6 w-full">
                    <HStack className="justify-between items-center w-full">
                        <Text className="text-primary-500 text-lg font-bold">
                            {distance}
                            {prefersMph ? 'mi' : 'km'}
                        </Text>
                        <Text className="text-primary-500 text-lg font-bold">
                            {tripStartFormatted}
                        </Text>
                    </HStack>
                    <HStack className={'items-center justify-between'}>
                        <View className="flex-1">
                            <HStack className="mt-2 gap-2 w-full items-start">
                                <View className="rounded-md bg-secondary-200 items-center justify-center p-2">
                                    <Icon
                                        size={30}
                                        as={LucideBike}
                                        className="text-secondary-400"
                                    />
                                </View>
                                <View className="flex-1 pl-2">
                                    <Text className="text-secondary-500 font-semibold">
                                        {t('common.consumption')}{' '}
                                        {cumulativeEnergy}Wh, {tripDuration}
                                    </Text>
                                    <Text className="text-secondary-500">
                                        {t('trip.stats.maxSpeed')}: {maxSpeed}
                                        {prefersMph ? 'mph' : 'km/h'}
                                    </Text>
                                </View>
                            </HStack>
                        </View>
                        <View className="pl-2">
                            <Icon
                                size={40}
                                as={LucideChevronRight}
                                className="text-secondary-500"
                            />
                        </View>
                    </HStack>
                </View>
            </TouchableOpacity>
        );
    }
);

const Trip = memo(({ route, navigation }: any) => {
    return (
        <View className="flex-1">
            <TripWithToast route={route} navigation={navigation} />
            <Toast position="top" config={toastConfig} />
        </View>
    );
});

const TripWithToast = memo(({ route, navigation }: any) => {
    const { prefersMph, prefersFahrenheit } = useUser();
    const { t } = useTranslation();
    const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
    const {
        id,
        distanceInMeters,
        avgSpeed: avgSpeedInMeters,
        maxSpeedInMeters,
        cumulativeEnergyWh,
        startTime,
        endTime,
        startVoltage,
        endVoltage,
        maxLineCurrent,
        maxInputPower,
        maxInputPowerVoltage,
        maxInputPowerCurrent,
        maxRPM,
        ratedVoltage,
        motorPolePairs,
        route: rawRoute = [],
    } = route.params.trip as CurrentTrip;
    // Calculated and formatted values using BigNumber
    const distance = new BigNumber(distanceInMeters)
        .multipliedBy(prefersMph ? 0.000621371 : 0.001) // Convert meters to miles/kilometers
        .toFixed(1);

    const maxSpeed = new BigNumber(maxSpeedInMeters)
        .multipliedBy(prefersMph ? 2.23694 : 3.6) // Convert m/s to mph/km/h
        .toFixed(0);

    const avgSpeed = new BigNumber(avgSpeedInMeters)
        .multipliedBy(prefersMph ? 2.23694 : 3.6) // Convert m/s to mph/km/h
        .toFixed(0);

    const cumulativeEnergy = new BigNumber(cumulativeEnergyWh).toFixed(2);
    const gpsMaxSpeedInMeters = new BigNumber(
        route.params.trip.gpsMaxSpeedInMeters || 0
    );
    const gpsAvgSpeedInMeters = new BigNumber(
        route.params.trip.gpsAvgSpeed || 0
    );
    const gpsSampleCount = new BigNumber(
        route.params.trip.gpsSampleCount || 0
    ).toNumber();
    const gpsMaxSpeedFormatted = gpsMaxSpeedInMeters
        .multipliedBy(prefersMph ? 2.23694 : 3.6)
        .toFixed(0);
    const gpsAvgSpeedFormatted = gpsAvgSpeedInMeters
        .multipliedBy(prefersMph ? 2.23694 : 3.6)
        .toFixed(0);

    const maxRPMFormatted = useMemo(() => {
        if (BigNumber(motorPolePairs).gte(16)) {
            const rpmsAdjustedForPolePairs = new BigNumber(maxRPM)
                .multipliedBy(4)
                .dividedBy(motorPolePairs)
                .toFixed(2);
            return rpmsAdjustedForPolePairs;
        }
        return new BigNumber(maxRPM).toFixed(2);
    }, [maxRPM, motorPolePairs]);

    const startVoltageFormatted = new BigNumber(startVoltage).toFixed(2);
    const endVoltageFormatted = new BigNumber(endVoltage).toFixed(2);
    const maxLineCurrentFormatted = new BigNumber(maxLineCurrent).toFixed(2);
    const maxInputPowerFormatted = new BigNumber(maxInputPower).toFixed(0);
    const maxInputPowerVoltageFormatted = new BigNumber(
        maxInputPowerVoltage
    ).toFixed(2);
    const maxInputPowerCurrentFormatted = new BigNumber(
        maxInputPowerCurrent
    ).toFixed(2);
    const maxVoltageSag = new BigNumber(
        route.params.trip.maxVoltageSag || 0
    ).toFixed(1);

    const tripDuration = endTime
        ? new BigNumber((Number(endTime) || 0) - Number(startTime || 0))
              .dividedBy(60000) // Convert milliseconds to minutes
              .toFixed(1) + ' min'
        : 'Ongoing';

    const tripStartFormatted = DateTime.fromMillis(
        Number(startTime) || 0
    ).toLocaleString(DateTime.DATETIME_MED);

    const tripEndFormatted = DateTime.fromMillis(
        Number(endTime) || 0
    ).toLocaleString(DateTime.DATETIME_MED);

    const socConsumed = new SoCEstimator(Number(ratedVoltage) || 72);
    const percentageOfBatteryUsed = new BigNumber(
        socConsumed.getPercentUsed(Number(startVoltage), Number(endVoltage))
    ).toFixed(2);

    const whPerMeter = new BigNumber(cumulativeEnergyWh).dividedBy(
        distanceInMeters
    );

    const whPerUnitDesired = whPerMeter
        .multipliedBy(prefersMph ? 1609.34 : 1000)
        .toNumber();

    const routePoints = useMemo<RoutePoint[]>(() => {
        if (!Array.isArray(rawRoute)) {
            return [];
        }
        return rawRoute as RoutePoint[];
    }, [rawRoute]);

    const onTripDeletedClicked = useCallback(async () => {
        try {
            await firestore()
                .collection('controllers')
                .doc(route.params.serialNumber)
                .collection('trips')
                .doc(id)
                .delete();
            setConfirmModalOpen(false);
            navigation.goBack();
            setTimeout(() => {
                Toast.show({
                    type: 'success',
                    text1: t('common.deleted'),
                    text2: t('trip.deletedTrip'),
                });
            }, 500);
        } catch (e) {
            console.error(e);
        }
    }, [id, navigation, route.params.serialNumber, t]);

    const explicitMaximumInputPower = useMemo(() => {
        if (maxInputPowerVoltage && maxInputPowerCurrent) {
            return `${maxInputPowerVoltage}V @ ${maxInputPowerCurrent}A = ${maxInputPowerFormatted}W`;
        }
        return maxInputPowerFormatted;
    }, [maxInputPowerCurrent, maxInputPowerFormatted, maxInputPowerVoltage]);

    return (
        <ScrollView className="p-4">
            <View className="bg-secondary-100 rounded-xl p-4 mb-6">
                <HStack className="items-center justify-between">
                    <Heading className="text-xl">
                        {t('trip.stats.started')}
                    </Heading>
                    <Text className="text-secondary-500 text-lg font-bold">
                        {tripStartFormatted}
                    </Text>
                </HStack>
                <HStack className="items-center justify-between">
                    <Heading className="text-xl">
                        {t('trip.stats.ended')}
                    </Heading>
                    <Text className="text-secondary-500 text-lg font-bold">
                        {tripEndFormatted}
                    </Text>
                </HStack>
            </View>

            {/* Speed Information */}
            <View className="bg-secondary-100 rounded-xl p-4 mb-6">
                <Heading className="text-xl">
                    {t('trip.stats.speedAndPower')}
                </Heading>
                <View className="mt-1 w-full">
                    <TripDetail
                        label={t('trip.stats.maxRPM')}
                        value={`${maxRPMFormatted}`}
                    />
                    <TripDetail
                        label={t('trip.stats.maxInputPower')}
                        value={explicitMaximumInputPower}
                    />
                    <TripDetail
                        label={t('trip.stats.maxLineCurrent')}
                        value={`${maxLineCurrentFormatted}A`}
                    />
                    <TripDetail
                        label={t('trip.stats.maxVoltageSag')}
                        value={`${maxVoltageSag}V`}
                    />
                    <TripDetail
                        label={t('trip.stats.avgSpeedCalculated')}
                        value={`${avgSpeed}${prefersMph ? 'mph' : ' km/h'}`}
                    />
                    <TripDetail
                        label={t('trip.stats.maxSpeedCalculated')}
                        value={`${maxSpeed}${prefersMph ? 'mph' : ' km/h'}`}
                    />
                    {gpsSampleCount > 0 && (
                        <TripDetail
                            label={t('trip.stats.avgSpeedGps')}
                            value={`${gpsAvgSpeedFormatted}${
                                prefersMph ? 'mph' : ' km/h'
                            }`}
                        />
                    )}
                    {gpsSampleCount > 0 && (
                        <TripDetail
                            label={t('trip.stats.maxSpeedGps')}
                            value={`${gpsMaxSpeedFormatted}${
                                prefersMph ? 'mph' : ' km/h'
                            }`}
                        />
                    )}
                </View>
            </View>

            {/* Voltage/Power Information */}
            <View className="bg-secondary-100 rounded-xl p-4 mb-6">
                <Heading className="text-xl">
                    {t('trip.stats.distanceAndConsumption')}
                </Heading>
                <View className="mt-1 w-full">
                    <TripDetail
                        label={t('trip.stats.energyConsumed')}
                        value={`${cumulativeEnergy} Wh`}
                    />
                    <TripDetail
                        label={
                            prefersMph
                                ? t('common.miles')
                                : t('common.kilometers')
                        }
                        value={`${distance}`}
                    />
                    <TripDetail
                        label={prefersMph ? 'Wh/mi' : 'Wh/km'}
                        value={`${toFixed(whPerUnitDesired, 2)}`}
                    />
                    <TripDetail
                        label={t('trip.stats.percentageOfBatteryUsed')}
                        value={`${percentageOfBatteryUsed}%`}
                    />
                    <TripDetail
                        label={t('trip.stats.startVoltage')}
                        value={`${startVoltageFormatted} V`}
                    />
                    <TripDetail
                        label={t('trip.stats.endVoltage')}
                        value={`${endVoltageFormatted} V`}
                    />
                    <TripDetail
                        label={t('trip.stats.duration')}
                        value={tripDuration}
                    />
                    <View className="mt-4">
                        <RouteReplay
                            route={routePoints}
                            prefersMph={prefersMph}
                            prefersFahrenheit={prefersFahrenheit}
                        />
                    </View>
                </View>
            </View>

            <Button
                variant="solid"
                size="lg"
                action="primary"
                className="bg-error-500"
                onPress={() => setConfirmModalOpen(true)}
            >
                <ButtonText>{t('trip.deleteTrip')}</ButtonText>
            </Button>
            <View className="h-24" />
            <AlertDialog
                heading={t('trip.deleteTrip')}
                description={t('trip.deleteTripDescription')}
                isOpen={confirmModalOpen}
                onButtonClick={onTripDeletedClicked}
                setOpen={() => setConfirmModalOpen(false)}
            />
        </ScrollView>
    );
});

const TripDetail = memo(
    ({ label, value }: { label: string; value: string }) => (
        <View className="flex-row justify-between mt-1">
            <Text className="text-secondary-500 font-semibold text-lg">
                {label}
            </Text>
            <Text className="text-secondary-600 font-bold text-lg">
                {value}
            </Text>
        </View>
    )
);

Trips.displayName = 'Trips';
Trip.displayName = 'Trip';
TripWithToast.displayName = 'TripWithToast';
TripDetail.displayName = 'TripDetail';
CondensedTrip.displayName = 'CondensedTrip';

export { Trips, Trip, TripDetail, CondensedTrip };

export default Trips;
