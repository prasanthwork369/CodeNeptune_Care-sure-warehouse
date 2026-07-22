import React from 'react';
import { View } from 'react-native';
import Skeleton from '../common/Skeleton';

const ItemPickingSkeleton = () => {
    return (
        <View 
            className="p-4 rounded-[20px] mb-5 bg-white border border-[#EBEBEB]"
            style={{ borderWidth: 0.5 }}
        >
            <View className="flex-row items-center">
                {/* Left Column: Image Skeleton */}
                <Skeleton width={120} height={120} borderRadius={12} />

                {/* Right Column: Info Skeleton */}
                <View className="flex-1 ml-4 justify-between">
                    {/* Name + Checkbox Skeleton */}
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-2">
                            <Skeleton width={150} height={20} borderRadius={6} style={{ marginBottom: 6 }} />
                            <Skeleton width={90} height={14} borderRadius={4} />
                        </View>
                        <Skeleton width={24} height={24} borderRadius={4} />
                    </View>

                    {/* Tags Skeleton */}
                    <View className="flex-row items-center mt-3" style={{ gap: 8 }}>
                        <Skeleton width={88} height={22} borderRadius={999} />
                        <Skeleton width={72} height={22} borderRadius={999} />
                    </View>

                    {/* Quantity Skeleton */}
                    <View className="flex-row items-baseline mt-2">
                        <Skeleton width={44} height={36} borderRadius={8} />
                        <Skeleton width={90} height={14} borderRadius={4} style={{ marginLeft: 8 }} />
                    </View>
                </View>
            </View>

            {/* Full-width Divider Line */}
            <View style={{ height: 1, backgroundColor: '#E2E4E2', marginTop: 14, marginBottom: 12 }} />

            {/* Bottom Buttons Skeleton (Batch & Short Qty) */}
            <View className="flex-row items-center justify-between">
                <Skeleton width={104} height={36} borderRadius={8} />
                <Skeleton width={104} height={36} borderRadius={8} />
            </View>
        </View>
    );
};

export const ItemPickingSkeletonList = () => (
    <View className="px-5 pt-4">
        <ItemPickingSkeleton />
        <ItemPickingSkeleton />
        <ItemPickingSkeleton />
    </View>
);

export default ItemPickingSkeleton;
