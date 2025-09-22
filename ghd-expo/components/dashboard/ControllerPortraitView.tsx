import React, { memo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import NumberTicker from '@/components/dashboard/NumberTicker';
import BatteryBar from '@/components/dashboard/BatteryBar';
import AnimatedBars from '@/components/dashboard/AnimatedAmps';
import Clock from '@/components/dashboard/Clock';
import { Icon } from '@/components/ui/icon';
import { LucideLocateFixed } from 'lucide-react-native';
import { Controller } from '@/interfaces/Controller';
import { Device } from 'react-native-ble-plx';
import type { TripSummary } from '@/components/dashboard/types';
import { IS_SIMULATOR_MODE } from '@/utils/env';

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
    rpmSharedValue: _rpmSharedValue,
    wattsSharedValue: _wattsSharedValue,
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
}: ControllerPortraitViewProps) => {
    const { t } = useTranslation();
    const portraitInsets = useSafeAreaInsets();
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

    return (
        <View
            className="flex-1 justify-between px-6 py-6"
            style={{
                paddingBottom: portraitInsets.bottom + 24,
                paddingTop: 12,
            }}
        >
            <View>
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

            <View className="items-center mt-6">
                <NumberTicker
                    hideWhenZero={false}
                    sharedValue={calculatedSpeedSharedValue}
                    fontSize={132}
                    width={396}
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
            </View>

            <View className="mt-4">
                {showBatteryInformation ? (
                    <HStack className="items-center gap-4">
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
            </View>

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

            <HStack className="justify-between mt-4">
                <HudTemperature
                    title={t('trip.stats.controllerTemperature', 'Controller')}
                    value={mosTemperatureCelcius}
                    prefersFahrenheit={prefersFahrenheit}
                />
                <HudTemperature
                    title={t('trip.stats.motorTemperature')}
                    value={motorTemperatureCelcius}
                    prefersFahrenheit={prefersFahrenheit}
                />
            </HStack>

            <View className="mt-4">
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
                            label={t('trip.stats.remainingDistance')}
                            value={`${tripSummary.remaining} ${
                                prefersMph ? 'mi' : 'km'
                            }`}
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
                ) : (
                    <Text className="text-secondary-400">
                        {t('trip.noTripsFound')}
                    </Text>
                )}
            </View>
        </View>
    );
};

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
            className={`text-secondary-600 text-xl font-bold ${
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
            className="text-secondary-600 text-xl font-bold"
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
            <Text className={`text-3xl font-bold ${color}`}>
                {converted.toFixed(0)}
                {unit}
            </Text>
        </View>
    );
};

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
};

export default memo(ControllerPortraitView);
