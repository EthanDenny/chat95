import { createCollectionPainter, flattenTree } from './collectionControls'
import type { TreeItem } from './collectionControls'
import type { Sample } from './designSamples'
import { palette } from './win95'

type CollectionPainter = ReturnType<typeof createCollectionPainter>
function sample(id: string, title: string, width: number, height: number, draw: (p: CollectionPainter) => void): Sample {
  return { id, title, width, height, detail: 'Native bitmap text and one-pixel edges', draw: context => {
    const p = createCollectionPainter(context)
    p.fill(0, 0, width, height, palette.silver)
    draw(p)
  } }
}

const folders = ['Billboards', "Bobby's Stats", 'Business Unit', 'Color Samples', 'Extra Templates', 'Financial Statistics', 'Mailing Lists', 'Old Program Files', 'Quarterly Stats', 'Reviews', 'Rolling Account', 'Smith Project']
const treeItems: TreeItem[] = [{ label: 'My Computer', icon: 'My Computer', expanded: true, children: [
  { label: '3½ Floppy (A:)', icon: 'Floppy drive' },
  { label: "Paul's Hard Drive (C:)", icon: 'Drive', expanded: true, children: folders.map((label, index) => ({
    label, icon: 'Folder', children: index % 3 === 1 ? [{ label: 'Documents', icon: 'Folder' }] : undefined,
  })) },
  { label: 'Control Panel', icon: 'Control Panel' },
] }]

export const treeSamples: Sample[] = [true, false].map(active => sample(`tree-${active}`, active ? 'Folder tree · focused selection' : 'Folder tree · inactive selection', 250, 276, p => {
  p.header({ x: 0, y: 0, width: 250, height: 21 }, 'All Folders')
  p.pane({ x: 0, y: 22, width: 250, height: 233 })
  p.tree({ x: 2, y: 24, width: 230, height: 213 }, flattenTree(treeItems), "Paul's Hard Drive (C:)", active)
  p.scrollbar({ x: 232, y: 24, width: 16, height: 213 }, 'vertical', { value: 0, total: flattenTree(treeItems).length * 16, page: 213 })
  p.scrollbar({ x: 2, y: 237, width: 230, height: 16 }, 'horizontal', { value: 0, total: 280, page: 230 })
  p.fill(232, 237, 16, 16, palette.silver)
  p.recess({ x: 0, y: 258, width: 168, height: 18 })
  p.text('95 object(s)', 3, 260)
  p.recess({ x: 170, y: 258, width: 80, height: 18 })
  p.text('2.75MB', 173, 260)
}))

export const listSamples: Sample[] = [
  sample('list-box', 'List box · selected row', 160, 118, p => {
    p.pane({ x: 0, y: 0, width: 160, height: 118 })
    const items = ['Windows Default', 'Asterisk', 'Critical Stop', 'Exclamation', 'Question', 'Start Windows', 'Exit Windows']
    p.clip({ x: 2, y: 2, width: 140, height: 114 }, () => items.forEach((value, index) => {
      const y = 2 + index * 16
      if (index === 2) {
        p.fill(2, y, 140, 16, palette.navy)
        p.focus({ x: 0, y: y - 2, width: 144, height: 20 }, palette.white)
      }
      p.text(value, 4, y + 1, 8, index === 2 ? palette.white : palette.black)
    }))
    p.scrollbar({ x: 142, y: 2, width: 16, height: 114 }, 'vertical', { value: 0, total: 224, page: 114 })
  }),
  sample('small-icon-list', 'List view · small icons', 272, 118, p => {
    p.pane({ x: 0, y: 0, width: 272, height: 118 })
    p.clip({ x: 2, y: 2, width: 268, height: 98 }, () => folders.slice(0, 10).forEach((value, index) => {
      const x = 4 + Math.floor(index / 5) * 140
      const y = 4 + index % 5 * 18
      p.icon('Folder', x, y, 16)
      p.label(value, x + 17, y, index === 2, index === 2)
    }))
    p.scrollbar({ x: 2, y: 100, width: 268, height: 16 }, 'horizontal', { value: 0, total: 420, page: 268 })
  }),
  sample('details-view', 'Details view · column headers', 366, 153, p => {
    p.pane({ x: 0, y: 0, width: 366, height: 153 })
    const columns = [{ label: 'Name', width: 151 }, { label: 'Size', width: 52 }, { label: 'Type', width: 90 }, { label: 'Modified', width: 100 }]
    p.clip({ x: 2, y: 2, width: 346, height: 133 }, () => {
      let x = 2
      for (const column of columns) { p.header({ x, y: 2, width: column.width, height: 20 }, column.label); x += column.width }
      const entries = [
        ['Business Unit', '', 'File Folder', '9/16/96'], ['Color Samples', '', 'File Folder', '9/16/96'],
        ['Readme.txt', '2KB', 'Text Document', '8/24/95'], ['Schedule.txt', '4KB', 'Text Document', '9/12/96'],
        ['Windows.bmp', '38KB', 'Bitmap Image', '8/24/95'],
      ]
      entries.forEach((entry, index) => {
        const y = 24 + index * 18
        p.icon(index < 2 ? 'Folder' : 'Windows document', 4, y, 16)
        p.label(entry[0], 21, y, index === 2, index === 2)
        let columnX = 153
        entry.slice(1).forEach((value, cell) => {
          const width = columns[cell + 1].width
          p.clip({ x: columnX + 4, y, width: width - 8, height: 16 }, () => p.text(value, columnX + 4, y + 1))
          columnX += width
        })
      })
    })
    p.scrollbar({ x: 348, y: 2, width: 16, height: 133 }, 'vertical', { value: 0, total: 133, page: 133 })
    p.scrollbar({ x: 2, y: 135, width: 346, height: 16 }, 'horizontal', { value: 0, total: 393, page: 346 })
    p.fill(348, 135, 16, 16, palette.silver)
  }),
]

export const sectionSamples: Sample[] = [
  sample('pane-heading', 'Pane heading', 220, 21, p => p.header({ x: 0, y: 0, width: 220, height: 21 }, 'All Folders')),
  sample('column-heading', 'Column header · normal / pressed', 200, 20, p => {
    p.header({ x: 0, y: 0, width: 100, height: 20 }, 'Name')
    p.header({ x: 100, y: 0, width: 100, height: 20 }, 'Name', true)
  }),
  sample('tree-expanders', 'Tree expanders · collapsed / expanded', 49, 25, p => {
    p.fill(0, 0, 49, 25, palette.white)
    p.expander(8, 8, false)
    p.expander(32, 8, true)
  }),
  sample('split-panes', 'Split panes · recessed borders', 220, 80, p => {
    p.header({ x: 0, y: 0, width: 100, height: 21 }, 'All Folders')
    p.header({ x: 104, y: 0, width: 116, height: 21 }, 'Contents of C:\\')
    p.pane({ x: 0, y: 22, width: 100, height: 58 })
    p.pane({ x: 104, y: 22, width: 116, height: 58 })
  }),
]

export const scrollbarSamples: Sample[] = [
  sample('scroll-states', 'Horizontal · normal / pressed / unavailable', 200, 64, p => {
    for (let index = 0; index < 3; index++) p.scrollbar({ x: 0, y: index * 24, width: 200, height: 16 }, 'horizontal', {
      value: 30, total: 300, page: index === 2 ? 300 : 100, pressed: index === 1 ? 'end' : undefined,
    })
  }),
  sample('scroll-vertical', 'Vertical · normal / pressed / unavailable', 64, 150, p => {
    for (let index = 0; index < 3; index++) p.scrollbar({ x: index * 24, y: 0, width: 16, height: 150 }, 'vertical', {
      value: 30, total: 300, page: index === 2 ? 300 : 100, pressed: index === 1 ? 'start' : undefined,
    })
  }),
]
