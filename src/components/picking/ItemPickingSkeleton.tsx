import React from 'react';
import { View } from 'react-native';
import Skeleton from '../common/Skeleton';

const ItemPickingSkeleton = () => {
    return (
        <View 
            className="p-5 rounded-2xl mb-4 border border-[#EEEEEE] bg-white"
            style={{ borderWidth: 1.5 }}
        >
            <View className="flex-row justify-between">
                <View className="flex-1">
                    {/* Item Name shimmer */}
                    <Skeleton width={180} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
                    {/* Manufacturer shimmer */}
                    <Skeleton width={120} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                    
                    {/* Tags shimmer */}
                    <View className="flex-row items-center mb-6">
                        <Skeleton width={100} height={24} borderRadius={8} style={{ marginRight: 8 }} />
                        <Skeleton width={100} height={24} borderRadius={8} />
                    </View>

                    {/* Quantity shimmer */}
                    <View className="flex-row items-baseline">
                        <Skeleton width={60} height={42} borderRadius={10} />
                        <Skeleton width={100} height={18} borderRadius={4} style={{ marginLeft: 8 }} />
                    </View>
                </View>

                {/* Checkbox and Partial buttons shimmer */}
                <View className="items-end justify-between ml-4">
                    <Skeleton width={24} height={24} borderRadius={6} />
                    <Skeleton width={80} height={36} borderRadius={12} />
                </View>
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
