import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Pressable, View } from 'react-native' // 📺 引入 Pressable 替代 TouchableOpacity

import { createStyle } from '@/utils/tools'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { getSearchSetting } from '@/utils/data'
import { BorderWidths } from '@/theme'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

// 📺 新增一个专门支持电视遥控器焦点的单个 Tab 组件
const TypeTabButton = ({ 
  tab, 
  isActive, 
  theme, 
  onPress 
}: { 
  tab: { label: string, id: SearchType }, 
  isActive: boolean, 
  theme: any, 
  onPress: () => void 
}) => {
  // 📺 监听遥控器光标是否正停留在当前 Tab 上
  const [isFocused, setIsFocused] = useState(false)

  return (
    <Pressable
      focusable={true} // 📺 激活电视焦点
      onFocus={() => setIsFocused(true)} // 光标移入
      onBlur={() => setIsFocused(false)}   // 光标移出
      onPress={onPress} // 遥控器 OK 键点按
      style={({ pressed }) => [
        styles.button,
        {
          // 📺 电视端专属：遥控器移上去或者当前处于激活状态，都给一个高亮的微胶囊背景框，让其在横屏下醒目
          backgroundColor: isFocused 
            ? 'rgba(255, 124, 0, 0.15)' // 遥控器停留在该项
            : isActive 
              ? 'rgba(255, 124, 0, 0.05)' // 虽没有光标停留，但已经是激活态
              : 'transparent',
          borderRadius: 6,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: isFocused ? 1.05 : 1 }] // 遥控器聚焦时稍微放大，极其带感
        }
      ]}
    >
      <Text 
        style={{ 
          ...styles.buttonText, 
          // 原本的下划线标记：可以保留或者由刚才的全局胶囊背景替代
          borderBottomColor: isActive ? (theme['c-primary'] || theme['c-primary-background-active']) : 'transparent' 
        }} 
        // 📺 遥控器聚焦或者已激活，点亮文字颜色
        color={(isFocused || isActive) ? (theme['c-primary-font-active'] || theme['c-primary']) : theme['c-font']}
      >
        {tab.label}
      </Text>
    </Pressable>
  )
}

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent} // 📺 配合电视微调内边距
      keyboardShouldPersistTaps={'always'} 
      horizontal={true}
    >
      {
        list.map(tab => (
          <TypeTabButton
            key={tab.id}
            tab={tab}
            isActive={type === tab.id}
            theme={theme}
            onPress={() => handleTypeChange(tab.id)}
          />
        ))
      }
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    height: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8, // 📺 电视横屏让两个 Tab 按钮中间留出舒适的遥控器跨越空隙
  },
  button: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 2,
  },
  buttonText: {
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: BorderWidths.normal3,
    fontSize: 14, // 📺 电视端字体稍稍放大，看得更清
  },
})
