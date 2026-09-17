import type { ComponentPropsWithRef } from 'react'
import './controls.css'

export function TextArea({ width = 300, height = 70, style, className = '', ...props }: ComponentPropsWithRef<'textarea'> & { width?: number; height?: number }) {
  return <textarea {...props} className={`w95-textarea w95-inset w95-native-text ${className}`} style={{ width, height, ...style }} />
}
