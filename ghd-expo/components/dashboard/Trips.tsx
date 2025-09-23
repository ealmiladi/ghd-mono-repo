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
import { Icon } from '@/components/ui/icon';
import { LucideChevronRight } from 'lucide-react-native';
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
        <ScrollView
            className="flex-1 bg-background-0"
            contentContainerStyle={{ paddingBottom: 96 }}
        >
            <View className="px-5 pt-6 pb-4">
                <Heading className="text-3xl font-semibold">
                    {t('trip.trips')}
                </Heading>
                <Text className="text-secondary-500 mt-1">
                    {t(
                        'trip.summary.description',
                        'Review logged rides, energy use, and route telemetry.'
                    )}
                </Text>
            </View>

            {metricsSummary && (
                <View className="px-5">
                    <View className="rounded-3xl bg-secondary-100 px-5 py-6 mb-6">
                        <Heading className="text-2xl font-semibold mb-4">
                            {t('trip.summary.title')}
                        </Heading>
                        <View className="flex-row flex-wrap -mx-2">
                            <SummaryMetricTile
                                label={t('trip.summary.totalTrips')}
                                value={`${metricsSummary.tripCount}`}
                            />
                            <SummaryMetricTile
                                label={t('trip.summary.totalDistance')}
                                value={metricsSummary.totalDistanceDisplay}
                            />
                            <SummaryMetricTile
                                label={t('trip.summary.totalEnergy')}
                                value={metricsSummary.totalEnergyDisplay}
                            />
                            <SummaryMetricTile
                                label={t('trip.summary.avgConsumption')}
                                value={metricsSummary.avgConsumptionDisplay}
                            />
                            <SummaryMetricTile
                                label={t('trip.summary.totalDuration')}
                                value={metricsSummary.totalDurationDisplay}
                            />
                            <SummaryMetricTile
                                label={t('trip.stats.maxVoltageSag')}
                                value={metricsSummary.maxVoltageSagDisplay}
                            />
                            {metricsSummary.gpsSampleCount > 0 && (
                                <SummaryMetricTile
                                    label={t('trip.stats.maxSpeedGps')}
                                    value={metricsSummary.gpsMaxSpeedDisplay}
                                />
                            )}
                            {metricsSummary.gpsSampleCount > 0 && (
                                <SummaryMetricTile
                                    label={t('trip.stats.avgSpeedGps')}
                                    value={metricsSummary.gpsAvgSpeedDisplay}
                                />
                            )}
                        </View>
                    </View>
                </View>
            )}

            {loading && <Spinner />}
            {!trips.length && !loading && (
                <Text className="text-secondary-500 text-center px-5">
                    {t('trip.noTripsFound')}
                </Text>
            )}

            <View className="px-5 gap-5">
                {trips.map((trip, index) => (
                    <TripListCard
                        key={index}
                        trip={trip}
                        serialNumber={serialNumber}
                        prefersMph={prefersMph}
                    />
                ))}
            </View>
        </ScrollView>
    );
});

const SummaryMetricTile = ({
    label,
    value,
}: {
    label: string;
    value: string;
}) => (
    <View className="w-1/2 px-2 mb-4">
        <Text className="text-secondary-400 text-xs uppercase font-semibold">
            {label}
        </Text>
        <Text className="text-secondary-600 text-xl font-bold">{value}</Text>
    </View>
);

SummaryMetricTile.displayName = 'SummaryMetricTile';

const TripStatPill = ({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: string;
}) => (
    <View className="w-1/2 px-2 mb-4">
        <Text className="text-secondary-400 text-xs uppercase font-semibold">
            {label}
        </Text>
        <Text className={`text-secondary-600 text-lg font-bold ${tone ?? ''}`}>
            {value}
        </Text>
    </View>
);

TripStatPill.displayName = 'TripStatPill';

const TripListCard = memo(
    ({
        trip,
        serialNumber,
        prefersMph,
    }: {
        trip: CurrentTrip;
        serialNumber: string;
        prefersMph: boolean;
    }) => {
        const navigation: any = useNavigation();
        const { t } = useTranslation();

        const distanceMeters = Number(trip.distanceInMeters) || 0;
        const distanceValue = prefersMph
            ? distanceMeters / 1609.34
            : distanceMeters / 1000;
        const distanceDisplay = `${toFixed(distanceValue, 1)} ${
            prefersMph ? t('common.miles') : t('common.kilometers')
        }`;

        const energyWh = Number(trip.cumulativeEnergyWh) || 0;
        const energyDisplay = `${toFixed(energyWh, 1)} Wh`;

        const whPerUnit = distanceValue > 0 ? energyWh / distanceValue : 0;
        const whPerUnitLabel = prefersMph ? 'Wh/mi' : 'Wh/km';
        const whPerUnitDisplay = `${toFixed(whPerUnit, 1)} ${whPerUnitLabel}`;

        const maxSpeedValue =
            Number(trip.maxSpeedInMeters || 0) * (prefersMph ? 2.23694 : 3.6);
        const maxSpeedDisplay = `${toFixed(maxSpeedValue, 0)} ${
            prefersMph ? 'mph' : 'km/h'
        }`;

        const gpsSamples = Number(trip.gpsSampleCount || 0);
        const gpsMaxSpeedDisplay = gpsSamples
            ? `${toFixed(
                  Number(trip.gpsMaxSpeedInMeters || 0) *
                      (prefersMph ? 2.23694 : 3.6),
                  0
              )} ${prefersMph ? 'mph' : 'km/h'}`
            : null;

        const sagValue =
            trip.maxVoltageSag !== undefined && trip.maxVoltageSag !== null
                ? Number(trip.maxVoltageSag)
                : null;
        const sagTone = sagValue && sagValue > 7 ? 'text-error-500' : undefined;
        const sagDisplay =
            sagValue !== null ? `${toFixed(sagValue, 1)} V` : '—';

        const tripStart = DateTime.fromMillis(Number(trip.startTime || 0));
        const tripEnd = trip.endTime
            ? DateTime.fromMillis(Number(trip.endTime))
            : null;
        const dateLabel = tripStart.toFormat('MMM dd, yyyy');
        const timeWindow = `${tripStart.toFormat('h:mm a')}${
            tripEnd ? ' → ' + tripEnd.toFormat('h:mm a') : ''
        }`;

        const durationMinutes = trip.endTime
            ? (Number(trip.endTime) - Number(trip.startTime || 0)) / 60000
            : null;
        const durationDisplay =
            durationMinutes !== null
                ? `${toFixed(durationMinutes, 1)} min`
                : t('trip.stats.ongoing', 'Ongoing');

        const routeSamples = Array.isArray(trip.route) ? trip.route.length : 0;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                className="rounded-3xl bg-secondary-100"
                onPress={() =>
                    navigation.navigate('TripDetail', {
                        trip,
                        serialNumber,
                    })
                }
            >
                <View className="px-5 py-6">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                            <Heading className="text-xl font-semibold">
                                {dateLabel}
                            </Heading>
                            <Text className="text-secondary-500 text-sm mt-1">
                                {timeWindow}
                            </Text>
                        </View>
                        <Icon
                            as={LucideChevronRight}
                            size={20}
                            className="text-secondary-400"
                        />
                    </View>

                    <View className="mt-4 flex-row flex-wrap -mx-2">
                        <TripStatPill
                            label={t('trip.stats.distance')}
                            value={distanceDisplay}
                        />
                        <TripStatPill
                            label={t('trip.stats.energyConsumed')}
                            value={energyDisplay}
                        />
                        <TripStatPill
                            label={whPerUnitLabel}
                            value={whPerUnitDisplay}
                        />
                        <TripStatPill
                            label={t('trip.stats.duration')}
                            value={durationDisplay}
                        />
                        <TripStatPill
                            label={t('trip.stats.maxSpeedCalculated')}
                            value={maxSpeedDisplay}
                        />
                        {gpsMaxSpeedDisplay && (
                            <TripStatPill
                                label={t('trip.stats.maxSpeedGps')}
                                value={gpsMaxSpeedDisplay}
                            />
                        )}
                        <TripStatPill
                            label={t('trip.stats.maxVoltageSag')}
                            value={sagDisplay}
                            tone={sagTone}
                        />
                        <TripStatPill
                            label={t('trip.routeReplay.samples', 'Samples')}
                            value={`${routeSamples}`}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
);

TripListCard.displayName = 'TripListCard';
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
        maxRPM,
        ratedVoltage,
        motorPolePairs,
        route: rawRoute = [],
        gpsMaxSpeedInMeters,
        gpsAvgSpeed,
        gpsSampleCount,
        maxVoltageSag,
    } = route.params.trip as CurrentTrip & {
        gpsMaxSpeedInMeters?: number;
        gpsAvgSpeed?: number;
        gpsSampleCount?: number;
        maxVoltageSag?: number;
    };

    const distanceValue = new BigNumber(distanceInMeters)
        .multipliedBy(prefersMph ? 0.000621371 : 0.001)
        .toNumber();
    const distanceDisplay = `${toFixed(distanceValue, 1)} ${
        prefersMph ? t('common.miles') : t('common.kilometers')
    }`;

    const maxSpeedValue = new BigNumber(maxSpeedInMeters)
        .multipliedBy(prefersMph ? 2.23694 : 3.6)
        .toNumber();
    const avgSpeedValue = new BigNumber(avgSpeedInMeters)
        .multipliedBy(prefersMph ? 2.23694 : 3.6)
        .toNumber();
    const wheelSpeedUnit = prefersMph ? 'mph' : 'km/h';
    const maxSpeedDisplay = `${toFixed(maxSpeedValue, 0)} ${wheelSpeedUnit}`;
    const avgSpeedDisplay = `${toFixed(avgSpeedValue, 0)} ${wheelSpeedUnit}`;

    const cumulativeEnergyDisplay = `${toFixed(
        new BigNumber(cumulativeEnergyWh).toNumber(),
        2
    )} Wh`;

    const gpsSamples = new BigNumber(gpsSampleCount || 0).toNumber();
    const gpsMaxSpeedDisplay = gpsSamples
        ? `${toFixed(
              new BigNumber(gpsMaxSpeedInMeters || 0)
                  .multipliedBy(prefersMph ? 2.23694 : 3.6)
                  .toNumber(),
              0
          )} ${wheelSpeedUnit}`
        : null;
    const gpsAvgSpeedDisplay = gpsSamples
        ? `${toFixed(
              new BigNumber(gpsAvgSpeed || 0)
                  .multipliedBy(prefersMph ? 2.23694 : 3.6)
                  .toNumber(),
              0
          )} ${wheelSpeedUnit}`
        : null;

    const maxRPMValue = (() => {
        if (BigNumber(motorPolePairs).gte(16)) {
            return new BigNumber(maxRPM)
                .multipliedBy(4)
                .dividedBy(motorPolePairs)
                .toNumber();
        }
        return new BigNumber(maxRPM).toNumber();
    })();

    const startVoltageValue = new BigNumber(startVoltage).toNumber();
    const endVoltageValue = new BigNumber(endVoltage).toNumber();
    const maxLineCurrentValue = new BigNumber(maxLineCurrent).toNumber();
    const maxInputPowerValue = new BigNumber(maxInputPower).toNumber();
    const maxVoltageSagValue = new BigNumber(maxVoltageSag || 0).toNumber();

    const tripDurationMinutes = endTime
        ? new BigNumber((Number(endTime) || 0) - Number(startTime || 0))
              .dividedBy(60000)
              .toNumber()
        : null;
    const tripDurationDisplay = tripDurationMinutes
        ? `${toFixed(tripDurationMinutes, 1)} min`
        : t('trip.stats.ongoing', 'Ongoing');

    const tripStartFormatted = DateTime.fromMillis(
        Number(startTime) || 0
    ).toLocaleString(DateTime.DATETIME_MED);
    const tripEndFormatted = DateTime.fromMillis(
        Number(endTime) || 0
    ).toLocaleString(DateTime.DATETIME_MED);

    const socConsumed = new SoCEstimator(Number(ratedVoltage) || 72);
    const batteryUsedPercent = new BigNumber(
        socConsumed.getPercentUsed(Number(startVoltage), Number(endVoltage))
    ).toFixed(2);

    const whPerUnit = new BigNumber(cumulativeEnergyWh)
        .dividedBy(distanceInMeters)
        .multipliedBy(prefersMph ? 1609.34 : 1000)
        .toNumber();
    const whPerUnitLabel = prefersMph ? 'Wh/mi' : 'Wh/km';
    const whPerUnitDisplay = `${toFixed(whPerUnit, 2)} ${whPerUnitLabel}`;

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

    const stats = useMemo(() => {
        const timeWindowDisplay = `${tripStartFormatted} → ${tripEndFormatted}`;

        const entries = [
            {
                label: t('trip.stats.distance'),
                value: distanceDisplay,
            },
            {
                label: t('trip.stats.duration'),
                value: tripDurationDisplay,
            },
            {
                label: t('trip.stats.energyConsumed'),
                value: cumulativeEnergyDisplay,
            },
            {
                label: t('trip.stats.avgSpeedCalculated'),
                value: avgSpeedDisplay,
            },
            {
                label: t('trip.stats.maxSpeedCalculated'),
                value: maxSpeedDisplay,
            },
            {
                label: whPerUnitLabel,
                value: whPerUnitDisplay,
            },
            {
                label: t('trip.stats.maxVoltageSag'),
                value: `${toFixed(maxVoltageSagValue, 1)} V`,
                tone: maxVoltageSagValue > 7 ? 'text-error-500' : undefined,
            },
            {
                label: t('trip.stats.maxInputPower'),
                value: `${toFixed(maxInputPowerValue, 0)} W`,
            },
            {
                label: t('trip.stats.maxLineCurrent'),
                value: `${toFixed(maxLineCurrentValue, 0)} A`,
            },
            {
                label: t('trip.stats.maxRPM'),
                value: `${toFixed(maxRPMValue, 0)}`,
            },
            {
                label: t('trip.stats.startVoltage'),
                value: `${toFixed(startVoltageValue, 2)} V`,
            },
            {
                label: t('trip.stats.endVoltage'),
                value: `${toFixed(endVoltageValue, 2)} V`,
            },
            {
                label: t('trip.stats.percentageOfBatteryUsed'),
                value: `${batteryUsedPercent}%`,
            },
        ];

        if (gpsAvgSpeedDisplay) {
            entries.splice(4, 0, {
                label: t('trip.stats.avgSpeedGps'),
                value: gpsAvgSpeedDisplay,
            });
        }
        if (gpsMaxSpeedDisplay) {
            const insertIndex = gpsAvgSpeedDisplay ? 6 : 5;
            entries.splice(insertIndex, 0, {
                label: t('trip.stats.maxSpeedGps'),
                value: gpsMaxSpeedDisplay,
            });
        }

        entries.push(
            {
                label: t('trip.stats.started'),
                value: tripStartFormatted,
            },
            {
                label: t('trip.stats.ended'),
                value: tripEndFormatted,
            }
        );

        return entries;
    }, [
        avgSpeedDisplay,
        batteryUsedPercent,
        cumulativeEnergyDisplay,
        distanceDisplay,
        gpsAvgSpeedDisplay,
        gpsMaxSpeedDisplay,
        maxInputPowerValue,
        maxLineCurrentValue,
        maxRPMValue,
        maxSpeedDisplay,
        maxVoltageSagValue,
        t,
        tripDurationDisplay,
        tripEndFormatted,
        tripStartFormatted,
        whPerUnitDisplay,
        whPerUnitLabel,
    ]);

    return (
        <ScrollView
            className="p-4"
            contentContainerStyle={{ paddingBottom: 96 }}
        >
            <RouteReplay
                route={routePoints}
                prefersMph={prefersMph}
                prefersFahrenheit={prefersFahrenheit}
                maxVoltageSag={maxVoltageSagValue}
                maxLineCurrent={maxLineCurrentValue}
                maxInputPower={maxInputPowerValue}
                maxRPM={maxRPMValue}
            />

            <View className="bg-secondary-100 rounded-3xl p-4 mb-6">
                <Heading className="text-xl font-semibold">
                    {t('trip.stats.tripOverviewHeading', 'Trip Overview')}
                </Heading>
                <View className="flex-row flex-wrap mt-4 -mx-2">
                    {stats.map((stat) => (
                        <StatTile
                            key={`${stat.label}-${stat.value}`}
                            {...stat}
                        />
                    ))}
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

const StatTile = ({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: string;
}) => (
    <View className="w-1/2 px-2 mb-4">
        <Text className="text-secondary-400 text-xs uppercase font-semibold">
            {label}
        </Text>
        <Text className={`text-secondary-600 text-xl font-bold ${tone ?? ''}`}>
            {value}
        </Text>
    </View>
);

StatTile.displayName = 'StatTile';

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
export { Trips, Trip, TripDetail, TripListCard };

export default Trips;
