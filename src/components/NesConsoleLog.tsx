import React from 'react'
import { Virtuoso } from 'react-virtuoso'
import styles from '/@/assets/stylesheets/components/NesConsoleLog.module.css'

type Props = {
  logs: string[]
}

const NesConsoleLog: React.FC<Props> = ({ logs }) => {
  return (
    <Virtuoso
      className={styles.nesConsoleLogList}
      components={{
        Header: function Header() {
          return <div className={styles.nesConsoleLogListHeader} />
        },
        Footer: function Footer() {
          return <div className={styles.nesConsoleLogListFooter} />
        },
      }}
      followOutput
      itemContent={(index) => <div className={styles.nesConsoleLogListItem}>{logs[index]}</div>}
      totalCount={logs.length}
    />
  )
}

export default NesConsoleLog
