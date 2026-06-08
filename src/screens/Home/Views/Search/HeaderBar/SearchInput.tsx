import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import Input, { type InputType, type InputProps } from '@/components/common/Input'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
  onTvFocusChange?: (focused: boolean) => void // 📺 电视端新增：通知父级高亮状态的回调
}

export interface SearchInputType {
  setText: (text: string) => void
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ 
  onChangeText, 
  onSubmit, 
  onBlur, 
  onTouchStart,
  onTvFocusChange 
}, ref) => {
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  
  // 📺 电视端状态：由于是自定义封装组件，我们内部再用一个状态兜底视觉
  const [isFocused, setIsFocused] = useState(false)

  useImperativeHandle(ref, () => ({
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleChangeText = (text: string) => {
    setText(text)
    onChangeText(text.trim())
  }

  const handleClearText = useCallback(() => {
    setText('')
    onChangeText('')
    onSubmit('')
  }, [onChangeText, onSubmit])

  const handleSubmit = useCallback<NonNullable<InputProps['onSubmitEditing']>>(({ nativeEvent: { text } }) => {
    onSubmit(text)
  }, [onSubmit])

  // 📺 电视端处理：遥控器光标移入
  const handleTvFocus = () => {
    setIsFocused(true)
    onTvFocusChange?.(true)
    onTouchStart() // 触发原有的联想词列表展开逻辑
  }

  // 📺 电视端处理：遥控器光标移出
  const handleTvBlur = () => {
    setIsFocused(false)
    onTvFocusChange?.(false)
    onBlur() // 触发原有的联想词列表关闭逻辑
  }

  return (
    <Input
      ref={inputRef}
      placeholder="Search for something..."
      value={text}
      onChangeText={handleChangeText}
      
      // 📺 电视端交互核心配置
      focusable={true}           // 📺 开启电视端遥控器聚焦能力
      onFocus={handleTvFocus}    // 📺 遥控器光标滑入
      onBlur={handleTvBlur}      // 📺 遥控器光标滑出
      
      // 📺 电视端视觉反馈：当光标移上来时，动态给输入框本身增加亮色背景，防止用户找不到光标
      style={{
        backgroundColor: isFocused ? 'rgba(255, 124, 0, 0.08)' : 'transparent',
        borderRadius: 4,
        flex: 1,
      }}
      
      onSubmitEditing={handleSubmit} // 📺 完美拦截 Android TV 软键盘、外接物理键盘的“搜索/回车”键提交
      onClearText={handleClearText}
      onTouchStart={onTouchStart}
      clearBtn
    />
  )
})
