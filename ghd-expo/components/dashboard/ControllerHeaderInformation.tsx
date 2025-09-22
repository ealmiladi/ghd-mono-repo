import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
    LucideBluetoothConnected,
    LucideBluetoothOff,
    LucideBluetoothSearching,
    LucideCircleUser,
} from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { memo } from 'react';
import { useDevices } from '@/providers/BluetoothProvider';
import { useNavigation } from '@react-navigation/native';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const ControllerHeaderInformation = memo(
    ({
        name,
        localName,
        device,
    }: {
        name: string;
        localName: string;
        device: any;
    }) => {
        const navigation = useNavigation();
        const {
            isScanning,
            deviceLoadingStates,
            refreshBle,
            disconnectFromDevice,
            stopScan,
        } = useDevices();

        const isSearchingState =
            (!!deviceLoadingStates[localName] && !device) ||
            (isScanning && !device);

        return (
            <HStack className="items-center justify-between gap-2 mt-2">
                <Heading
                    size="2xl"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ flex: 1 }}
                >
                    {name}
                </Heading>
                <HStack className="h-10 z-30 items-center gap-2">
                    {isSearchingState ? (
                        <Button
                            variant="link"
                            onPress={() => {
                                stopScan();
                            }}
                        >
                            <AnimatedIcon
                                entering={FadeIn}
                                exiting={FadeOut}
                                as={LucideBluetoothSearching}
                                className="text-yellow-500"
                                size={26}
                            />
                        </Button>
                    ) : !!device ? (
                        <Button
                            variant="link"
                            onPress={() => {
                                disconnectFromDevice(device);
                            }}
                        >
                            <AnimatedIcon
                                entering={FadeIn.duration(500)}
                                exiting={FadeOut.duration(500)}
                                as={LucideBluetoothConnected}
                                className="text-blue-500"
                                size={26}
                            />
                        </Button>
                    ) : (
                        <Button
                            variant="link"
                            onPress={() => {
                                refreshBle();
                            }}
                        >
                            <AnimatedIcon
                                entering={FadeIn.duration(500)}
                                exiting={FadeOut.duration(500)}
                                size={26}
                                as={LucideBluetoothOff}
                                className="text-secondary-300"
                            />
                        </Button>
                    )}

                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate('MyProfile' as never);
                        }}
                    >
                        <Icon as={LucideCircleUser} size={26} />
                    </TouchableOpacity>
                </HStack>
            </HStack>
        );
    }
);

ControllerHeaderInformation.displayName = 'ControllerHeaderInformation';

export default ControllerHeaderInformation;
