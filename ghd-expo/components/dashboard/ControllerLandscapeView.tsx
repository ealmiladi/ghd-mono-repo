import React, { memo, useState } from 'react';
import { View } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import NumberTicker from '@/components/dashboard/NumberTicker';
import { Icon } from '@/components/ui/icon';
import { LucideLocateFixed } from 'lucide-react-native';
import AnimatedBars from '@/components/dashboard/AnimatedAmps';
import BatteryBar from '@/components/dashboard/BatteryBar';
import Clock from '@/components/dashboard/Clock';
import { useTranslation } from 'react-i18next';
import { Controller } from '@/interfaces/Controller';
import { Device } from 'react-native-ble-plx';
import type { TripSummary } from '@/components/dashboard/types';
import { IS_SIMULATOR_MODE } from '@/utils/env';

export type ControllerLandscapeViewProps = {
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
    insets: any;
};

const ControllerLandscapeView = memo(({
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
    insets,
}: ControllerLandscapeViewProps) => {
    const { t } = useTranslation();
    const [barsWidth, setBarsWidth] = useState(400);

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

    return (
        <View
            className="flex-1 px-8 py-4"
            style={{
                paddingLeft: insets.left + 32,
                paddingRight: insets.right + 32,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
            }}
        >
            <HStack className="flex-1 gap-8">
                {/* Left column - Controller info and stats */}
                <View className="flex-1">
                    <View className="mb-6">
                        <Text className="text-secondary-500 text-xl font-bold">
                            {controller.name}
                        </Text>
                        {!isConnected && (
                            <Text className="text-secondary-500 text-sm font-semibold">
                                {controller.serialNumber}
                            </Text>
                        )}
                        <Text className="text-secondary-400 text-sm mt-1">
                            {isConnected
                                ? t('common.connected')
                                : isScanning
                                  ? t('common.searching')
                                  : t('common.disconnected')}
                        </Text>
                        {!!controllerFaults.length && (
                            <Text className="text-error-500 text-sm font-semibold mt-1">
                                {t('common.faultDetected')}
                            </Text>
                        )}
                        {(currentGear || currentGearPower) && (
                            <Text className="text-secondary-500 text-sm mt-2">
                                Gear: {currentGear || '--'} · Mode:{' '}
                                {currentGearPower || '--'}
                            </Text>
                        )}
                    </View>

                    {/* Trip statistics */}
                    {tripSummary ? (
                        <View className="flex-1">
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
                                    label={t('trip.stats.remainingDistance')}
                                    value={`${tripSummary.remaining} ${
                                        prefersMph ? 'mi' : 'km'
                                    }`}
                                />
                                <HudStat
                                    label={t('trip.stats.cumulativeEnergy')}
                                    value={`${tripSummary.cumulativeEnergy}Wh`}
                                />
                            </HStack>
                        </View>
                    ) : (
                        <Text className="text-secondary-400">
                            {t('trip.noTripsFound')}
                        </Text>
                    )}
                </View>

                {/* Center column - Speed display */}
                <View className="flex-1 items-center justify-center">
                    <NumberTicker
                        hideWhenZero={false}
                        sharedValue={calculatedSpeedSharedValue}
                        fontSize={120}
                        width={360}
                    />
                    <HStack className="items-center mt-2 gap-2">
                        {usesGpsSpeed && (
                            <Icon
                                size={24}
                                as={LucideLocateFixed}
                                className="text-secondary-500"
                            />
                        )}
                        <Text className="text-secondary-500 text-2xl font-bold">
                            {prefersMph ? 'MPH' : 'KPH'}
                        </Text>
                    </HStack>

                    {/* Battery and amperage bars */}
                    <View className="mt-8 w-full">
                        {showBatteryInformation ? (
                            <HStack className="items-center gap-4 mb-4">
                                <View className="flex-1">
                                    <BatteryBar
                                        height={24}
                                        socPercentage={parseInt(displayedBatterySoc)}
                                    />
                                </View>
                                <Text
                                    className={`${effectiveBatteryColor} text-2xl font-bold`}
                                >
                                    {displayedBatteryVoltage}V
                                </Text>
                            </HStack>
                        ) : (
                            <Text className="text-secondary-400">
                                {t('trip.stats.energyConsumed')}: --
                            </Text>
                        )}

                        <View
                            className="mt-4"
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
                    </View>
                </View>

                {/* Right column - Temperature and additional stats */}
                <View className="flex-1">
                    <HStack className="justify-between mb-6">
                        <HudTemperature
                            title="MOS"
                            value={mosTemperatureCelcius}
                            prefersFahrenheit={prefersFahrenheit}
                        />
                        <HudTemperature
                            title={t('trip.stats.motorTemperature')}
                            value={motorTemperatureCelcius}
                            prefersFahrenheit={prefersFahrenheit}
                        />
                    </HStack>

                    {tripSummary && (
                        <View className="flex-1">
                            <HStack className="flex-wrap gap-y-3">
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
                                    value={tripSummary.whPerUnit}
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
                        </View>
                    )}
                </View>
            </HStack>
        </View>
    );
});

ControllerLandscapeView.displayName = 'ControllerLandscapeView';

const HudStat = ({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) => (
    <View className="w-1/2">
        <Text className="text-secondary-500 text-xs uppercase font-semibold">
            {label}
        </Text>
        <Text
            className={`text-secondary-600 text-lg font-bold ${
                valueClassName ?? ''
            }`}
        >
            {value}
        </Text>
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
            className="text-secondary-600 text-lg font-bold"
        />
    </View>
);

const HudTemperature = ({
    title,
    value,
    prefersFahrenheit,
}: {
    title: string;
    value: number | undefined;
    prefersFahrenheit: boolean;
}) => {
    if (value === undefined) {
        return null;
    }
    const converted = prefersFahrenheit ? value * 1.8 + 32 : value;
    const unit = prefersFahrenheit ? '°F' : '°C';
    const color =
        value < 60
            ? 'text-green-500'
            : value < 80
              ? 'text-yellow-500'
              : 'text-red-500';

    return (
        <View className="items-start">
            <Text className="text-secondary-500 text-xs uppercase font-semibold">
                {title}
            </Text>
            <Text className={`text-2xl font-bold ${color}`}>
                {converted.toFixed(0)}
                {unit}
            </Text>
        </View>
    );
};

export default ControllerLandscapeView;