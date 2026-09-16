import { hitStyle } from './hitStyle'
import { useState } from 'react'
import { Demo, Surface, Toggle, BitmapButton } from './InteractiveDemo'
import { createCollectionPainter } from './collectionControls'
import { kitIconNames } from './kitIcons'
import { palette } from './win95'
import { fontChoices, getBitmapFont } from './bitmapFont'

export function TypographyDemo({ scale }: { scale: number }) {
  const [choice, setChoice] = useState(0)
  const [text, setText] = useState('The quick brown fox. 0123456789')
  const selected = fontChoices[choice]
  const native = getBitmapFont(selected.font)
  return <Demo title="Typography" controls={<>
    <label>Text <input aria-label="Typography text" value={text} onChange={event => setText(event.target.value)} /></label>
    <label>Font <select aria-label="Typography font" value={choice} onChange={event => setChoice(Number(event.target.value))}>{fontChoices.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></label>
    <span>{native.height} px cell · {native.source}</span>
  </>}><Surface title="Typography" width={300} height={60} scale={scale} draw={p => { p.fill(0, 0, 300, 60, palette.white); p.text(text, 8, 8, selected.font) }} /></Demo>
}

export function LabelDemo({ scale }: { scale: number }) {
  const [icon, setIcon] = useState(false)
  const [white, setWhite] = useState(false)
  const [text, setText] = useState('Label')
  return <Demo title="Label" controls={<><label>Text <input aria-label="Label text" value={text} onChange={event => setText(event.target.value)} /></label><Toggle title="Label" label="Icon" value={icon} onChange={setIcon} /><Toggle title="Label" label="White text" value={white} onChange={setWhite} /></>}><Surface title="Label" width={160} height={40} scale={scale} draw={p => { if (icon) p.icon('Folder', 8, 12, 16); p.text(text, icon ? 28 : 8, 12, 8, white ? palette.white : palette.black) }} /></Demo>
}
export function IconDemo({ scale }: { scale: number }) {
  const [name, setName] = useState<string>('My Computer')
  const [small, setSmall] = useState(false)
  return <Demo title="Icon" controls={<><label>Icon <select aria-label="Icon name" value={name} onChange={event => setName(event.target.value)}>{kitIconNames.map(name => <option key={name}>{name}</option>)}</select></label><Toggle title="Icon" label="Small (16 px)" value={small} onChange={setSmall} /></>}><Surface title={name} width={48} height={48} scale={scale} draw={p => p.icon(name, small ? 16 : 8, small ? 16 : 8, small ? 16 : 32)} /></Demo>
}
export function SurfaceDemo({ scale }: { scale: number }) {
  const [style, setStyle] = useState('Raised')
  return <Demo title="Border / surface" controls={<label>Style <select value={style} onChange={event => setStyle(event.target.value)}>{['Raised', 'Sunken', 'Window', 'Status'].map(value => <option key={value}>{value}</option>)}</select></label>}><Surface title="Surface" width={160} height={60} scale={scale} draw={p => { const r = { x: 0, y: 0, width: 160, height: 60 }; if (style === 'Window') p.windowFrame(r); else if (style === 'Status') p.recess(r); else p.bevel(r, style === 'Sunken'); p.text(style, 12, 22) }} /></Demo>
}
export function SectionsDemo({ scale }: { scale: number }) {
  const [split, setSplit] = useState(120)
  const [disabled, setDisabled] = useState(false)
  const [sorted, setSorted] = useState(false)
  return <>
    <Demo title="Column header" controls={<><Toggle title="Column header" label="Disabled" value={disabled} onChange={setDisabled} /><span>{sorted ? 'Descending' : 'Ascending'}</span></>}><BitmapButton label="Sort column" width={140} height={20} scale={scale} disabled={disabled} onClick={() => setSorted(!sorted)} draw={(p, pressed, _focused, ctx) => { createCollectionPainter(ctx).header({ x: 0, y: 0, width: 140, height: 20 }, '', pressed); p.text(`Name ${sorted ? '-' : '+'}`, 6 + Number(pressed), 3 + Number(pressed), 8, disabled ? palette.gray : palette.black) }} /></Demo>
    <Demo title="Split panes" controls={<span>Drag the divider, or focus it and use arrow keys.</span>}><Surface title="Split panes" width={280} height={100} scale={scale} draw={(_, ctx) => { const p = createCollectionPainter(ctx); p.header({ x: 0, y: 0, width: split, height: 21 }, 'All Folders'); p.header({ x: split + 4, y: 0, width: 276 - split, height: 21 }, 'Contents'); p.pane({ x: 0, y: 22, width: split, height: 78 }); p.pane({ x: split + 4, y: 22, width: 276 - split, height: 78 }) }}>
      <div className="demo-overlay splitter-hit" style={hitStyle(split, 0, 4, 100, scale)} role="separator" aria-label="Pane divider" aria-orientation="vertical" aria-valuemin={60} aria-valuemax={216} aria-valuenow={split} tabIndex={0}
        onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { const bounds = event.currentTarget.parentElement!.getBoundingClientRect(); setSplit(Math.max(60, Math.min(216, Math.round((event.clientX - bounds.left) / scale)))) } }} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)}
        onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setSplit(value => Math.max(60, Math.min(216, value + (event.key === 'ArrowLeft' ? -1 : 1)))) } }} />
    </Surface></Demo>
  </>
}
