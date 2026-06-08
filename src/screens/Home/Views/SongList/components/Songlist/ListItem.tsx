import { memo, useState } from 'react' // 📺 引入 useState 监听遥控器
import { View, Platform, Pressable } from 'react-native' // 📺 引入 Pressable 替代 TouchableOpacity
import { createStyle } from '@/utils/tools'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Image from '@/components/common/Image'

const gap = scaleSizeW(15)

export default memo(({ item, index, width, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  width: number
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const theme = useTheme()
  const itemWidth = width - gap
  
  // 📺 电视端核心：增加组件内部状态监听遥控器光标
  const [isFocused, setIsFocused] = useState(false)

  const handlePress = () => {
    onPress(item, index)
  }

  return (
    item.source
      ? (
          /* 📺 将包裹层升级为可聚焦的 Pressable，作为电视遥控器的单一焦点目标 */
          <Pressable
            focusable={true} // 📺 必须：允许遥控器获取焦点
            onFocus={() => setIsFocused(true)} // 📺 遥控器光标移入
            onBlur={() => setIsFocused(false)}  // 📺 遥控器光标移出
            onPress={handlePress} // 📺 按遥控器 OK 键触发点击
            style={({ pressed }) => [
              styles.listItem,
              {
                width: itemWidth,
                // 📺 当遥控器移上去时，卡片整体产生轻微放大(Scale)和背景微调
                transform: [{ scale: isFocused ? 1.05 : 1 }],
                backgroundColor: isFocused ? (theme['c-primary-background-hover'] || 'rgba(0,0,0,0.05)') : 'transparent',
                borderRadius: 6,
                padding: 4,
                opacity: pressed ? 0.8 : 1
              }
            ]}
          >
            {/* 封面图片部分 */}
            <View 
              style={[
                styles.listItemImg, 
                { 
                  backgroundColor: theme['c-content-background'],
                  // 📺 遥控器激活时，给图片加上醒目的主题色边框
                  borderColor: isFocused ? (theme['c-primary'] || '#ff7c00') : 'transparent',
                  borderWidth: isFocused ? 2 : 0
                }
              ]}
            >
              <Image 
                url={item.img} 
                nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`} 
                style={{ width: '100%', aspectRatio: 1, borderRadius: 4 }} 
              />
              { showSource ? <Text style={styles.sourceLabel} size={9} color="#fff" >{item.source}</Text> : null }
            </View>

            {/* 标题文字部分 */}
            <Text 
              style={styles.listItemTitle} 
              numberOfLines={ 2 }
              // 📺 遥控器激活时，高亮标题文字的颜色
              color={isFocused ? (theme['c-primary-font-active'] || theme['c-primary']) : theme['c-font']}
            >
              {item.name}
            </Text>
          </Pressable>
        )
      : <View style={{ ...styles.listItem, width: itemWidth }} />
  )
})

const styles = createStyle({
  listItem: {
    margin: 8,
    transition: 'all 0.2s ease', // 部分新版 RN 支持，原生无缝过渡
  },
  listItemImg: {
    borderRadius: 4,
    marginBottom: 5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sourceLabel: {
    paddingLeft: 4,
    paddingBottom: 2,
    paddingRight: 4,
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  listItemTitle: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 16,
    paddingHorizontal: 2,
  },
})
