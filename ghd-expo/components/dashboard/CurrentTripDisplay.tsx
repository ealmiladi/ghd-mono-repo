import { View } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { CurrentTrip } from '@/fardriver/interfaces/ControllerState';
import { toFixed } from '@/utils';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import {
    LucideMaximize2,
    LucideThermometer,
    LucideTimerOff,
} from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import AlertDialog from '@/components/dashboard/AlertDialog';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/providers/UserContextProvider';
import Row from '@/components/InfoRow';

const CurrentTripDisplay = memo(
    ({
        currentTrip,
        onEndTrip,
        isEndingTrip = false,
        onOpenHud,
    }: {
        currentTrip: CurrentTrip;
        onEndTrip: () => Promise<void>;
        isEndingTrip?: boolean;
        onOpenHud?: () => void;
    }) => {
        const { t } = useTranslation();
        const { prefersMph, prefersFahrenheit } = useUser();

        const [isSaving, setIsSaving] = useState(false);
        const [confirmModalOpen, setConfirmModalOpen] = useState(false);

        const onEndTripClicked = useCallback(async () => {
            try {
                setIsSaving(true);
                await onEndTrip?.();
                setConfirmModalOpen(false);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSaving(false);
            }
        }, [onEndTrip]);

        const { rows } = useMemo(() => {
            const timeElapsed = currentTrip.startTime;
            const cumulativeEnergy = toFixed(
                Number(currentTrip.cumulativeEnergyWh)
            );
            const maxSpeed = toFixed(
                Number(currentTrip.maxSpeedInMeters) *
                    (prefersMph ? 2.23694 : 3.6),
                0
            );
            const avgSpeed = toFixed(
                Number(currentTrip.avgSpeed) * (prefersMph ? 2.23694 : 3.6),
                0
            );

            const avgPower = toFixed(Number(currentTrip.avgPower), 0);
            const maxWatts = toFixed(Number(currentTrip.maxInputPower), 0);

            const maxRPM = toFixed(Number(currentTrip.maxRPM), 0);
            const distance = toFixed(
                Number(currentTrip.distanceInMeters) *
                    (prefersMph ? 0.000621371 : 0.001)
            );
            const maxVoltageSag = toFixed(
                Number(
                    (currentTrip.maxVoltageSag as any)?.toNumber?.() ??
                        currentTrip.maxVoltageSag ??
                        0
                ),
                1
            );

            const estimatedDistanceRemainingInMeters = toFixed(
                Number(
                    currentTrip.estimatedDistanceRemainingInMeters.toNumber() ||
                        1
                ) * (prefersMph ? 0.000621371 : 0.001),
                0
            );

            const whPerMeter =
                Number(currentTrip.cumulativeEnergyWh.toNumber() || 1) /
                Number(currentTrip.distanceInMeters.toNumber() || 1);
            const whPerUnitDesired = toFixed(
                whPerMeter * (prefersMph ? 1609.34 : 1000),
                0
            );

            const formatTemperature = (value?: number) => {
                const temp = Number(value || 0);
                if (prefersFahrenheit) {
                    return `${toFixed(temp * 1.8 + 32, 0)}°F`;
                }
                return `${toFixed(temp, 0)}°C`;
            };

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

            const rows: any[] = [
                {
                    label: t('trip.stats.maxSpeedCalculated'),
                    value: `${maxSpeed} ${prefersMph ? 'mph' : 'km/h'}`,
                },
                { label: t('trip.stats.maxRPM'), value: `${maxRPM}` },
                { label: t('trip.stats.maxInputPower'), value: `${maxWatts}W` },
                {
                    label: t('trip.stats.avgSpeedCalculated'),
                    value: `${avgSpeed} ${prefersMph ? 'mph' : 'km/h'}`,
                },
            ];

            if (gpsSampleCount > 0) {
                rows.push(
                    {
                        label: t('trip.stats.maxSpeedGps'),
                        value: `${gpsMaxSpeed} ${prefersMph ? 'mph' : 'km/h'}`,
                    },
                    {
                        label: t('trip.stats.avgSpeedGps'),
                        value: `${gpsAvgSpeed} ${prefersMph ? 'mph' : 'km/h'}`,
                    }
                );
            }

            rows.push(
                {
                    label: t('trip.stats.avgPower'),
                    value: `${avgPower}W`,
                },
                {
                    label: t('trip.stats.maxVoltageSag'),
                    value: `${maxVoltageSag}V`,
                },
                {
                    label: t('trip.stats.distance'),
                    value: `${distance} ${prefersMph ? 'miles' : 'km'}`,
                },
                {
                    label: t('trip.stats.cumulativeEnergy'),
                    value: `${cumulativeEnergy}Wh`,
                },
                {
                    label: prefersMph ? 'Wh/mi' : 'Wh/km',
                    value: whPerUnitDesired,
                },
                {
                    label: t('trip.stats.estimatedDistanceRemaining'),
                    value: `${estimatedDistanceRemainingInMeters} ${
                        prefersMph ? 'miles' : 'km'
                    }`,
                },
                {
                    label: t('trip.stats.timeElapsed'),
                    value: timeElapsed,
                    isClock: true,
                },
                {
                    label: (
                        <>
                            {t('trip.stats.mosTemperature')}{' '}
                            <Icon as={LucideThermometer} size={12} />
                        </>
                    ),
                    value: formatTemperature(currentTrip.mosTemperatureCelcius),
                },
                {
                    label: (
                        <>
                            {t('trip.stats.motorTemperature')}{' '}
                            <Icon as={LucideThermometer} size={12} />
                        </>
                    ),
                    value: formatTemperature(
                        currentTrip.motorTemperatureCelcius
                    ),
                }
            );
            return {
                rows,
                cumulativeEnergy,
                maxSpeed,
                avgSpeed,
                avgPower,
                maxRPM,
                distance,
            };
        }, [
            currentTrip.avgPower,
            currentTrip.avgSpeed,
            currentTrip.cumulativeEnergyWh,
            currentTrip.distanceInMeters,
            currentTrip.estimatedDistanceRemainingInMeters,
            currentTrip.maxInputPower,
            currentTrip.maxRPM,
            currentTrip.maxSpeedInMeters,
            currentTrip.maxVoltageSag,
            currentTrip.mosTemperatureCelcius,
            currentTrip.motorTemperatureCelcius,
            currentTrip.startTime,
            prefersMph,
            prefersFahrenheit,
            t,
        ]);

        return (
            <View className="bg-secondary-100 rounded-2xl p-4">
                <HStack className="items-center justify-between">
                    <Heading>{t('trip.currentTrip')}</Heading>
                    <HStack className="gap-2">
                        {onOpenHud && (
                            <Button
                                variant="outline"
                                size="xs"
                                className="px-0 w-9 h-9"
                                onPress={onOpenHud}
                                accessibilityLabel={t('trip.fullscreenHud')}
                            >
                                <Icon
                                    as={LucideMaximize2}
                                    className="text-secondary-500"
                                />
                            </Button>
                        )}
                        <Button
                            variant="solid"
                            size="sm"
                            disabled={isSaving || isEndingTrip}
                            action="primary"
                            onPress={() => setConfirmModalOpen(true)}
                        >
                            {isSaving || isEndingTrip ? (
                                <Spinner />
                            ) : (
                                <Icon
                                    as={LucideTimerOff}
                                    className="text-secondary-100"
                                />
                            )}

                            <ButtonText>{t('trip.endTrip')}</ButtonText>
                        </Button>
                    </HStack>
                </HStack>
                <View className="mt-4 flex-row flex-wrap gap-y-3">
                    {rows.map((row, index) => (
                        <Row key={index} index={index} {...(row as any)} />
                    ))}
                </View>
                <AlertDialog
                    heading={t('trip.endTrip')}
                    description={t('trip.endTripDescription')}
                    buttonTitle={t('common.continue')}
                    cancelButtonTitle={t('common.cancel')}
                    isOpen={confirmModalOpen}
                    onButtonClick={onEndTripClicked}
                    setOpen={() => setConfirmModalOpen(false)}
                />
            </View>
        );
    }
);

CurrentTripDisplay.displayName = 'CurrentTripDisplay';

export default CurrentTripDisplay;
