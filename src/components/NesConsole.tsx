import React, { ChangeEvent, Dispatch, SetStateAction, useMemo, useState } from 'react'
import styles from '/@/assets/stylesheets/components/NesConsole.module.css'
import NesConsoleLog from '/@/components/NesConsoleLog'
import Nes from '/@/models/Nes'

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

const NesConsole: React.FC<Props> = ({ nes }) => {
  const [logs, updateLogs] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const filteredLogs = useMemo(() => {
    return searchKeyword === ''
      ? logs
      : logs.filter((log) => log.toLocaleLowerCase().indexOf(searchKeyword.toLocaleLowerCase()) !== -1)
  }, [logs, searchKeyword])

  const logger = new NesConsoleLogger(updateLogs)

  nes.setLogger(logger)

  const handleBootup = () => {
    nes.bootup()
  }

  const handleRun = () => {
    nes.run()
  }

  const handleRunFrame = () => {
    nes.setDebug(true)
    nes.runFrame()
    nes.setDebug(false)
  }

  const handleRunScanline = () => {
    nes.setDebug(true)
    nes.runScanline()
    nes.setDebug(false)
  }

  const handleRunStep = () => {
    nes.setDebug(true)
    nes.runStep()
    nes.setDebug(false)
  }

  const handleRunCycle = () => {
    nes.setDebug(true)
    nes.runCycle()
    nes.setDebug(false)
  }

  const handleClear = () => {
    updateLogs([])
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(event.target.value)
  }

  return (
    <div className={styles.nesConsole}>
      <div className="buttons are-small has-addons mb-2">
        <button className="button" onClick={handleBootup}>
          Bootup
        </button>
        <button className="button" onClick={handleRun}>
          Run
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
        <button className="button" onClick={handleRunCycle}>
          Run Cycle
        </button>
        <button className="button" onClick={handleClear}>
          Run Clear
        </button>
      </div>
      <div className="mb-4">
        <input className="input is-small" type="text" value={searchKeyword} onChange={handleChange} />
      </div>
      <NesConsoleLog logs={filteredLogs} />
    </div>
  )
}

export default NesConsole
