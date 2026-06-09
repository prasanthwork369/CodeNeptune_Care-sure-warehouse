import { View } from 'react-native';
import Skeleton from '../common/Skeleton';

export const ProfileSkeleton = () => {
  return (
    <View className="flex-1 px-5 pt-10 bg-white">
      {/* Header Skeleton */}
      <View className="items-center mt-6 mb-8">
        <Skeleton width={124} height={124} borderRadius={62} />
        <Skeleton width={180} height={28} borderRadius={14} style={{ marginTop: 16 }} />
        <Skeleton width={100} height={18} borderRadius={9} style={{ marginTop: 8 }} />
        <Skeleton width={80} height={32} borderRadius={16} style={{ marginTop: 12 }} />
      </View>

      {/* Account Details Label */}
      <View className="mb-3">
        <Skeleton width={120} height={20} borderRadius={4} />
      </View>

      {/* Account Details Card Skeleton */}
      <View className="bg-white rounded-[24px] p-5 mb-8 border border-[#F0F0F0]">
        {[1, 2, 3].map((i) => (
          <View key={i} className={`flex-row items-center ${i < 3 ? 'mb-6' : ''}`}>
            <Skeleton width={48} height={48} borderRadius={16} />
            <View className="ml-4 flex-1">
              <Skeleton width={100} height={14} borderRadius={4} />
              <Skeleton width="80%" height={18} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </View>

      {/* Logout Skeleton */}
      <View className="flex-row ml-2 items-center py-2">
        <Skeleton width={18} height={18} borderRadius={4} />
        <View style={{ width: 12 }} />
        <Skeleton width={80} height={20} borderRadius={4} />
      </View>
    </View>
  );
};
