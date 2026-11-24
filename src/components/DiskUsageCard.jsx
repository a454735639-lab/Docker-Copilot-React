import React, { useEffect, useState } from 'react'
import { HardDrive, Trash2, RefreshCw } from 'lucide-react'
import { imageAPI } from '../api/client.js'

const fmtSize = (n) => {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function DiskUsageCard({ refreshKey = 0 }) {
  const [df, setDf] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const response = await imageAPI.diskUsage()
      if (response.data.code === 200) setDf(response.data.data)
    } catch (e) { /* 忽略 */ }
  }

  useEffect(() => { load() }, [refreshKey])

  const pruneBuildCache = async () => {
    if (!window.confirm('清理所有未使用的构建缓存？构建过的镜像层需要重新构建。')) return
    setBusy(true)
    setMsg('')
    try {
      const response = await imageAPI.pruneSystem({ buildCache: true, danglingImages: false })
      if (response.data.code === 200) {
        const freed = response.data.data.freedBytes || 0
        setMsg(`已清理，释放约 ${fmtSize(freed)}`)
        load()
      } else {
        setMsg(response.data.msg || '清理失败')
      }
    } catch (e) {
      setMsg(e.message || '清理失败')
    } finally {
      setBusy(false)
    }
  }

  if (!df) return null

  const items = [
    { label: '镜像', size: df.imagesSize, count: df.imagesCount },
    { label: '容器可写层', size: df.containersSize, count: df.containersCount },
    { label: '数据卷', size: df.volumesSize, count: df.volumesCount },
    { label: '构建缓存', size: df.buildCacheSize, count: df.buildCacheCount },
  ]

  return (
    <div className="mx-4 sm:mx-6 mt-4 card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive className="h-4 w-4" /> 磁盘占用
        </h3>
        <div className="flex items-center gap-2">
          {df.buildCacheSize > 0 && (
            <button
              onClick={pruneBuildCache}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> 清构建缓存（{fmtSize(df.buildCacheSize)}）
            </button>
          )}
          <button
            onClick={load}
            className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 刷新
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl bg-gray-50 dark:bg-gray-900/50 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">{it.label}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtSize(it.size)}</p>
            <p className="text-[10px] text-gray-400">{it.count || 0} 个</p>
          </div>
        ))}
      </div>
      {msg && <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{msg}</p>}
    </div>
  )
}
