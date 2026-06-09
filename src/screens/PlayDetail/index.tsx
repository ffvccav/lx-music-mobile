import { useEffect } from 'react'
import { BackHandler } from 'react-native' // 📺 引入原生物理返回键管理器
import { useHorizontalMode } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Navigation from '@/navigation' // 📺 引入落雪音乐的导航管理器以供安全退出

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 📺 电视端核心拦截：处理遥控器“返回键”，防止 App 闪退
  useEffect(() => {
    const onBackPress = () => {
      // 当全屏播放器打开时，用户按遥控器返回键，我们安全地把当前播放详情页 pop 掉（关闭全屏）
      try {
        Navigation.pop(componentId)
      } catch (e) {
        // 容错备用方案：如果 Navigation 行为不一致，也可以调用全局事件或走默认返回
        global.app_event.closePlayerPage?.() 
      }
      return true // 狠狠返回 true，代表事件已被我们完美拦截并消耗，不允许系统闪退
    }

    // 挂载物理按键监听
    BackHandler.addEventListener('hardwareBackPress', onBackPress)

    // 组件销毁时务必解绑，把返回键控制权还给主页
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }
  }, [componentId])

  return (
    <PageContent>
      <StatusBar />
      {
        isHorizontalMode
          ? <Horizontal componentId={componentId} />
          : <Vertical componentId={componentId} />
      }
    </PageContent>
  )
}
