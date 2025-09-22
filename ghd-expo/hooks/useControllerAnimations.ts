import {
    useSharedValue,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
    interpolate,
    type SharedValue,
} from 'react-native-reanimated';
import type { Device } from 'react-native-ble-plx';

export type UseControllerAnimationsArgs = {
    paddingTop: number;
    device: Device | undefined;
    rpmSharedValue: SharedValue<number>;
    isLandscape: boolean;
};

export type UseControllerAnimationsReturn = {
    scrollPosition: SharedValue<number>;
    animatedView: ReturnType<typeof useAnimatedStyle>;
    animatedBikeView: ReturnType<typeof useAnimatedStyle>;
    animatedBikeOpacity: SharedValue<number>;
    animatedMphStyle: ReturnType<typeof useAnimatedStyle>;
};

const useControllerAnimations = ({
    paddingTop,
    device,
    rpmSharedValue,
    isLandscape,
}: UseControllerAnimationsArgs): UseControllerAnimationsReturn => {
    const scrollPosition = useSharedValue(0);

    const animatedView = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollPosition.value,
                [0, paddingTop / 2, paddingTop],
                [1, 0.3, 0]
            ),
        };
    }, [paddingTop]);

    const animatedBikeView = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollPosition.value,
                [0, paddingTop / 4, paddingTop],
                [1, 0.15, 0]
            ),
        };
    }, [paddingTop]);

    const animatedBikeOpacity = useDerivedValue(() => {
        if (!device) {
            return withTiming(0.2, { duration: 500 });
        }
        if (scrollPosition.value === 0) {
            return withTiming(1, { duration: 2500 });
        }
        return interpolate(
            scrollPosition.value,
            [0, paddingTop / 4, paddingTop],
            [1, 0.15, 0]
        );
    }, [device, paddingTop]);

    const animatedMphStyle = useAnimatedStyle(() => {
        return {
            opacity:
                rpmSharedValue.value > 0 || (isLandscape && device)
                    ? withTiming(1, { duration: 500 })
                    : withTiming(0, { duration: 500 }),
        };
    }, [rpmSharedValue, isLandscape, device]);

    return {
        scrollPosition,
        animatedView,
        animatedBikeView,
        animatedBikeOpacity,
        animatedMphStyle,
    };
};

export default useControllerAnimations;
