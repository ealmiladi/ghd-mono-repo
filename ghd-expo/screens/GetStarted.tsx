import React, { useState, useRef, useMemo } from 'react';
import {
    FlatList,
    View,
    Dimensions,
    SafeAreaView,
    useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

const GetStartedPage = () => {
    const { width } = Dimensions.get('window');
    const { t } = useTranslation();

    const slides = useMemo(
        () => [
            {
                id: '1',
                title: t('getStarted.slide1.title'),
                source: require('../assets/lottie/speedometer.json'),
                description: t('getStarted.slide1.description'),
            },
            {
                id: '2',
                title: t('getStarted.slide2.title'),
                source: require('../assets/lottie/controller.json'),
                description: t('getStarted.slide2.description'),
            },
            {
                id: '3',
                title: t('getStarted.slide3.title'),
                source: require('../assets/lottie/bike-charging.json'),
                description: t('getStarted.slide3.description'),
            },
            {
                id: '4',
                title: t('getStarted.slide4.title'),
                source: require('../assets/lottie/speedometer.json'),
                description: t('getStarted.slide4.description'),
            },
        ],
        [t]
    );

    const nav = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);

        if (
            index === slides.length - 1 &&
            event.nativeEvent.contentOffset.x >
                width * (slides.length - 1) + width / 7
        ) {
            nav.navigate('Register' as never);
        }
    };

    const goToNextSlide = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            nav.navigate('Register' as never);
        }
    };

    const colorScheme = useColorScheme();

    const colorFilters = useMemo(
        () => [
            {
                keypath: 'C',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for layer
            },
            {
                keypath: 'R',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for another layer
            },
            {
                keypath: 'S',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'l',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'B',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'L',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'E',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'Group 1',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'NULL Control',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'Layer 2',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'Layer 3',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'Layer 4',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'Layer 5',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'Layer 6',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
            {
                keypath: 'Layer 4',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
            },
        ],
        [colorScheme]
    );

    const lottieWidth = Math.min(width * 0.8, 300);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled // Ensures snapping to slides
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                        className="px-8 flex flex-col items-center justify-center w-full"
                        style={{ width }}
                    >
                        <Heading className="text-4xl font-bold text-center mt-4">
                            {item.title}
                        </Heading>
                        {!!item.source && (
                            <LottieView
                                colorFilters={colorFilters}
                                source={item.source}
                                resizeMode="cover"
                                autoPlay
                                style={{
                                    width: lottieWidth,
                                    height: 300,
                                    alignSelf: 'center',
                                }}
                            />
                        )}
                        <Text className="text-secondary-500 text-2xl font-semibold text-center mt-2">
                            {item.description}
                        </Text>
                    </View>
                )}
            />

            <View className="w-full px-4 mb-8">
                <Button onPress={goToNextSlide}>
                    <ButtonText>
                        {currentIndex < slides.length - 1
                            ? t('common.next')
                            : t('getStarted.button')}
                    </ButtonText>
                </Button>
            </View>

            <View
                className="flex-row justify-center w-full py-4"
                style={{ zIndex: 100 }}
            >
                {slides.map((_: any, index: number) => (
                    <View
                        key={index}
                        className={`h-3 w-3 mx-2 rounded-full ${
                            currentIndex === index
                                ? 'bg-secondary-700'
                                : 'bg-secondary-300'
                        }`}
                    />
                ))}
            </View>
        </SafeAreaView>
    );
};

export default GetStartedPage;
