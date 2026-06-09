import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';

const DispatcherIllustration = ({ width = 120, height = 120 }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 120 120" fill="none">
            {/* Phone Body */}
            <Rect x="20" y="10" width="50" height="90" rx="8" stroke="white" strokeWidth="4" />
            <Rect x="25" y="15" width="40" height="70" rx="4" fill="white" fillOpacity="0.2" />
            
            {/* Camera/Sensor area */}
            <Rect x="30" y="30" width="30" height="30" rx="4" stroke="white" strokeWidth="2" />
            <Path d="M35 35L40 35M35 35L35 40" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <Path d="M55 35L50 35M55 35L55 40" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <Path d="M35 55L40 55M35 55L35 50" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <Path d="M55 55L50 55M55 55L55 50" stroke="white" strokeWidth="2" strokeLinecap="round" />

            {/* Hand holding the phone */}
            <G transform="translate(60, 60)">
                <Path 
                    d="M10 0 C 15 -10, 25 -10, 30 0 L 35 40 C 35 45, 30 50, 25 50 L -10 50 C -15 50, -20 45, -20 40 L -20 20 L -10 10 L 0 10 Z" 
                    fill="white" 
                />
                {/* Thumb */}
                <Path d="M-5 10 C -5 0, 5 0, 5 10 L 5 25 L -5 25 Z" fill="white" />
            </G>

            {/* Scanning Barcode on the side */}
            <G transform="translate(5, 40)">
                <Rect x="0" y="0" width="10" height="15" stroke="white" strokeWidth="2" />
                <Path d="M2 3 L 8 3 M 2 7 L 8 7 M 2 11 L 8 11" stroke="white" strokeWidth="1" />
                
                <Rect x="0" y="20" width="10" height="15" stroke="white" strokeWidth="2" />
                <Path d="M2 23 L 8 23 M 2 27 L 8 27 M 2 31 L 8 31" stroke="white" strokeWidth="1" />
            </G>
        </Svg>
    );
};

export default DispatcherIllustration;
