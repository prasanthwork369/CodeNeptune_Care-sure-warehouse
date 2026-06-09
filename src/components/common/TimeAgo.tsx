import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { formatTimeAgo } from '@/src/utils/dateUtils';

interface TimeAgoProps {
    date: string | Date | number;
    style?: StyleProp<TextStyle>;
    className?: string;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ date, style, className }) => {
    return (
        <Text style={style} className={className}>
            {formatTimeAgo(date)}
        </Text>
    );
};

export default TimeAgo;
