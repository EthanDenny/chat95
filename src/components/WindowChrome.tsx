import type { ComponentPropsWithRef } from 'react'
import './controls.css'

export function TitleBar({ title, icon, active = true, className = '', style, ...props }: Omit<ComponentPropsWithRef<'div'>, 'children'> & { title: string; icon?: string; active?: boolean }) {
  return <div {...props} className={`w95-title-bar w95-native-text ${className}`} data-active={active} style={style}>
    {icon && <img src={icon} alt="" draggable={false} width={16} height={16} />}
    <span className="w95-title-text">{title}</span>
  </div>
}

export function WindowFrame({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return <div {...props} className={`w95-window-frame ${className}`} />
}
