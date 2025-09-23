import React, { memo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import NumberTicker from '@/components/dashboard/NumberTicker';
import BatteryBar from '@/components/dashboard/BatteryBar';
import AnimatedBars from '@/components/dashboard/AnimatedAmps';
import Clock from '@/components/dashboard/Clock';
import { Icon } from '@/components/ui/icon';
import { LucideFuel, LucideLocateFixed } from 'lucide-react-native';
import { Controller } from '@/interfaces/Controller';
import { Device } from 'react-native-ble-plx';
import type { TripSummary } from '@/components/dashboard/types';
import { IS_SIMULATOR_MODE } from '@/utils/env';
import MotorVitalsCard from '@/components/dashboard/MotorVitalsCard';
import GearIndicatorIcon from '@/components/dashboard/GearIndicatorIcon';
import type { SharedValue } from 'react-native-reanimated';

const ControllerPortraitView = ({
    controller,
    controllerFaults,
    device,
    batteryVoltage,
    batterySoc,
    batteryColor,
    hasReceivedBatteryInformation,
    currentGear,
    currentGearPower,
    prefersMph,
    prefersFahrenheit,
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
    usesGpsSpeed,
    voltageSag,
    currentLocation: _currentLocation,
    motorCutoffApplied,
}: ControllerPortraitViewProps) => {
    const { t } = useTranslation();
    const [barsWidth, setBarsWidth] = useState(240);

    const isConnected = IS_SIMULATOR_MODE || !!device;
    const showBatteryInformation =
        hasReceivedBatteryInformation || (IS_SIMULATOR_MODE && isConnected);
    const displayedBatteryVoltage =
        batteryVoltage ?? (IS_SIMULATOR_MODE ? '72' : '--');
    const displayedBatterySoc = batterySoc ?? (IS_SIMULATOR_MODE ? '96' : '--');
    const effectiveBatteryColor = batteryColor ?? 'text-secondary-500';

    const safeVoltageSag = Number.isFinite(voltageSag) ? voltageSag : 0;
    const sagToneClass =
        safeVoltageSag > 7
            ? 'text-error-500'
            : safeVoltageSag > 4
              ? 'text-yellow-500'
              : 'text-secondary-600';
    const sagDisplay = `${safeVoltageSag.toFixed(1)}V`;
    const maxLineValue = parseInt(maxLineCurrent ?? '0', 10) || 1;
    const maxPhaseValue = parseInt(maxPhaseCurrent ?? '0', 10) || 1;

    const speedLabel = usesGpsSpeed
        ? prefersMph
            ? 'GPS MPH'
            : 'GPS KPH'
        : prefersMph
          ? 'MPH'
          : 'KPH';

    const showGearInfo = hasReceivedBatteryInformation && currentGear !== null;

    return (
        <ScrollView
            className="flex-1 bg-background-0"
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-1 justify-between px-6 py-6">
                <View className="items-center w-full">
                    <NumberTicker
                        hideWhenZero={false}
                        sharedValue={calculatedSpeedSharedValue}
                        fontSize={112}
                        width={340}
                    />
                    <HStack className="items-center mt-2 w-full gap-2">
                        <HStack className="items-center gap-2">
                            {usesGpsSpeed && (
                                <Icon
                                    size={20}
                                    as={LucideLocateFixed}
                                    className="text-secondary-500"
                                />
                            )}
                            <Text className="text-secondary-500 text-xl font-bold">
                                {speedLabel}
                            </Text>
                        </HStack>
                        <View
                            className="ml-auto"
                            style={{ minHeight: 32, justifyContent: 'center' }}
                        >
                            {showGearInfo && currentGear ? (
                                <GearIndicatorIcon
                                    motorCutoffApplied={motorCutoffApplied}
                                    gear={currentGear}
                                    gearPower={currentGearPower ?? ''}
                                    textClass="text-base font-semibold"
                                />
                            ) : (
                                <Text className="text-secondary-400 text-lg font-semibold">
                                    --
                                </Text>
                            )}
                        </View>
                    </HStack>
                </View>

                <View className="gap-4 flex-1">
                    <View>
                        {showBatteryInformation ? (
                            <HStack className="items-center gap-4">
                                <View className="flex-1">
                                    <BatteryBar
                                        height={24}
                                        socPercentage={parseInt(
                                            displayedBatterySoc
                                        )}
                                    />
                                </View>
                                <Text
                                    className={`${
                                        effectiveBatteryColor ||
                                        'text-secondary-600'
                                    } text-2xl font-bold`}
                                >
                                    {displayedBatteryVoltage}V
                                </Text>
                            </HStack>
                        ) : (
                            <Text className="text-secondary-400 text-sm">
                                {t('trip.stats.energyConsumed')}: --
                            </Text>
                        )}
                    </View>

                    <View
                        onLayout={(event) => {
                            setBarsWidth(event.nativeEvent.layout.width);
                        }}
                    >
                        <AnimatedBars
                            width={barsWidth}
                            lineCurrent={lineCurrent}
                            phaseA={phaseACurrent}
                            phaseC={phaseCCurrent}
                            maxLine={maxLineValue}
                            maxPhase={maxPhaseValue}
                        />
                    </View>

                    <View className="gap-3">
                        <Text className="text-secondary-400 text-xs uppercase font-semibold">
                            {t('trip.stats.motorOutputHeading', 'Motor Output')}
                        </Text>
                        <MotorVitalsCard
                            rpmSharedValue={rpmSharedValue}
                            wattsSharedValue={wattsSharedValue}
                            motorTemperatureCelcius={motorTemperatureCelcius}
                            controllerTemperatureCelcius={mosTemperatureCelcius}
                            prefersFahrenheit={prefersFahrenheit}
                            rpmLabel={t('trip.stats.currentRpm', 'Motor RPM')}
                            wattsLabel={t(
                                'trip.stats.inputPower',
                                'Input Power'
                            )}
                            motorTempLabel={t('trip.stats.motorTemperature')}
                            controllerTempLabel="MOS"
                            style={{ alignSelf: 'stretch' }}
                        />
                    </View>

                    <View className="gap-y-3">
                        {tripSummary ? (
                            <HStack className="flex-wrap gap-y-3">
                                <HudStat
                                    label={t('trip.stats.voltageSag')}
                                    value={sagDisplay}
                                    valueClassName={sagToneClass}
                                />
                                {tripSummary.gpsSampleCount > 0 && (
                                    <HudStat
                                        label={t('trip.stats.maxSpeedGps')}
                                        value={`${tripSummary.gpsMaxSpeed} ${
                                            prefersMph ? 'mph' : 'km/h'
                                        }`}
                                    />
                                )}
                                {tripSummary.gpsSampleCount > 0 && (
                                    <HudStat
                                        label={t('trip.stats.avgSpeedGps')}
                                        value={`${tripSummary.gpsAvgSpeed} ${
                                            prefersMph ? 'mph' : 'km/h'
                                        }`}
                                    />
                                )}
                                <HudStat
                                    label={t('trip.stats.distance')}
                                    value={`${tripSummary.distance} ${
                                        prefersMph ? 'mi' : 'km'
                                    }`}
                                />
                                <HudStat
                                    label={t(
                                        'trip.stats.remainingDistance',
                                        'Remaining'
                                    )}
                                    value={`${tripSummary.remaining} ${
                                        prefersMph ? 'mi' : 'km'
                                    }`}
                                    icon={
                                        <Icon
                                            as={LucideFuel}
                                            size={12}
                                            className="text-secondary-500"
                                        />
                                    }
                                />
                                <HudStat
                                    label={t('trip.stats.cumulativeEnergy')}
                                    value={`${tripSummary.cumulativeEnergy}Wh`}
                                />
                                <HudStat
                                    label={t('trip.stats.maxSpeedCalculated')}
                                    value={`${tripSummary.maxSpeed} ${
                                        prefersMph ? 'mph' : 'km/h'
                                    }`}
                                />
                                <HudStat
                                    label={t('trip.stats.avgSpeedCalculated')}
                                    value={`${tripSummary.avgSpeed} ${
                                        prefersMph ? 'mph' : 'km/h'
                                    }`}
                                />
                                <HudStat
                                    label={t('trip.stats.avgPower')}
                                    value={`${tripSummary.avgPower}W`}
                                />
                                <HudStat
                                    label={prefersMph ? 'Wh/mi' : 'Wh/km'}
                                    value={`${tripSummary.whPerUnit}`}
                                />
                                <HudStat
                                    label={t('trip.stats.maxVoltageSag')}
                                    value={`${tripSummary.maxVoltageSag}V`}
                                />
                                <HudClockStat
                                    label={t('trip.stats.timeElapsed')}
                                    startTime={tripSummary.startTime}
                                />
                            </HStack>
                        ) : (
                            <View className="w-full items-start justify-center">
                                <Text className="text-secondary-400">
                                    {t(
                                        'trip.noActiveTrip',
                                        'No active trip right now.'
                                    )}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const HudStat = ({
    label,
    value,
    valueClassName,
    icon,
}: {
    label: string;
    value: string;
    valueClassName?: string;
    icon?: React.ReactNode;
}) => (
    <View className="w-1/2">
        <Text className="text-secondary-500 text-xs uppercase font-semibold">
            {label}
        </Text>
        <HStack className="items-center gap-1">
            <Text
                className={`text-secondary-600 text-xl font-bold ${
                    valueClassName ?? ''
                }`}
            >
                {value}
            </Text>
            {icon}
        </HStack>
    </View>
);

const HudClockStat = ({
    label,
    startTime,
}: {
    label: string;
    startTime: number;
}) => (
    <View className="w-1/2">
        <Text className="text-secondary-500 text-xs uppercase font-semibold">
            {label}
        </Text>
        <Clock
            startTime={startTime}
            className="text-secondary-600 text-xl font-bold"
        />
    </View>
);

export type ControllerPortraitViewProps = {
    controller: Controller;
    controllerFaults: { title: string; description: string }[];
    device: Device | undefined;
    batteryVoltage: string | null;
    batterySoc: string | null;
    batteryColor: string | null;
    hasReceivedBatteryInformation: boolean;
    currentGear: string | null;
    currentGearPower: string | null;
    prefersMph: boolean;
    prefersFahrenheit: boolean;
    calculatedSpeedSharedValue: any;
    rpmSharedValue: any;
    wattsSharedValue: any;
    lineCurrent: any;
    phaseACurrent: any;
    phaseCCurrent: any;
    maxLineCurrent: string | null;
    maxPhaseCurrent: string | null;
    mosTemperatureCelcius: number | undefined;
    motorTemperatureCelcius: number | undefined;
    tripSummary: TripSummary | null;
    isScanning: boolean;
    usesGpsSpeed: boolean;
    voltageSag: number;
    currentLocation: { latitude: number; longitude: number } | null;
    motorCutoffApplied: SharedValue<boolean>;
};

export default memo(ControllerPortraitView);
