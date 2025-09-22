import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const useControllerOrientation = () => {
    const [isLandscape, setIsLandscape] = useState(() => {
        const { width, height } = Dimensions.get('window');
        return width > height;
    });

    useEffect(() => {
        const handler = ({ window: { width, height } }: any) => {
            const landscape = width > height;
            setIsLandscape(landscape);
            if (landscape) {
                activateKeepAwakeAsync().catch(() => {});
            } else {
                deactivateKeepAwake().catch(() => {});
            }
        };

        const subscription = Dimensions.addEventListener('change', handler);

        return () => {
            subscription?.remove?.();
        };
    }, []);

    useEffect(() => {
        if (isLandscape) {
            activateKeepAwakeAsync().catch(() => {});
        } else {
            deactivateKeepAwake().catch(() => {});
        }
    }, [isLandscape]);

    return isLandscape;
};

export default useControllerOrientation;
