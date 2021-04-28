import React, { ChangeEvent, Dispatch, SetStateAction, useMemo, useState } from 'react'
import styles from '/@/assets/stylesheets/components/NesConsole.module.css'
import { NesConsoleLog } from '/@/components/NesConsoleLog'
import { Nes } from '/@/models/Nes'
import { Rom } from '/@/models/Rom'

class NesConsoleLogger {
  static readonly FLUSH_INTERVAL = 100
  static readonly MAX_BUFFER_SIZE = 500000

  private buffer: string[] = []
  private timerId?: number

  constructor(private updater: Dispatch<SetStateAction<string[]>>) {}

  log(message: string): void {
    this.buffer.push(message)

    window.clearTimeout(this.timerId)

    this.timerId = window.setTimeout(() => this.flush(), NesConsoleLogger.FLUSH_INTERVAL)
  }

  private flush(): void {
    this.updater((prevLogs: string[]) => {
      const newLogs = [...prevLogs, ...this.buffer]

      newLogs.splice(0, newLogs.length - NesConsoleLogger.MAX_BUFFER_SIZE)

      return newLogs
    })
    this.buffer.splice(0)
  }
}

type Props = {
  nes: Nes
}

export const NesConsole: React.FC<Props> = ({ nes }) => {
  const [fileName, updateFileName] = useState('No ROM choose')
  const [logs, updateLogs] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const filteredLogs = useMemo(() => {
    return searchKeyword === ''
      ? logs
      : logs.filter((log) => log.toLocaleLowerCase().indexOf(searchKeyword.toLocaleLowerCase()) !== -1)
  }, [logs, searchKeyword])

  nes.logger = new NesConsoleLogger(updateLogs)

  const handleLoad = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]

    updateFileName(file.name)

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (!(reader.result instanceof ArrayBuffer)) return
      nes.rom = Rom.load(reader.result)
      nes.bootup()
    })
    reader.readAsArrayBuffer(file)
  }

  const handleRun = () => {
    nes.run()
  }

  const handleStop = () => {
    nes.stop()
  }

  const handleResume = () => {
    nes.resume()
  }

  const handleRunFrame = () => {
    nes.debug = true
    nes.runFrame()
    nes.debug = false
  }

  const handleRunScanline = () => {
    nes.debug = true
    nes.runScanline()
    nes.debug = false
  }

  const handleRunStep = () => {
    nes.debug = true
    nes.runStep()
    nes.debug = false
  }

  const handleClear = () => {
    updateLogs([])
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(event.target.value)
  }

  return (
    <div className={styles.nesConsole}>
      <div className="field is-grouped">
        <div className="control">
          <div className="file is-small has-name">
            <label className="file-label">
              <input className="file-input" type="file" accept=".nes" onChange={handleLoad} />
              <span className="file-cta">
                <span className="file-label">Choose ROM…</span>
              </span>
              <span className="file-name">{fileName}</span>
            </label>
          </div>
        </div>
        <div className="control is-expanded">
          <div className="buttons are-small has-addons">
            <button className="button" onClick={handleRun}>
              Run
            </button>
            <button className="button" onClick={handleStop}>
              Stop
            </button>
            <button className="button" onClick={handleResume}>
              Resume
            </button>
            <button className="button" onClick={handleRunFrame}>
              Run Frame
            </button>
            <button className="button" onClick={handleRunScanline}>
              Run Scanline
            </button>
            <button className="button" onClick={handleRunStep}>
              Run Step
            </button>
            <button className="button" onClick={handleClear}>
              Run Clear
            </button>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <input className="input is-small" type="text" value={searchKeyword} onChange={handleChange} />
      </div>
      <NesConsoleLog logs={filteredLogs} />
    </div>
  )
}
