import { useEffect, useRef, useState } from 'react'
import { Menu, MenuBar, MenuItem, MenuSeparator } from '@ethandenny/win95-ui'

export type ChatMenuItem = { label: string; action: () => void; disabled?: boolean; checked?: boolean } | 'separator'
export type ChatMenuGroup = { label: string; mnemonic?: string; items: ChatMenuItem[] }

export function ChatMenu({ groups }: { groups: ChatMenuGroup[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [left, setLeft] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const keyboard = useRef(false)
  const group = groups.find(item => item.label === selected)
  const trigger = (label: string) => root.current?.querySelector<HTMLButtonElement>(`[data-menu-label="${label}"]`)
  function open(label: string, fromKeyboard: boolean) {
    setLeft(trigger(label)?.offsetLeft ?? 0)
    keyboard.current = fromKeyboard
    setSelected(label)
  }
  function dismiss() {
    if (selected) trigger(selected)?.focus()
    setSelected(null)
  }
  useEffect(() => {
    if (selected) (keyboard.current ? popup.current?.querySelector<HTMLButtonElement>('button:not(:disabled)') : popup.current)?.focus()
  }, [selected])
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setSelected(null) }
    const keys = (event: KeyboardEvent) => {
      if (root.current?.closest('[inert]')) return
      const match = event.altKey && !event.ctrlKey && !event.metaKey && groups.find(item => (item.mnemonic ?? item.label[0]).toLowerCase() === event.key.toLowerCase())
      if (match) { event.preventDefault(); open(match.label, true) }
      if (event.key === 'F10' && !event.shiftKey) { event.preventDefault(); setSelected(null); trigger(groups[0].label)?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', keys)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keys) }
  }, [groups])
  return <div ref={root} role="group" className="chat-menu" onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setSelected(null)
  }}>
    <MenuBar aria-label="Chat menu" items={groups.map(({ label, mnemonic }) => ({ label, mnemonic, style: { padding: '2px 6px', height: 18 } }))}
      selected={selected} onOpen={(label, fromKeyboard) => selected === label ? dismiss() : open(label, fromKeyboard)} onDismiss={dismiss} />
    {group && <Menu ref={popup} aria-label={group.label} style={{ position: 'absolute', top: 18, left, width: 186 }}
      onDismiss={dismiss} onNavigate={direction => open(groups[(groups.indexOf(group) + direction + groups.length) % groups.length].label, true)}>
      {group.items.map((item, index) => item === 'separator' ? <MenuSeparator key={index} /> : <MenuItem key={item.label}
        disabled={item.disabled} aria-label={item.label} data-checked={item.checked} onClick={() => { dismiss(); item.action() }}>
        {item.checked && <span className="chat-menu-check" aria-hidden="true" />}{item.label}
      </MenuItem>)}
    </Menu>}
  </div>
}
