import { createCollectionPainter } from './collectionControls'
import type { ListItem } from './collectionControls'
import type { Sample } from './designSamples'

const directories: ListItem[] = [
  { label: 'c:\\', icon: 'Directory open' },
  { label: 'excel', icon: 'Directory open', indent: 1 },
  ...['examples', 'excelcbt', 'library', 'setup'].map(label => ({ label, icon: 'Folder', indent: 2 })),
]

export const dialogFiles: ListItem[] = [
  'Figure 07 - Task bar.bmp', 'Figure 08 - Old File Open.bmp', 'Figure 09 - New File Open.bmp',
  'Figure 10 - Old Printer Setup.bmp', 'Figure 11 - Help Contents.bmp', 'Figure 12 - Help Search.bmp',
  'Figure 13 - Help Index.bmp', 'Figure 14 - Sample Database.bmp', 'Figure 15 - Sample Database.bmp',
  'Figure 16 - Control Panel.bmp', 'Figure 17 - Display Settings.bmp', 'Figure 18 - My Computer.bmp',
].map(label => ({ label, icon: 'Bitmap document' }))

export const fileListSamples: Sample[] = [
  ...[false, true].map(selected => ({
    id: `dialog-files-${selected}`, title: selected ? 'File list · selected row' : 'File list · plain text',
    detail: 'Classic file-dialog list box', width: 140, height: 112,
    draw: (context: CanvasRenderingContext2D) => {
      const p = createCollectionPainter(context)
      p.pane({ x: 0, y: 0, width: 140, height: 112 })
      p.listBox({ x: 2, y: 2, width: 120, height: 108 }, [{ label: 'filelist.txt' }, { label: 'network.txt' }], selected ? 0 : -1, selected)
      p.scrollbar({ x: 122, y: 2, width: 16, height: 108 }, 'vertical', { value: 0, total: 32, page: 108 })
    },
  })),
  ...[true, false].map(active => ({
    id: `dialog-directories-${active}`, title: active ? 'Directories · current folder' : 'Directories · inactive selection',
    detail: 'Indented ancestor path and child folders, without expanders', width: 150, height: 112,
    draw: (context: CanvasRenderingContext2D) => {
      const p = createCollectionPainter(context)
      p.pane({ x: 0, y: 0, width: 150, height: 112 })
      p.listBox({ x: 2, y: 2, width: 130, height: 108 }, directories, 1, active, active)
      p.scrollbar({ x: 132, y: 2, width: 16, height: 108 }, 'vertical', { value: 0, total: 160, page: 108 })
    },
  })),
]
