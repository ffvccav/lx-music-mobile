import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { View, PanResponder, Pressable } from 'react-native' // 📺 引入 Pressable 抓取遥控器按键
import { useDrag } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

const DefaultBar = memo(() => {
  return <View style={{
    ...styles.progressBar,
    position: 'absolute',
    width: '100%',
    left: 0,
    top: 0,
  }}></View>
})

const BufferedBar = memo(({ progress }: { progress: number }) => {
  const theme = useTheme()
  return <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-light-600-alpha-900'], position: 'absolute', width: `${progress * 100}%`, left: 0, top: 0 }}></View>
})

const PreassBar = memo(({ onDragState, setDragProgress, onSetProgress }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
}) => {
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, onDragState, setDragProgress)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
})


export const ProgressPlain = ({ progress, duration, buffered, paddingTop }: {
  progress: number
  duration: number
  buffered: number
  paddingTop?: number
}) => {
  const theme = useTheme()
  const progressStr: `${number}%` = `${progress * 100}%`

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  return (
    <View style={{ ...styles.progress, paddingTop }}>
      <View style={{ flex: 1 }}>
        <DefaultBar />
        <BufferedBar progress={buffered} />
        <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-alpha-900'], width: progressStr, position: 'absolute', left: 0, top: 0 }} />
      </View>
      <View style={styles.pressBar} />
    </View>
  )
}

const Progress = ({ progress, duration, buffered, paddingTop }: {
  progress: number
  duration: number
  buffered: number
  paddingTop?: number
}) => {
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)

  const durationRef = useRef(duration)
  const progressRef = useRef(progress)
  const debounceTimer = useRef<JSID | null>(null) // 📺 电视端防抖定时器

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  // 📺 保持最新的真实播放进度追踪
  useEffect(() => {
    if (!draging) {
      progressRef.current = progress
    }
  }, [progress, draging])

  const onSetProgress = useCallback((targetProgress: number) => {
    global.app_event.setProgress(targetProgress * durationRef.current)
  }, [])

  // 📺 电视端核心交互：处理遥控器左右方向键产生的快进与快退
  const handleTvKeyDown = (direction: 'left' | 'right') => {
    if (!durationRef.current) return

    // 每次点按方向键，快进或快退 5 秒对应的百分比
    const stepProgress = 5 / durationRef.current 
    let nextProgress = draging ? dragProgress : progressRef.current

    if (direction === 'left') {
      nextProgress = Math.max(0, nextProgress - stepProgress)
    } else {
      nextProgress = Math.min(1, nextProgress + stepProgress)
    }

    // 1. 立即拦截进入虚拟拖拽视觉状态，保证界面数字/进度条秒切不卡顿
    setDraging(true)
    setDragProgress(nextProgress)

    // 2. 经典的防抖处理：300ms 内如果没有连续按键，再真正让底层歌曲播放定位（Seek）过去
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      onSetProgress(nextProgress)
      setDraging(false)
    }, 300)
  }

  // 组件卸载时安全清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const progressStr: `${number}%` = `${progress * 100}%`

  return (
    <Pressable
      focusable={true} // 📺 让进度条容器在电视上能够获取遥控器焦点
      onKeyDown={(e) => {
        // 📺 拦截 Android TV 遥控器物理按键事件
        if (e.nativeEvent.keyName === 'left') {
          handleTvKeyDown('left')
        } else if (e.nativeEvent.keyName === 'right') {
          handleTvKeyDown('right')
        }
      }}
      style={{ ...styles.progress, paddingTop }}
    >
      <View style={{ flex: 1 }}>
        <DefaultBar />
        <BufferedBar progress={buffered} />
        {
          draging
            ? (
                <>
                  <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-light-200-alpha-900'], width: progressStr, position: 'absolute', left: 0, top: 0 }} />
                  <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-light-100-alpha-800'], width: `${dragProgress * 100}%`, position: 'absolute', left: 0, top: 0 }} />
                </>
              ) : (
                <View style={{ ...styles.progressBar, backgroundColor: theme['c-primary-alpha-900'], width: progressStr, position: 'absolute', left: 0, top: 0 }} />
              )
        }
      </View>
      {/* 手机端手势操作层依旧保留，完美实现双端兼容 */}
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
    </Pressable>
  )
}

const styles = createStyle({
  progress: {
    flex: 1,
    zIndex: 1,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  pressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
  },
})

export default Progress
