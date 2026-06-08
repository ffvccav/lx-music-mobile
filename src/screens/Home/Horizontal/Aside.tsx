import { memo, useState } from 'react'
import { ScrollView, Pressable, View } from 'react-native' // 📺 引入 Pressable 代替 TouchableOpacity
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import { BorderWidths } from '@/theme'
import { useSettingValue } from '@/store/setting/hook'

const NAV_WIDTH = 76 // 📺 电视端稍微加宽一点，视觉上更大气

const styles = createStyle({
  container: {
    flexGrow: 0,
    borderRightWidth: BorderWidths.normal,
    paddingBottom: 10,
    width: NAV_WIDTH,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menus: {
    flex: 1,
  },
  list: {
    paddingBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    paddingTop: 18, // 📺 电视端加大间距，方便遥控器对准
    paddingBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // 📺 给焦点高亮边缘加点圆角
    marginHorizontal: 6, // 📺 两边留白，高亮时更好看
    marginBottom: 4,
  },
  iconContent: {
    alignItems: 'center',
  },
})

const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <Icon name="logo" color={theme['c-primary-dark-100-alpha-300']} size={26} />
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const activeId = useNavActiveId()
  const theme = useTheme()
  
  // 📺 电视端核心：增加组件内部状态监听遥控器光标
  const [isFocused, setIsFocused] = useState(false)
  const isActive = activeId === id

  // 📺 动态计算电视遥控器在不同状态下的背景颜色
  const getBackgroundColor = () => {
    if (isFocused) return theme['c-primary-background-hover'] || 'rgba(0, 0, 0, 0.08)' // 遥控器光标在上面
    if (isActive) return theme['c-primary-background-active'] || 'rgba(0, 0, 0, 0.04)' // 被选中激活状态
    return 'transparent' // 普通状态
  }

  // 📺 动态计算图标颜色
  const getIconColor = () => {
    if (isActive || isFocused) return theme['c-primary-font-active'] || theme['c-primary']
    return theme['c-font-label']
  }

  return (
    <Pressable
      focusable={true} // 📺 必须：允许遥控器获取焦点
      onFocus={() => setIsFocused(true)} // 📺 遥控器移上来
      onBlur={() => setIsFocused(false)}  // 📺 遥控器移走
      onPress={() => onPress(id)} // 📺 遥控器按确认键
      style={({ pressed }) => [
        styles.menuItem,
        { 
          backgroundColor: getBackgroundColor(),
          opacity: pressed ? 0.7 : 1 // 电视按下瞬间给个微弱的反馈
        }
      ]}
    >
      <View style={styles.iconContent}>
        <Icon name={icon} size={24} color={getIconColor()} />
      </View>
    </Pressable>
  )
}

export default memo(() => {
  const theme = useTheme()
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')

  const handlePress = (id: IdType) => {
    switch (id) {
      case 'nav_exit':
        void confirmDialog({
          message: global.i18n.t('exit_app_tip'),
          confirmButtonText: global.i18n.t('list_remove_tip_button'),
        }).then(isExit => {
          if (!isExit) return
          exitApp('Exit Btn')
        })
        return
      case 'back_home':
        backHome()
        return
    }

    global.app_event.changeMenuVisible(false)
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, borderRightColor: theme['c-border-background'] }}>
      <Header />
      <ScrollView style={styles.menus} removeClippedSubviews={false}>
        <View style={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>
      {
        showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null
      }
      {
        showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null
      }
    </View>
  )
})
