import { hitStyle } from './hitStyle'
import { useId, useRef, useState } from 'react'
import { Demo, Toggle, Surface, BitmapButton } from './InteractiveDemo'
import { measureBitmapText } from './bitmapFont'
import { createCollectionPainter } from './collectionControls'
import { palette } from './win95'

export function ButtonDemo({ scale }: { scale: number }) {
  const [disabled, setDisabled] = useState(false)
  const [preferred, setPreferred] = useState(false)
  const [clicks, setClicks] = useState(0)
  return <Demo title="Button" controls={<><Toggle title="Button" label="Disabled" value={disabled} onChange={setDisabled} /><Toggle title="Button" label="Default button" value={preferred} onChange={setPreferred} /><span aria-live="polite">{clicks} {clicks === 1 ? 'click' : 'clicks'}</span></>}>
    <BitmapButton label="Try button" width={75} height={23} scale={scale} disabled={disabled} onClick={() => setClicks(clicks + 1)} draw={(p, pressed, focused) => p.pushButton({ x: 0, y: 0, width: 75, height: 23 }, 'Button', disabled ? 'disabled' : pressed ? 'pressed' : focused ? 'focused' : preferred ? 'preferred' : 'normal')} />
  </Demo>
}

export function ChoiceDemo({ scale, radio = false }: { scale: number; radio?: boolean }) {
  const title = radio ? 'Radio group' : 'Checkbox'
  const name = useId()
  const [disabled, setDisabled] = useState(false)
  const [selected, setSelected] = useState(0)
  const [checked, setChecked] = useState(false)
  const [focused, setFocused] = useState(-1)
  const labels = radio ? ['First option', 'Second option'] : ['Enable sound']
  return <Demo title={title} controls={<Toggle title={title} label="Disabled" value={disabled} onChange={setDisabled} />}>
    <Surface title={title} width={130} height={radio ? 52 : 30} scale={scale} draw={p => labels.forEach((label, index) => p[radio ? 'radio' : 'checkbox'](8, 8 + index * 22, { label, checked: radio ? selected === index : checked, disabled, focused: !disabled && focused === index }))}>
      {labels.map((label, index) => <input key={label} className="bitmap-native" style={hitStyle(8, 6 + index * 22, 116, 19, scale)} type={radio ? 'radio' : 'checkbox'} name={name} aria-label={label} disabled={disabled} checked={radio ? selected === index : checked} onChange={event => radio ? setSelected(index) : setChecked(event.target.checked)} onFocus={() => setFocused(index)} onBlur={() => setFocused(-1)} />)}
    </Surface>
  </Demo>
}

export function TextDemo({ scale, numeric = false }: { scale: number; numeric?: boolean }) {
  const title = numeric ? 'Number input' : 'Text field'
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [value, setValue] = useState(numeric ? '10' : 'Windows 95')
  const [focused, setFocused] = useState(false)
  const [selection, setSelection] = useState([0, 0])
  const fieldWidth = numeric ? 100 : 180
  const textWidth = fieldWidth - (numeric ? 23 : 8)
  const step = (delta: number) => setValue(String((Number(value) || 0) + delta))
  return <Demo title={title} controls={<><Toggle title={title} label="Disabled" value={disabled} onChange={setDisabled} /><Toggle title={title} label="Read only" value={readOnly} onChange={setReadOnly} /></>}>
    <Surface title={title} width={fieldWidth} height={22} scale={scale} draw={(p, ctx) => {
      p.input({ x: 0, y: 0, width: fieldWidth, height: 22 }, '', disabled ? 'disabled' : 'normal')
      const caret = measureBitmapText(value.slice(0, selection[1]))
      const offset = Math.max(0, caret - textWidth + 1)
      ctx.save(); ctx.beginPath(); ctx.rect(4, 3, textWidth, 16); ctx.clip()
      p.text(value, 4 - offset, 4, 8, disabled ? palette.gray : palette.black)
      if (focused && !disabled) {
        const start = measureBitmapText(value.slice(0, selection[0]))
        if (selection[0] !== selection[1]) {
          p.fill(4 + start - offset, 3, caret - start, 15, palette.navy)
          p.text(value.slice(selection[0], selection[1]), 4 + start - offset, 4, 8, palette.white)
        } else p.fill(4 + caret - offset, 4, 1, 13, palette.black)
      }
      ctx.restore()
    }}>
      <input className="bitmap-native" style={hitStyle(2, 2, fieldWidth - (numeric ? 20 : 4), 18, scale)} aria-label={title} inputMode={numeric ? 'numeric' : 'text'} disabled={disabled} readOnly={readOnly} value={value}
        onChange={event => { if (!numeric || /^-?\d*$/.test(event.target.value)) setValue(event.target.value) }}
        onSelect={event => setSelection([event.currentTarget.selectionStart ?? 0, event.currentTarget.selectionEnd ?? 0])}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={event => { if (numeric && !readOnly && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) { event.preventDefault(); step(event.key === 'ArrowUp' ? 1 : -1) } }} />
      {numeric && <div className="demo-overlay" style={hitStyle(fieldWidth - 18, 2, 16, 18, scale)}>{(['up', 'down'] as const).map(direction => <BitmapButton key={direction} label={`${direction === 'up' ? 'Increase' : 'Decrease'} number`} width={16} height={9} scale={scale} disabled={disabled || readOnly} onClick={() => step(direction === 'up' ? 1 : -1)} draw={(p, pressed) => p.arrowButton({ x: 0, y: 0, width: 16, height: 9 }, direction, disabled || readOnly, pressed)} />)}</div>}
    </Surface>
  </Demo>
}

export function DropdownDemo({ scale, arrowOnly = false }: { scale: number; arrowOnly?: boolean }) {
  const title = arrowOnly ? 'Dropdown button' : 'Dropdown field'
  const [disabled, setDisabled] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(0)
  const options = ['Documents', 'Programs', 'Settings']
  const menuId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const choose = (index: number) => { setSelected(index); setOpen(false); trigger.current?.focus() }
  return <Demo title={title} controls={<><Toggle title={title} label="Disabled" value={disabled} onChange={value => { setDisabled(value); setOpen(false) }} />{arrowOnly && <span>{options[selected]}</span>}</>}>
    <div onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <Surface title={title} width={arrowOnly && !open ? 16 : 160} height={open ? 74 : 22} scale={scale} draw={(p, ctx) => {
        if (arrowOnly) p.arrowButton({ x: 0, y: 0, width: 16, height: 22 }, 'down', disabled, open)
        else p.input({ x: 0, y: 0, width: 160, height: 22 }, options[selected], disabled ? 'disabled' : 'normal', true)
        if (open) { const c = createCollectionPainter(ctx); c.pane({ x: 0, y: 22, width: 160, height: 52 }); c.listBox({ x: 2, y: 24, width: 156, height: 48 }, options.map(label => ({ label })), selected, true) }
      }}>
        <button ref={trigger} className="bitmap-hit" style={hitStyle(0, 0, arrowOnly ? 16 : 160, 22, scale)} role="combobox" aria-label={title} aria-expanded={open} aria-controls={menuId} disabled={disabled} onClick={() => setOpen(!open)} onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setSelected(value => (value + (event.key === 'ArrowDown' ? 1 : 2)) % 3) }
          if (event.key === 'Enter' && open) { event.preventDefault(); choose(selected) }
        }} />
        {open && <div id={menuId} role="listbox" aria-label={`${title} choices`}>{options.map((option, index) => <button key={option} role="option" aria-selected={selected === index} aria-label={option} className="bitmap-hit" style={hitStyle(2, 24 + index * 16, 156, 16, scale)} onClick={() => choose(index)} />)}</div>}
      </Surface>
    </div>
  </Demo>
}

export function SpinnerDemo({ scale }: { scale: number }) {
  const [upDisabled, setUpDisabled] = useState(false)
  const [downDisabled, setDownDisabled] = useState(false)
  const [value, setValue] = useState(0)
  return <Demo title="Spinner" controls={<><Toggle title="Spinner" label="Disable up" value={upDisabled} onChange={setUpDisabled} /><Toggle title="Spinner" label="Disable down" value={downDisabled} onChange={setDownDisabled} /><span aria-live="polite">Value: {value}</span></>}>
    {(['up', 'down'] as const).map(direction => <BitmapButton key={direction} label={`Spinner ${direction}`} width={16} height={10} scale={scale} disabled={direction === 'up' ? upDisabled : downDisabled} onClick={() => setValue(value + (direction === 'up' ? 1 : -1))} draw={(p, pressed) => p.arrowButton({ x: 0, y: 0, width: 16, height: 10 }, direction, direction === 'up' ? upDisabled : downDisabled, pressed)} />)}
  </Demo>
}
