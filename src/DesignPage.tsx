import { lazy, Suspense, useEffect, useState } from 'react'
import { borderSamples, buttonSample, captionSamples, surfaceSamples, titleSamples, typeSample } from './designSamples'
import type { Sample } from './designSamples'
import type { ButtonState } from './win95'
import { palette } from './win95'
import { fontRoles } from './bitmapFont'
import { useWin95Cursors } from './useWin95Cursors'
import './DesignPage.css'
const InteractiveGallery = lazy(() => import('./InteractiveGallery').then(module => ({ default: module.InteractiveGallery })))
import { PixelPreview } from './PixelPreview'
import { treeSamples, listSamples, sectionSamples, scrollbarSamples } from './collectionSamples'
import { LiveScrollPane } from './LiveScrollPane'
import { fileListSamples } from './fileListSamples'
import { FileListPreview } from './FileListPreview'
import { choiceSamples, disabledCaptionSamples, dropdownSamples, inputSamples, kitIconSamples, labelSamples, numberSamples, spinnerSamples, taskbarSamples, windowSample } from './kitSamples'


function SampleCard({ sample, scale }: { sample: Sample; scale: number }) {
  return <article className="sample-card">
    <h3>{sample.title}</h3>
    <div className="sample-stage"><PixelPreview sample={sample} scale={scale} /></div>
  </article>
}

function LiveButton({ scale }: { scale: number }) {
  const [pressed, setPressed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [clicks, setClicks] = useState(0)
  const state: ButtonState = pressed ? 'pressed' : focused ? 'focused' : 'normal'
  return <article className="sample-card">
    <h3>Interactive</h3>
    <div className="sample-stage">
      <button className="live-button" aria-label="Try the Windows 95 button" onClick={() => setClicks(value => value + 1)}
        onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)} onPointerCancel={() => setPressed(false)}
        onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setPressed(false) }}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setPressed(true) }} onKeyUp={() => setPressed(false)}>
        <PixelPreview sample={buttonSample(state)} scale={scale} />
      </button>
    </div>
    <div className="sample-caption"><span aria-live="polite">{clicks ? `${clicks} ${clicks === 1 ? 'click' : 'clicks'} · ${state}` : 'Click, hold, or focus with Tab'}</span></div>
  </article>
}

function DesignPage() {
  const [interactive, setInteractive] = useState(() => localStorage.getItem('design-interactive') === 'true')
  const [sampleText, setSampleText] = useState('The quick brown fox. 0123456789')
  const [density, setDensity] = useState(window.devicePixelRatio)
  useEffect(() => {
    document.title = 'Windows 95 · Design'
    const resize = () => setDensity(window.devicePixelRatio)
    let media: MediaQueryList
    const watch = () => {
      media?.removeEventListener('change', watch)
      resize()
      media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      media.addEventListener('change', watch)
    }
    watch()
    window.addEventListener('resize', resize)
    return () => { media.removeEventListener('change', watch); window.removeEventListener('resize', resize) }
  }, [])
  // Two physical screen pixels per source pixel, including Retina displays.
  const scale = 2 / density
  useWin95Cursors(scale)
  return <main className="design-page">
    <header className="design-header"><h1>Components</h1><a href="/test/desktop">Desktop</a><label className="interactive-mode"><input type="checkbox" checked={interactive} onChange={event => { setInteractive(event.target.checked); localStorage.setItem('design-interactive', String(event.target.checked)) }} /> Interactive</label></header>
        {interactive ? <Suspense fallback={<p>Loading components…</p>}><InteractiveGallery scale={scale} /></Suspense> : <>

        <section id="typography" className="design-section">
          <h2>Typography</h2>
          <label className="sample-text-label">Sample text<input value={sampleText} maxLength={80} onChange={event => setSampleText(event.target.value)} spellCheck={false} /></label>
          <div className="sample-grid two-column">
            <SampleCard sample={typeSample(fontRoles.ui, sampleText)} scale={scale} />
            <SampleCard sample={typeSample(fontRoles.uiBold, sampleText)} scale={scale} />
            <SampleCard sample={typeSample(fontRoles.systemControl, sampleText)} scale={scale} />
            <SampleCard sample={typeSample(fontRoles.document, sampleText)} scale={scale} />
            <SampleCard sample={typeSample({ family: 'ms-sans-serif', size: 10 }, sampleText)} scale={scale} />
            <SampleCard sample={typeSample(fontRoles.banner, 'Windows 95')} scale={scale} />
          </div>
        </section>

        <section id="window-chrome" className="design-section">
          <h2>Window chrome</h2>
          <div className="sample-grid two-column">{titleSamples.map(sample => <SampleCard key={sample.id} sample={sample} scale={scale} />)}</div>
          <div className="sample-grid four-column">{[...captionSamples, ...disabledCaptionSamples].map(sample => <SampleCard key={sample.id} sample={sample} scale={scale} />)}</div>
        </section>

        <section id="buttons" className="design-section">
          <h2>Buttons</h2>
          <div className="sample-grid four-column">{(['normal', 'focused', 'pressed', 'preferred', 'disabled'] as const).map(state => <SampleCard key={state} sample={buttonSample(state)} scale={scale} />)}</div>
          <div className="sample-grid two-column"><LiveButton scale={scale} /></div>
        </section>

        {[
          { id: 'checkboxes', title: 'Checkboxes', samples: choiceSamples('checkbox') },
          { id: 'radios', title: 'Radio buttons', samples: choiceSamples('radio') },
          { id: 'inputs', title: 'Input fields', samples: inputSamples },
          { id: 'dropdowns', title: 'Dropdown buttons', samples: dropdownSamples },
          { id: 'numbers', title: 'Number inputs', samples: numberSamples },
          { id: 'spinners', title: 'Spinner buttons', samples: spinnerSamples },
          { id: 'trees', title: 'Tree views', samples: treeSamples },
          { id: 'lists', title: 'List views', samples: listSamples },
          { id: 'file-lists', title: 'File dialog lists', samples: fileListSamples },
          { id: 'sections', title: 'Sections and headers', samples: sectionSamples },
          { id: 'scrollbars', title: 'Scrollbars', samples: scrollbarSamples },
          { id: 'labels', title: 'Labels', samples: labelSamples },
          { id: 'windows', title: 'Windows', samples: [windowSample(true, false), windowSample(false, false), windowSample(true, true), windowSample(false, true)] },
          { id: 'taskbar', title: 'Taskbar', samples: taskbarSamples },
        ].map(group => <section key={group.id} id={group.id} className="design-section">
          <h2>{group.title}</h2>
          <div className="sample-grid">
            {group.samples.map(sample => <SampleCard key={sample.id} sample={sample} scale={scale} />)}
            {group.id === 'scrollbars' && <LiveScrollPane scale={scale} />}
            {group.id === 'file-lists' && <FileListPreview scale={scale} />}
          </div>
        </section>)}

        <section id="surfaces" className="design-section">
          <h2>Surfaces</h2>
          <div className="sample-grid two-column">{[...surfaceSamples, ...borderSamples].map(sample => <SampleCard key={sample.id} sample={sample} scale={scale} />)}</div>
        </section>

        <section id="icons" className="design-section">
          <h2>Icons</h2>
          <div className="sample-grid two-column">{kitIconSamples.map(sample => <SampleCard key={sample.id} sample={sample} scale={scale} />)}</div>
        </section>

        </>}
        <section id="palette" className="design-section">
          <h2>Palette</h2>
          <div className="palette-grid">{Object.entries(palette).map(([name, color]) => <article className="palette-card" key={name}><h3>{name}</h3><div style={{ backgroundColor: color }} /><code>{color.toUpperCase()}</code></article>)}</div>
        </section>
  </main>

}

export default DesignPage
