import { useEffect, useRef } from 'react'
import { menuRects } from './chromeLayout'
import { menuItems } from './appCommands'
import type { AppId, DesktopApps } from './model'

export function AppMenu({ app, apps, activate, close }: { app: AppId; apps: DesktopApps; activate: (action: string) => void; close: () => void }) {
  const bar = useRef<HTMLDivElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const keyboardOpen = useRef(false)
  const selected = apps.menu?.app === app ? apps.menu.label : null
  const rects = menuRects(app)
  const origin = rects.find(item => item.label === selected) ?? { x: 60, y: 89 }
  const restoreFocus = () => { close(); (selected === 'History' ? bar.current?.closest('section')?.querySelector<HTMLButtonElement>('[aria-label="Address history"]') : bar.current?.querySelector<HTMLButtonElement>(`[data-menu-label="${selected}"]`))?.focus() }
  const switchMenu = (direction: number) => { keyboardOpen.current = true; const index = rects.findIndex(item => item.label === selected); activate(`menu:${rects[(index + direction + rects.length) % rects.length].label}`) }
  useEffect(() => {
    if (selected) (keyboardOpen.current ? popup.current?.querySelector('button') : popup.current)?.focus()
    keyboardOpen.current = false
  }, [selected])
  return <div data-app-menu="">
    <div ref={bar} role="menubar" aria-label="Application menu">{rects.map((r, index) => <button key={r.id} type="button" role="menuitem" aria-haspopup="menu" aria-expanded={selected === r.label} data-menu-label={r.label} aria-label={r.label} className="w95-menu-label w95-native-text"
      style={{ position: 'absolute', left: r.x, top: r.y, width: r.width, height: r.height }} onClick={event => { keyboardOpen.current = event.detail === 0; activate(r.id) }}
      onPointerEnter={() => { if (selected && selected !== r.label) { keyboardOpen.current = false; activate(r.id) } }} onKeyDown={event => {
        if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const buttons = bar.current!.querySelectorAll<HTMLButtonElement>('button'); buttons[(index + (event.key === 'ArrowLeft' ? -1 : 1) + rects.length) % rects.length].focus() }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); bar.current?.closest<HTMLElement>('section')?.focus() }
        if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          const match = rects.find(item => (item.label === 'Favorites' ? 'a' : item.label[0].toLowerCase()) === event.key.toLowerCase())
          if (match) { event.preventDefault(); bar.current?.querySelector<HTMLButtonElement>(`[data-menu-label="${match.label}"]`)?.click() }
        }
        if (event.key === 'ArrowDown') { event.preventDefault(); keyboardOpen.current = true; activate(r.id) }
      }}>{r.label === 'Favorites' ? <>F<u>a</u>vorites</> : <><u>{r.label[0]}</u>{r.label.slice(1)}</>}</button>)}</div>
    {selected && <div ref={popup} className="w95-app-menu w95-native-text w95-raised" role="menu" tabIndex={-1} aria-label={selected} style={{ position: 'absolute', left: origin.x, top: origin.y + 18, width: 187, zIndex: 10 }}
      onKeyDown={event => {
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : index < 0 ? (event.key === 'ArrowUp' ? buttons.length - 1 : 0) : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length]?.focus() }
        if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); switchMenu(event.key === 'ArrowLeft' ? -1 : 1) }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); restoreFocus() }
        if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          const matches = buttons.filter(button => button.textContent?.trim().toLowerCase().startsWith(event.key.toLowerCase()))
          if (matches.length) {
            event.preventDefault(); event.stopPropagation()
            if (matches.length === 1) matches[0].click()
            else matches[(matches.indexOf(document.activeElement as HTMLButtonElement) + 1) % matches.length].focus()
          }
        }
        if (event.key === 'Tab') close()
      }}>
      {menuItems(app, selected, apps).map(label => <button type="button" role="menuitem" key={label} onClick={() => { popup.current?.closest<HTMLElement>('section')?.focus(); activate(`command:${label}`) }}>{label}</button>)}
    </div>}
  </div>
}
