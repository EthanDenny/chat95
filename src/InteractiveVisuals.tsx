import { useState } from 'react'
import { Demo, Toggle } from './InteractiveDemo'
import { PixelScale } from './components/PixelScale'
import { NativeText } from './components/NativeText'
import { SurfaceBox, ColumnHeader } from './components/SurfaceBox'
import type { SurfaceKind } from './components/SurfaceBox'
import { kitIconNames } from './icons'
import { fontChoices, getBitmapFont } from './bitmapFont'

export function TypographyDemo({ scale }: { scale: number }) {
  const [choice, setChoice] = useState(0), [text, setText] = useState('The quick brown fox. 0123456789')
  const selected = fontChoices[choice], native = getBitmapFont(selected.font)
  return <Demo title="Typography" controls={<><label>Text <input aria-label="Typography text" value={text} onChange={event => setText(event.target.value)} /></label><label>Font <select aria-label="Typography font" value={choice} onChange={event => setChoice(Number(event.target.value))}>{fontChoices.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></label><span>{native.height} px cell · {native.source}</span></>}>
    <PixelScale scale={scale} width={300} height={60}><div style={{ width: 300, height: 60, padding: 8, overflow: 'hidden', background: '#fff' }}><NativeText font={selected.font}>{text}</NativeText></div></PixelScale>
  </Demo>
}
export function LabelDemo({ scale }: { scale: number }) {
  const [icon, setIcon] = useState(false), [white, setWhite] = useState(false), [text, setText] = useState('Label')
  return <Demo title="Label" controls={<><label>Text <input aria-label="Label text" value={text} onChange={event => setText(event.target.value)} /></label><Toggle title="Label" label="Icon" value={icon} onChange={setIcon} /><Toggle title="Label" label="White text" value={white} onChange={setWhite} /></>}>
    <PixelScale scale={scale} width={160} height={40}><div style={{ position: 'relative', width: 160, height: 40, background: '#c0c0c0' }}>{icon && <img src="/icons/2-16.png" alt="" width={16} height={16} style={{ position: 'absolute', left: 8, top: 12, imageRendering: 'pixelated' }} />}<NativeText color={white ? '#fff' : '#000'} style={{ position: 'absolute', left: icon ? 28 : 8, top: 12 }}>{text}</NativeText></div></PixelScale>
  </Demo>
}
export function IconDemo({ scale }: { scale: number }) {
  const [name, setName] = useState<string>('My Computer'), [small, setSmall] = useState(false)
  return <Demo title="Icon" controls={<><label>Icon <select aria-label="Icon name" value={name} onChange={event => setName(event.target.value)}>{kitIconNames.map(name => <option key={name}>{name}</option>)}</select></label><Toggle title="Icon" label="Small (16 px)" value={small} onChange={setSmall} /></>}>
    <PixelScale scale={scale} width={48} height={48}><div style={{ width: 48, height: 48, padding: small ? 16 : 8, background: '#c0c0c0' }}><img src={`/icons/${kitIconNames.indexOf(name as typeof kitIconNames[number])}-${small ? 16 : 32}.png`} alt={name} width={small ? 16 : 32} height={small ? 16 : 32} style={{ display: 'block', imageRendering: 'pixelated' }} /></div></PixelScale>
  </Demo>
}
export function SurfaceDemo({ scale }: { scale: number }) {
  const [kind, setKind] = useState<SurfaceKind>('Raised')
  return <Demo title="Border / surface" controls={<label>Style <select value={kind} onChange={event => setKind(event.target.value as SurfaceKind)}>{['Raised', 'Sunken', 'Window', 'Status'].map(value => <option key={value}>{value}</option>)}</select></label>}>
    <PixelScale scale={scale} width={160} height={60}><SurfaceBox kind={kind} style={{ position: 'relative', width: 160, height: 60, '--inset-face': '#c0c0c0' } as React.CSSProperties}><NativeText style={{ position: 'absolute', left: 12, top: 22 }}>{kind}</NativeText></SurfaceBox></PixelScale>
  </Demo>
}
export function SplitPanes({ width = 280, height = 100 }: { width?: number; height?: number }) {
  const [split, setSplit] = useState(120)
  return <div className="w95-native-text" style={{ position: 'relative', width, height, background: '#c0c0c0' }}>
    {[{ x: 0, width: split, label: 'All Folders' }, { x: split + 4, width: width - split - 4, label: 'Contents' }].map(pane => <div key={pane.label} style={{ position: 'absolute', left: pane.x, top: 0, width: pane.width, height }}><div className="w95-list-header">{pane.label}</div><div className="w95-inset" style={{ position: 'absolute', top: 22, width: pane.width, height: height - 22 }} /></div>)}
    <div className="w95-splitter" style={{ position: 'absolute', left: split, top: 0, width: 4, height }} role="separator" aria-label="Pane divider" aria-orientation="vertical" aria-valuemin={60} aria-valuemax={width - 64} aria-valuenow={split} tabIndex={0}
      onPointerDown={event => { if (event.button === 0) { event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId) } }}
      onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { const rect = event.currentTarget.parentElement!.getBoundingClientRect(); setSplit(Math.max(60, Math.min(width - 64, Math.round((event.clientX - rect.left) * width / rect.width)))) } }} onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setSplit(value => Math.max(60, Math.min(width - 64, value + (event.key === 'ArrowLeft' ? -1 : 1)))) } }} />
  </div>
}
export function SectionsDemo({ scale }: { scale: number }) {
  const [disabled, setDisabled] = useState(false), [sorted, setSorted] = useState(false)
  return <><Demo title="Column header" controls={<><Toggle title="Column header" label="Disabled" value={disabled} onChange={setDisabled} /><span>{sorted ? 'Descending' : 'Ascending'}</span></>}><PixelScale scale={scale} width={140} height={20}><ColumnHeader aria-label="Sort column" disabled={disabled} style={{ width: 140 }} onClick={() => setSorted(!sorted)}>Name {sorted ? '-' : '+'}</ColumnHeader></PixelScale></Demo>
    <Demo title="Split panes" controls={<span>Drag the divider, or focus it and use arrow keys.</span>}><PixelScale scale={scale} width={280} height={100}><SplitPanes /></PixelScale></Demo></>
}
