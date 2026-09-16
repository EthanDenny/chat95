import { createFormPainter } from './formControls'
import { captionRects, metrics, palette } from './win95'
import type { Sample } from './designSamples'
import { kitIconNames } from './kitIcons'

const sample = (id: string, title: string, width: number, height: number, draw: (p: ReturnType<typeof createFormPainter>) => void): Sample => ({
  id, title, width, height, detail: 'Windows 95 component',
  draw: context => {
    const p = createFormPainter(context)
    p.fill(0, 0, width, height, palette.silver)
    draw(p)
  },
})

export const choiceSamples = (kind: 'checkbox' | 'radio') => [false, true].flatMap(labeled => [false, true].flatMap(disabled => [false, true].map(checked => sample(
  `${kind}-${labeled}-${disabled}-${checked}`, `${disabled ? 'Disabled' : 'Default'} · ${checked ? 'Selected' : 'Unselected'}${labeled ? ' · Label' : ''}`, labeled ? 116 : 40, 38,
  p => p[kind](12, 12, { checked, disabled, label: labeled ? 'Placeholder' : undefined }),
))))

export const inputSamples = [false, true].flatMap(dropdown => [false, true].flatMap(disabled => [false, true].map(filled => sample(
  `input-${dropdown}-${disabled}-${filled}`, `${dropdown ? 'Dropdown' : 'Text'} · ${disabled ? 'Disabled' : 'Default'}${filled ? ' filled' : ''}`, 184, 60,
  p => {
    p.text('Label:', 12, 9, 8, disabled ? palette.gray : palette.black)
    p.input({ x: 12, y: 27, width: 160, height: 22 }, filled ? 'placeholder' : '', disabled ? 'disabled' : 'normal', dropdown)
  },
))))

export const numberSamples = [false, true].flatMap(disabled => [false, true].map(filled => sample(
  `number-${disabled}-${filled}`, `${disabled ? 'Disabled' : 'Default'}${filled ? ' filled' : ''}`, 80, 60,
  p => {
    p.text('Label:', 12, 9, 8, disabled ? palette.gray : palette.black)
    p.numberInput({ x: 12, y: 27, width: 48, height: 22 }, filled ? '000' : '', disabled)
  },
)))

export const spinnerSamples = [false, true].flatMap(upDisabled => [false, true].map(downDisabled => sample(
  `spinner-${upDisabled}-${downDisabled}`, `${upDisabled ? 'Disabled' : 'Active'} / ${downDisabled ? 'Disabled' : 'Active'}`, 40, 40,
  p => p.spinner({ x: 12, y: 12, width: 16, height: 16 }, upDisabled, downDisabled),
)))

export const dropdownSamples = [false, true].map(disabled => sample(
  `dropdown-${disabled}`, disabled ? 'Disabled arrow' : 'Active arrow', 40, 40,
  p => p.arrowButton({ x: 12, y: 12, width: 16, height: 16 }, 'down', disabled),
))

export const disabledCaptionSamples: Sample[] = ['minimize', 'maximize', 'close'].map(kind => sample(
  `disabled-${kind}`, `Disabled ${kind}`, 40, 40,
  p => p.captionButton({ x: 12, y: 12, width: metrics.captionWidth, height: metrics.captionHeight }, kind as 'minimize' | 'maximize' | 'close', false, true),
))

export function windowSample(showIcon: boolean, filled: boolean): Sample {
  return sample(`window-${showIcon}-${filled}`, `${filled ? 'Icon view' : 'Empty window'} · ${showIcon ? 'With icon' : 'Without icon'}`, 260, filled ? 160 : 100, p => {
    const r = { x: 8, y: 8, width: 244, height: filled ? 144 : 84 }
    p.windowFrame(r)
    p.titleBar(r, showIcon ? '    Title' : 'Title')
    if (showIcon) p.icon('Folder', 16, 14, 16)
    const captions = captionRects(r)
    p.captionButton(captions.minimize, 'minimize')
    p.captionButton(captions.maximize, 'maximize')
    p.captionButton(captions.close, 'close')
    if (filled) {
      const body = { x: 12, y: 32, width: 236, height: 94 }
      p.bevel(body, true)
      p.fill(body.x + 2, body.y + 2, body.width - 4, body.height - 4, palette.white)
      ;['Windows document', 'Documents', 'Internet Explorer', 'Program folder', 'MIDI document', 'Disk', 'Tree', 'Paint'].forEach((name, i) => {
        const x = 24 + (i % 4) * 56
        const y = 38 + Math.floor(i / 4) * 42
        p.icon(name, x + 5, y, 16)
        p.text('Label', x, y + 18)
      })
    }
    const status = { x: r.x + 4, y: r.y + r.height - 21, width: r.width - 8, height: 17 }
    p.recess(status)
    p.text('0 object(s)', status.x + 3, status.y + 2)
  })
}

export const kitIconSamples = kitIconNames.map(name => sample(`icon-${name}`, name, 84, 56, p => {
  p.icon(name, 10, 12, 32)
  p.icon(name, 58, 20, 16)
}))

export const labelSamples = [false, true].flatMap(white => [false, true].map(withIcon => sample(
  `label-${white}-${withIcon}`, `${white ? 'White' : 'Black'} text${withIcon ? ' · With icon' : ''}`, 80, withIcon ? 76 : 38,
  p => {
    if (withIcon) p.icon('Folder', 24, 9)
    p.text('Label', 27, withIcon ? 47 : 12, 8, white ? palette.white : palette.black)
  },
)))

export const taskbarSamples = [sample('start-flag', 'Start flag', 40, 38, p => p.flag(12, 12)), ...[false, true].map(pressed => sample(`start-button-${pressed}`, pressed ? 'Start button · pressed' : 'Start button', metrics.startWidth, metrics.startHeight, p => p.startButton(0, 0, pressed))), ...[false, true].map(selected => sample(`task-button-${selected}`, selected ? 'Selected window button' : 'Window button', 144, 44, p => {
  p.taskButton({ x: 12, y: 10, width: 120, height: 24 }, selected)
  p.icon('Folder', 15, 14, 16)
  p.text('Label', 34, 15, 8, palette.black, selected)
})), sample('taskbar', 'Taskbar', 640, 32, p => {
  p.fill(0, 0, 640, 1, palette.white)
  p.startButton(2, 5)
  for (let i = 0; i < 3; i++) {
    const x = 60 + i * 124
    p.taskButton({ x, y: 4, width: 120, height: 24 }, i === 0)
    p.icon('Folder', x + 4, 8, 16)
    p.text('Label', x + 24, 9, 8, palette.black, i === 0)
  }
  p.recess({ x: 553, y: 4, width: 83, height: 24 })
  p.icon('Folder', 558, 8, 16)
  p.text('10:36 PM', 578, 9)
})]
