import React from 'react';
import {View, ViewProps} from 'react-native';

const BFCard: React.FC<ViewProps> = ({children, ...rest}) => {
    return (
        <View className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4" {...rest}>
            {children}
        </View>
    );
};

export default BFCard;
