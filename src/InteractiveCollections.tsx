import { hitStyle } from './hitStyle'
import { useEffect, useId, useRef, useState } from 'react'
import { Demo, Toggle, Surface } from './InteractiveDemo'
import { createCollectionPainter, flattenTree } from './collectionControls'
import type { TreeItem } from './collectionControls'
import { FileListPreview } from './FileListPreview'
import { Scrollbar } from './Scrollbar'

const folders = ['Documents', 'Programs', 'Settings', 'Pictures', 'Music', 'Projects', 'Templates', 'Work']
export function CollectionDemo({ scale, kind }: { scale: number; kind: 'tree' | 'list' | 'directory' | 'details' | 'small-icons' }) {
  const title = { tree: 'Folder tree', list: 'List box', directory: 'Directory list', details: 'Details view', 'small-icons': 'Small-icon list' }[kind]
  const [disabled, setDisabled] = useState(false)
  const [active, setActive] = useState(true)
  const [selected, setSelected] = useState('Documents')
  const [expanded, setExpanded] = useState<string[]>(['My Computer', 'C:\\'])
  const [directory, setDirectory] = useState('c:\\')
  const [scroll, setScroll] = useState(0)
  const [descending, setDescending] = useState(false)
  const [focused, setFocused] = useState(false)
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const tree: TreeItem[] = [{ label: 'My Computer', icon: 'My Computer', expanded: expanded.includes('My Computer'), children: [{ label: 'C:\\', icon: 'Drive', expanded: expanded.includes('C:\\'), children: folders.map(label => ({ label, icon: 'Folder', expanded: expanded.includes(label), children: [{ label: `${label} files`, icon: 'Windows document' }] })) }] }]
  const treeRows = flattenTree(tree)
  const items = kind === 'tree' ? treeRows.map(row => row.item) : kind === 'directory'
    ? [{ label: '..', icon: 'Directory open' }, { label: directory, icon: 'Directory open', indent: 1 }, ...folders.map(label => ({ label, icon: 'Folder', indent: 2 }))]
    : (descending ? [...folders].reverse() : folders).map(label => ({ label, icon: kind === 'list' ? undefined : 'Folder' }))
  const header = kind === 'details' ? 20 : 0
  const page = 128
  const maxScroll = Math.max(0, items.length * 16 - page)
  const offset = Math.min(scroll, maxScroll)
  useEffect(() => {
    const element = list.current!
    const wheel = (event: WheelEvent) => {
      if (disabled || event.ctrlKey || maxScroll === 0) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1 / scale
      setScroll(value => Math.max(0, Math.min(maxScroll, Math.round(value + event.deltaY * unit))))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [disabled, maxScroll, scale])
  const choose = (index: number) => {
    const next = Math.max(0, Math.min(items.length - 1, index))
    setSelected(items[next].label)
    setScroll(value => Math.max(0, Math.min(maxScroll, next * 16 < value ? next * 16 : (next + 1) * 16 > value + page ? (next + 1) * 16 - page : value)))
  }
  const activate = (label: string) => {
    if (kind === 'tree') setExpanded(value => value.includes(label) ? value.filter(item => item !== label) : [...value, label])
    if (kind === 'directory' && label !== directory) {
      const parts = directory.replace(/\\$/, '').split('\\')
      const parent = parts.length > 1 ? parts.slice(0, -1).join('\\') : 'c:'
      setDirectory(label === '..' ? `${parent}\\` : `${directory.replace(/\\$/, '')}\\${label}`)
      setSelected(label); setScroll(0)
    }
  }
  return <Demo title={title} controls={<><Toggle title={title} label="Disabled" value={disabled} onChange={setDisabled} /><Toggle title={title} label="Inactive" value={!active} onChange={value => setActive(!value)} /><span>{kind === 'tree' ? 'Click +/− or double-click a folder.' : kind === 'directory' ? 'Double-click a folder to enter it.' : kind === 'details' ? 'Click Name to sort.' : 'Click or use arrow keys.'}</span></>}>
    <Surface title={title} width={260} height={132 + header} scale={scale} draw={(_, ctx) => {
      const p = createCollectionPainter(ctx)
      p.pane({ x: 0, y: 0, width: 260, height: 132 + header })
      if (header) { p.header({ x: 2, y: 2, width: 156, height: 20 }, `Name ${descending ? '-' : '+'}`); p.header({ x: 158, y: 2, width: 84, height: 20 }, 'Type') }
      p.clip({ x: 2, y: 2 + header, width: 240, height: page }, () => {
        const r = { x: 2, y: 2 + header - offset, width: 240, height: items.length * 16 }
        if (kind === 'tree') p.tree(r, treeRows, selected, active && !disabled, active && focused && !disabled)
        else if (kind === 'details' || kind === 'small-icons') items.forEach((item, index) => {
          const y = r.y + index * 16
          p.icon('Folder', 4, y, 16); p.label(item.label, 22, y, item.label === selected, focused && item.label === selected && !disabled, active && !disabled)
          if (kind === 'details') p.text('File Folder', 164, y + 1)
        })
        else p.listBox(r, items, items.findIndex(item => item.label === selected), focused && !disabled, active && !disabled)
      })
    }}>
      {header > 0 && <button className="bitmap-hit" style={hitStyle(2, 2, 156, 20, scale)} aria-label="Sort details by name" disabled={disabled} onClick={() => setDescending(!descending)} />}
      <div ref={list} id={id} role={kind === 'tree' ? 'tree' : 'listbox'} aria-label={title} aria-disabled={disabled} aria-activedescendant={items.some(item => item.label === selected) ? `${id}-${items.findIndex(item => item.label === selected)}` : undefined} tabIndex={disabled ? -1 : 0} className="file-list-hit-area" style={hitStyle(2, 2 + header, 240, page, scale)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onClick={event => {
          if (disabled) return
          event.currentTarget.focus()
          const bounds = event.currentTarget.getBoundingClientRect()
          const index = Math.floor(((event.clientY - bounds.top) / scale + offset) / 16)
          if (!items[index]) return
          choose(index)
          if (kind === 'tree' && (event.clientX - bounds.left) / scale < treeRows[index].depth * 19 + 16) activate(items[index].label)
        }} onDoubleClick={() => { if (!disabled) activate(selected) }} onKeyDown={event => {
          if (disabled) return
          const index = items.findIndex(item => item.label === selected)
          if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); choose(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index + (event.key === 'ArrowUp' ? -1 : 1)) }
          if (event.key === 'Enter') { event.preventDefault(); activate(selected) }
          if (kind === 'tree' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault()
            if (event.key === 'ArrowRight' && !expanded.includes(selected) || event.key === 'ArrowLeft' && expanded.includes(selected)) activate(selected)
          }
        }}>
        {items.map((item, index) => <span key={`${item.label}-${index}`} id={`${id}-${index}`} className="visually-hidden" role={kind === 'tree' ? 'treeitem' : 'option'} aria-level={kind === 'tree' ? treeRows[index].depth + 1 : undefined} aria-selected={selected === item.label} aria-expanded={kind === 'tree' && treeRows[index].item.children ? !!treeRows[index].item.expanded : undefined}>{item.label}</span>)}
      </div>
      <div className="demo-overlay" style={hitStyle(242, 2 + header, 16, page, scale)}><Scrollbar orientation="vertical" length={page} total={items.length * 16} page={page} value={offset} scale={scale} controls={id} onChange={setScroll} disabled={disabled} /></div>
    </Surface>
  </Demo>
}

export function FileDialogDemo({ scale }: { scale: number }) {
  const [disabled, setDisabled] = useState(false)
  return <Demo title="Column file list" controls={<Toggle title="Column file list" label="Disabled" value={disabled} onChange={setDisabled} />}><div className="embedded-file-list"><FileListPreview scale={scale} disabled={disabled} /></div></Demo>
}

export function ScrollbarDemo({ scale, vertical = false }: { scale: number; vertical?: boolean }) {
  const title = vertical ? 'Vertical scrollbar' : 'Horizontal scrollbar'
  const [disabled, setDisabled] = useState(false)
  const [value, setValue] = useState(0)
  const id = useId()
  return <Demo title={title} controls={<><Toggle title={title} label="Disabled" value={disabled} onChange={setDisabled} /><output id={id}>Position: {value} / 200</output></>}><Scrollbar orientation={vertical ? 'vertical' : 'horizontal'} length={160} total={300} page={100} value={value} scale={scale} controls={id} onChange={setValue} disabled={disabled} /></Demo>
}
