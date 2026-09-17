import type { ComponentPropsWithRef } from 'react'
import './controls.css'

export function TextArea({ width = 300, height = 70, style, className = '', ...props }: ComponentPropsWithRef<'textarea'> & { width?: number; height?: number }) {
  return <span className="w95-textarea-frame w95-inset" data-disabled={props.disabled || undefined} style={{ width, height }}>
    <textarea {...props} className={`w95-textarea w95-native-text ${className}`} style={style} />
  </span>
}
