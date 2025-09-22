import React from 'react';
import colors from 'tailwindcss/colors';
import {ActivityIndicator} from 'react-native';

const BFSpinner = ({
                     size = 20,
                     color = colors.slate['300'],
                     ...props
                 }: {
    size?: number | 'small' | 'large';
    color?: string;
}) => <ActivityIndicator color={color} size={size} {...props} />;

export default BFSpinner;
