import {
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Box } from '@/components/ui/box';
import { Icon } from '@/components/ui/icon';
import { LucideCpu, RotateCw } from 'lucide-react-native';
import { useUser } from '@/providers/UserContextProvider';
import React from 'react';
import { useDevices } from '@/providers/BluetoothProvider';
import { Device } from 'react-native-ble-plx';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { useTranslation } from 'react-i18next';
import ListItem from '@/components/dashboard/ListItem';
import LottieView from 'lottie-react-native';

const DevicesScreen = () => {
    const { t } = useTranslation();
    const { loadingControllers } = useUser();
    const {
        connectToDevice,
        unconnectedDevices,
        connectedDevices,
        refreshBle,
        deviceLoadingStates,
    } = useDevices();
    const colorScheme = useColorScheme();

    return (
        <ScrollView
            className={'p-4'}
            refreshControl={
                <RefreshControl
                    progressViewOffset={20}
                    refreshing={loadingControllers}
                    onRefresh={() => refreshBle()}
                />
            }
        >
            {loadingControllers && <Spinner size="small" />}

            {!loadingControllers && (
                <Box className="mb-8 px-8">
                    <LottieView
                        source={require('../../components/bt-animation.json')}
                        autoPlay
                        resizeMode="cover"
                        colorFilters={[
                            {
                                keypath: 'L',
                                color: colorScheme === 'dark' ? '#fff' : '#000',
                            },
                        ]}
                        style={{
                            width: 250,
                            height: 200,
                            alignSelf: 'center',
                        }}
                    />
                    <Heading size="xl" className="font-bold text-center">
                        {t('devices.getStarted')}
                    </Heading>
                    <Text className="text-secondary-600 mt-1 text-center">
                        {t('devices.subTitle')}
                    </Text>
                </Box>
            )}

            {!!connectedDevices.length && (
                <Heading>{t('devices.connected')}</Heading>
            )}
            {connectedDevices.map((device: Device) => (
                <DeviceRow
                    key={device.id}
                    device={device}
                    isConnected={true}
                    onPress={() => device?.cancelConnection()}
                />
            ))}

            <HStack className="mt-4 items-center justify-between">
                <Heading>{t('devices.deviceList')}</Heading>
                <TouchableOpacity onPress={() => refreshBle()}>
                    <HStack className={'items-center gap-2'}>
                        <Icon as={RotateCw} />
                        <Text className="font-bold">{t('common.refresh')}</Text>
                    </HStack>
                </TouchableOpacity>
            </HStack>
            {unconnectedDevices.map((device: Device) => (
                <UnconnectedDevice
                    key={device.id}
                    device={device}
                    loading={!!deviceLoadingStates[device.name!]}
                    onPress={() => connectToDevice(device)}
                />
            ))}
        </ScrollView>
    );
};

const DeviceRow = ({
    device,
    isConnected,
    onPress,
    loading,
}: {
    device: Device;
    isConnected: boolean;
    onPress: () => void;
    loading?: boolean;
}) => {
    return (
        <Box className="flex-row items-center mb-2">
            <Text size="lg" className="flex-1">
                {device.name}
            </Text>
            <Button
                size="md"
                variant="solid"
                action="primary"
                onPress={onPress}
                className="flex-row items-center"
            >
                {loading && <Spinner size="small" />}
                <ButtonText className="font-bold">
                    {isConnected ? 'Disconnect' : 'Connect'}
                </ButtonText>
            </Button>
        </Box>
    );
};

const UnconnectedDevice = ({
    device,
    onPress,
    loading,
}: {
    device: Device;
    onPress: () => void;
    loading?: boolean;
}) => {
    return (
        <View className="mb-2">
            <ListItem
                icon={LucideCpu}
                title={device.name || 'Unknown Device'}
                loading={loading}
                description={
                    device.rssi
                        ? `Signal: ${device.rssi} dBm`
                        : 'No signal info'
                }
                onPress={!loading ? onPress : () => {}}
            />
        </View>
    );
};

export default DevicesScreen;
