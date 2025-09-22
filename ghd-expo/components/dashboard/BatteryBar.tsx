import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';
import { useEffect } from 'react';
import { Text } from '@/components/ui/text';

const BARS = 4;
const STATE_OF_CHARGE_PERCENTAGE_THRESHOLD = 50;

const BatteryBar = ({
    socPercentage,
    height = 24,
    borderClass = 'border-secondary-300',
}: {
    height?: number;
    borderClass?: string;
    socPercentage: number;
}) => {
    const safeSoc = Number.isFinite(socPercentage)
        ? Math.max(0, Math.min(100, socPercentage))
        : 0;

    const backgroundAnimation = useSharedValue(safeSoc);
    const totalWidth = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${backgroundAnimation.value}%`,
        };
    });

    useEffect(() => {
        backgroundAnimation.value = withTiming(safeSoc, {
            duration: 1000,
        });
    }, [backgroundAnimation, safeSoc]);

    const linearGradientAnimatedStyle = useAnimatedStyle(() => {
        return {
            width: totalWidth.value,
        };
    });

    const leftAligned = safeSoc < STATE_OF_CHARGE_PERCENTAGE_THRESHOLD;

    return (
        <Animated.View
            onLayout={(event) => {
                if (totalWidth.value === 0) {
                    totalWidth.value = event.nativeEvent.layout.width;
                }
            }}
            className={`bg-background-muted border ${borderClass} flex-row items-center`}
            style={{
                width: '100%',
                height,
                borderRadius: 6,
                padding: 2,
                position: 'relative',
            }}
        >
            <View className="absolute h-full -right-3 w-2 flex-row items-center">
                <View
                    className={`rounded-r-lg h-2 bg-background-muted border ${borderClass} flex-row items-center`}
                />
            </View>
            <View
                className={`z-20 ${leftAligned ? (safeSoc < 30 ? 'right-2' : 'right-1.5') : safeSoc > 70 ? 'left-2' : 'left-1.5'}
            absolute flex-row justify-center items-center`}
            >
                <Text
                    className={`${leftAligned ? 'text-secondary-500' : 'text-secondary-50'} font-bold`}
                >
                    {safeSoc}
                </Text>
                <Text
                    style={{ fontSize: 8 }}
                    className={`${leftAligned ? 'text-secondary-500' : 'text-secondary-50'} font-bold`}
                >
                    %
                </Text>
            </View>
            <Animated.View
                style={[
                    animatedStyle,
                    {
                        height: '100%',
                        borderRadius: 4,
                        overflow: 'hidden',
                    },
                ]}
            >
                <Animated.View
                    style={[
                        linearGradientAnimatedStyle,
                        {
                            height: '100%',
                            overflow: 'hidden',
                        },
                    ]}
                    className="flex-row items-center h-full w-full bg-secondary-500"
                >
                    <View className={`flex-row items-start`}>
                        {[...Array(BARS)].map((_, index) => (
                            <View
                                key={index}
                                className="border-background-muted flex-row items-center justify-center"
                                style={{
                                    height: height - 6,
                                    overflow: 'hidden',
                                    width: `${100 / BARS}%`,
                                }}
                            ></View>
                        ))}
                    </View>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};

export default BatteryBar;
