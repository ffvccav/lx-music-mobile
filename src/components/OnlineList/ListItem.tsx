import { memo, useRef, useState } from 'react' // 📺 引入 useState 监听遥控器指引
import { View, Pressable } from 'react-native' // 📺 用 Pressable 降伏遥控器焦点
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { createStyle, type RowInfo } from '@/utils/tools'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
  if (musicInfo.meta._qualitys.flac24bit) {
    info.type = 'secondary'
    info.text = t('quality_lossless_24bit')
  } else if (musicInfo.meta._qualitys.flac ?? musicInfo.meta._qualitys.ape) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
  } else if (musicInfo.meta._qualitys['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
  }
  return info
}

export default memo(({ item, index, showSource, onPress, onLongPress, onShowMenu, selectedList, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfoOnline
  index: number
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()
  const isSelected = selectedList.includes(item)

  // 📺 电视端核心状态：判断当前单首歌曲是否被遥控器光标框选
  const [isTvFocused, setIsTvFocused] = useState(false)

  // 电视端将整行作为量测锚点，长按时在右侧弹出菜单
  const rowRef = useRef<View>(null)

  const handleShowMenu = () => {
    if (rowRef.current?.measure) {
      rowRef.current.measure((fx, fy, width, height, px, py) => {
        // 在这一行的偏右侧安全区域弹出菜单
        onShowMenu(item, index, { 
          x: Math.ceil(px + width - 100), 
          y: Math.ceil(py), 
          w: 80, 
          h: Math.ceil(height) 
        })
      })
    }
  }

  const tagInfo = useQualityTag(item)
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View 
      ref={rowRef}
      style={{ 
        ...styles.listItem, 
        width: rowInfo.rowWidth, 
        height: ITEM_HEIGHT, 
        // 📺 电视端视觉合并：不管是手机选中的高亮，还是电视遥控器指着的高亮，都赋予极强的高亮反馈
        backgroundColor: isTvFocused 
          ? 'rgba(255, 124, 0, 0.18)' // 遥控器指着时的亮橙色呼吸底色
          : isSelected 
            ? theme['c-primary-background-hover'] 
            : 'transparent'
      }}
    >
      {/* 📺 将整行升级为唯一的、可接收遥控器焦点的 Pressable */}
      <Pressable
        focusable={true}
        onFocus={() => setIsTvFocused(true)}
        onBlur={() => setIsTvFocused(false)}
        onPress={() => onPress(item, index)} // 📺 遥控器点确认键直接切歌
        onLongPress={handleShowMenu}        // 📺 遥控器长按确认键直接呼出更多菜单！免去移动到右边小按钮的麻烦
        style={styles.listItemLeft}
      >
        {/* 序号：被指着时稍微变亮 */}
        <Text 
          style={styles.sn} 
          size={13} 
          color={isTvFocused ? theme['c-primary'] : theme['c-300']}
        >
          {index + 1}
        </Text>

        <View style={styles.itemInfo}>
          {/* 歌名 */}
          <Text 
            numberOfLines={1}
            color={isTvFocused ? (theme['c-primary-font-active'] || theme['c-primary']) : theme['c-font']}
            style={{ fontWeight: isTvFocused ? 'bold' : 'normal' }}
          >
            {item.name}
          </Text>
          
          <View style={styles.listItemSingle}>
            { tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
            { showSource ? <Badge type="tertiary">{item.source}</Badge> : null }
            <Text style={styles.listItemSingleText} size={11} color={isTvFocused ? theme['c-400'] : theme['c-500']} numberOfLines={1}>{singer}</Text>
          </View>
        </View>

        {/* 歌曲时长 */}
        {
          isShowInterval ? (
            <Text size={12} color={isTvFocused ? theme['c-400'] : theme['c-250']} numberOfLines={1} style={{ marginRight: 10 }}>
              {item.interval}
            </Text>
          ) : null
        }
      </Pressable>

      {/* 📺 电视端精细小图标：去掉其自身的点击，它仅作为视觉提示存在，通过上面整行的长按操作触发 */}
      <View style={styles.moreButton}>
        <Icon 
          name="dots-vertical" 
          style={{ color: isTvFocused ? (theme['c-primary'] || '#ff7c00') : theme['c-350'] }} 
          size={14} 
        />
      </View>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = createStyle({
  listItem: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingRight: 2,
    alignItems: 'center',
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  sn: {
    width: 38,
    textAlign: 'center',
    paddingLeft: 3,
    paddingRight: 3,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 2,
  },
  listItemSingle: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemSingleText: {
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
  },
  moreButton: {
    height: '100%',
    paddingLeft: 16,
    paddingRight: 16,
    justifyContent: 'center',
  },
})
