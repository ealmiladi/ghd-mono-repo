import { useEffect, useState } from 'react';
import { Text } from '@/components/ui/text';

const Clock = ({ startTime, className }) => {
    const [elapsedTime, setElapsedTime] = useState(Date.now() - startTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (timeInMs) => {
        const totalSeconds = Math.floor(timeInMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return <Text className={className}>{formatTime(elapsedTime)}</Text>;
};

export default Clock;
