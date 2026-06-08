import { useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import { FlatList, View, RefreshControl, type FlatListProps } from 'react-native'

import ListItem from './ListItem'
import { type ListInfoItem } from '@/store/songlist/state'
import { useLayout } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

type FlatListType = FlatListProps<ListInfoItem>

const MIN_WIDTH = scaleSizeW(110)
const GAP = scaleSizeW(20)

export interface ListProps {
  onRefresh: () => void
  onLoadMore: () => void
  onOpenDetail: (item: ListInfoItem, index: number) => void
}
export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'

export interface ListType {
  setList: (list: ListInfoItem[], showSource?: boolean) => void
  setStatus: (val: Status) => void
}

export default forwardRef<ListType, ListProps>(({ onRefresh, onLoadMore, onOpenDetail }, ref) => {
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<ListInfoItem[]>([])
  const [showSource, setShowSource] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const { onLayout, width } = useLayout()
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setList(list, showSource = false) {
      setList(list)
      setShowSource(showSource)
    },
    setStatus(val) {
      setStatus(val)
    },
  }))

  const handleLoadMore = () => {
    if (status != 'idle') return
    onLoadMore()
  }

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      width={rowInfo.width}
      showSource={showSource}
      onPress={onOpenDetail}
    />
  )
  
  const getkey: FlatListType['keyExtractor'] = item => item.id
  
  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[theme['c-primary']]}
      refreshing={status == 'refreshing'}
      onRefresh={onRefresh} />
  ), [status, onRefresh, theme])
  
  const footerComponent = useMemo(() => {
    let label: FooterLabel
    switch (status) {
      case 'refreshing': return null
      case 'loading':
        label = 'list_loading'
        break
      case 'end':
        label = 'list_end'
        break
      case 'error':
        label = 'list_error'
        break
      case 'idle':
        label = null
        break
    }
    return (
      <View style={{ width: '100%' }}>
        <Footer label={label} onLoadMore={onLoadMore} />
      </View>
    )
  }, [onLoadMore, status])

  // 计算每排网格数
  const rowInfo = useMemo(() => {
    let w = width - GAP
    let n = width / (MIN_WIDTH + GAP)
    if (n > 6) n = 6 // 📺 电视端精细化调整：一排 10 列太密密麻麻了，限制最多 6 列，让卡片变大更清晰
    let computedItemWidth = Math.floor(w / n)
    const num = Math.max(Math.floor(width / computedItemWidth), 2)
    return {
      num,
      width: (width - GAP) / num,
    }
  }, [width])

  const list = useMemo(() => {
    const list = [...currentList]
    let whiteItemNum = (list.length % rowInfo.num)
    if (whiteItemNum > 0) whiteItemNum = rowInfo.num - whiteItemNum
    for (let i = 0; i < whiteItemNum; i++) {
      list.push({
        id: `white__${i}`,
        play_count: '',
        author: '',
        name: '',
        img: '',
        desc: '',
        // @ts-expect-error
        source: '',
      })
    }
    return list
  }, [currentList, rowInfo])

  return (
    <View style={styles.container} onLayout={onLayout}>
      {
        width == 0
          ? null
          : (
              <FlatList
                // 📺 电视端神级避坑：不要直接拿动态 num 作为唯一的 key，防止组件在电视初始化时疯狂卸载重建导致的白屏闪烁
                key={`tv_grid_${rowInfo.num}`} 
                ref={flatListRef}
                style={styles.list}
                columnWrapperStyle={{ justifyContent: 'flex-start' }} // 📺 改为靠左对齐，配合网格更稳固
                numColumns={rowInfo.num}
                data={list}
                
                // 📺 电视端专属性能包（TV Optimizations）
                maxToRenderPerBatch={12} // 适当加大单批渲染量，应对遥控器快速连续连按
                windowSize={21}          // 📺 大幅增加窗口缓存范围，哪怕卡片滑出屏幕也绝不卸载
                removeClippedSubviews={false} // 📺 必须改为 false！防止出屏卡片被销毁导致遥控器光标丢失
                
                renderItem={renderItem}
                keyExtractor={getkey}
                onEndReachedThreshold={0.8} // 📺 提早触发加载更多，防止电视端翻页等待
                onEndReached={handleLoadMore}
                refreshControl={refreshControl}
                ListFooterComponent={footerComponent}
              />
            )
      }
    </View>
  )
})

type FooterLabel = 'list_loading' | 'list_end' | 'list_error' | null
const Footer = ({ label, onLoadMore }: {
  label: FooterLabel
  onLoadMore: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const handlePress = () => {
    if (label != 'list_error') return
    onLoadMore()
  }
  return (
    label
      ? (
          <View>
            <Text onPress={handlePress} style={styles.footer} color={theme['c-font-label']}>{t(label)}</Text>
          </View>
        )
      : null
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  footer: {
    textAlign: 'center',
    padding: 15,
    fontSize: 14,
  },
})
