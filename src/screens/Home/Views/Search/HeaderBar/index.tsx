import { useRef, forwardRef, useImperativeHandle, useState } from 'react' // 📺 引入 useState 监听整体焦点
import { View } from 'react-native'

import { BorderWidths } from '@/theme'
import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'

type Sources = Readonly<Array<MusicSource | SonglistSource>>
type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

export interface HeaderBarProps {
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTipSearch: SearchInputProps['onChangeText']
  onSearch: SearchInputProps['onSubmit']
  onHideTipList: SearchInputProps['onBlur']
  onShowTipList: SearchInputProps['onTouchStart']
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: SearchInputType['setText']
  blur: SearchInputType['blur']
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchInputRef = useRef<SearchInputType>(null)
  const theme = useTheme()

  // 📺 电视端辅助状态：记录输入框是否正处于聚焦状态
  const [isInputFocused, setIsInputFocused] = useState(false)

  useImperativeHandle(ref, () => ({
    setSourceList(list, source) {
      sourceSelectorRef.current?.setSourceList(list, source)
    },
    setText(text) {
      searchInputRef.current?.setText(text)
    },
    blur() {
      searchInputRef.current?.blur()
    },
  }), [])

  return (
    <View 
      style={{ 
        ...styles.searchBar, 
        borderBottomColor: theme['c-border-background'],
        // 📺 电视端细节：如果里面的输入框聚焦了，把整个搜索栏下方边框变成高亮主题色
        borderBottomColor: isInputFocused ? (theme['c-primary'] || '#ff7c00') : theme['c-border-background'],
        borderBottomWidth: isInputFocused ? 2 : BorderWidths.normal,
      }}
    >
      {/* 左侧：音源选择器 */}
      <View style={styles.selector}>
        {/* 注意：如果这个组件在电视上无法被光标选中，我们后续可以去修改 @/components/SourceSelector */}
        <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center />
      </View>
      
      {/* 右侧：真正的输入框包装层 */}
      <SearchInput
        ref={searchInputRef}
        onChangeText={onTipSearch}
        onSubmit={onSearch}
        // 📺 注入电视端焦点桥接回调
        onBlur={(e) => {
          setIsInputFocused(false)
          onHideTipList(e)
        }}
        onTouchStart={(e) => {
          setIsInputFocused(true)
          onShowTipList(e)
        }}
        // 📺 新增电视端专属 prop，将聚焦状态直接通知到底层组件
        onTvFocusChange={(focused) => setIsInputFocused(focused)}
      />
    </View>
  )
})

const styles = createStyle({
  searchBar: {
    flexDirection: 'row',
    height: 44, // 📺 电视端稍微加高一点（原为38），让遥控器瞄准和视觉看起来更舒服
    zIndex: 2,
    paddingRight: 15,
    alignItems: 'center',
  },
  selector: {
    marginRight: 10,
  },
})
