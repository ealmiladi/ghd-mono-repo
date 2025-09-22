import {
    AppState,
    FlatList,
    SafeAreaView,
    useWindowDimensions,
    View,
} from 'react-native';
import { useUser } from '@/providers/UserContextProvider';
import React, { useEffect, useState, useRef } from 'react';
import ControllerPage from '@/components/dashboard/ControllerPage';
import { useDevices } from '@/providers/BluetoothProvider';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LandingDashboardScreen = () => {
    const { controllers, setLastViewedController, user } = useUser();
    const { refreshBle } = useDevices();
    const { width, height } = useWindowDimensions();
    const [appState, setAppState] = useState(AppState.currentState);
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const initialLoad = useRef(true);

    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (
                appState.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                refreshBle();
            }
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener(
            'change',
            handleAppStateChange
        );

        return () => {
            subscription.remove();
        };
    }, [appState, refreshBle]);

    useEffect(() => {
        // Scroll to the correct position when the width changes
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({
                offset: activeIndex * width,
                animated: false,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width]);

    useEffect(() => {
        if (initialLoad.current && user.doc?.lastViewedController) {
            const index = controllers.findIndex(
                (controller) =>
                    controller.serialNumber === user.doc.lastViewedController
            );
            if (index !== -1) {
                flatListRef.current?.scrollToOffset({
                    offset: index * width,
                    animated: false,
                });
                setActiveIndex(index);
            }
            initialLoad.current = false;
        }
    }, [
        flatListRef,
        controllers,
        user.doc.lastViewedController,
        activeIndex,
        width,
    ]);

    const handleScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
        setLastViewedController(controllers?.[index]?.serialNumber);
    };

    const snapToOffsets = controllers.map((_, index) => index * width);

    const insets = useSafeAreaInsets();
    const isLandScape = height < width;

    return (
        <>
            <StatusBar />
            <View className="w-full" style={{ flex: 1 }}>
                <FlatList
                    ref={flatListRef}
                    data={controllers}
                    keyExtractor={(item) => item.serialNumber}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    snapToOffsets={snapToOffsets}
                    decelerationRate="fast"
                    renderItem={({ item }) => (
                        <Animated.View
                            entering={FadeIn.duration(500)}
                            exiting={FadeOut}
                            key={item.serialNumber}
                            style={{ width }}
                        >
                            <ControllerPage controller={item} />
                        </Animated.View>
                    )}
                />
                {!isLandScape && (
                    <View
                        className={
                            !isLandScape
                                ? 'absolute bottom-12 flex-row justify-center w-full'
                                : 'absolute bottom-12 w-full flex-row justify-end'
                        }
                        style={{
                            zIndex: 100,
                            ...(isLandScape
                                ? {
                                      paddingRight: insets.right + 16,
                                      paddingLeft: insets.left + 16,
                                  }
                                : {}),
                        }}
                    >
                        {controllers.map((_: any, index: number) => (
                            <View
                                key={index}
                                className={`h-3 w-3 mx-2 rounded-full ${
                                    activeIndex === index
                                        ? 'bg-secondary-700'
                                        : 'bg-secondary-500'
                                }`}
                            />
                        ))}
                    </View>
                )}
            </View>
        </>
    );
};

export default LandingDashboardScreen;
