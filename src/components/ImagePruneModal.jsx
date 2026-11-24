import React, { useEffect, useState } from 'react'
import { X, Trash2, Eye } from 'lucide-react'
import { imageAPI } from '../api/client.js'

const fmtSize = (n) => {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// 按仓库保留最近 N 个版本：先预览，再执行
export function ImagePruneModal({ open, onClose, onDone }) {
  const [keep, setKeep] = useState('2')
  const [dangling, setDangling] = useState(false)
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) { setReport(null); setErr(''); setBusy(false) }
  }, [open])

  const run = async (dryRun) => {
    setBusy(true)
    setErr('')
    try {
      const response = await imageAPI.pruneImages({
        keep: parseInt(keep, 10) || 2,
        dangling,
        dryRun,
      })
      if (response.data.code === 200) {
        setReport({ ...response.data.data, dryRun })
        if (!dryRun && onDone) onDone()
      } else {
        setErr(response.data.msg || '清理失败')
      }
    } catch (e) {
      setErr(e.message || '清理失败')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const list = (report && (report.dryRun ? report.candidates : report.removed)) || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">按仓库清理旧镜像</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              每个仓库保留
              <input
                value={keep}
                onChange={(e) => setKeep(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-center"
              />
              个版本
            </label>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={dangling} onChange={(e) => setDangling(e.target.checked)} />
              顺带清理无标签镜像
            </label>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            仍被容器（含已停止）引用的镜像永远不会被删除；建议先点「预览」看清楚会删哪些。
          </p>

          {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}

          {report && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {report.dryRun ? '将删除' : '已删除'} <b>{list.length}</b> 个
                {!report.dryRun && report.freedBytes ? `，释放约 ${fmtSize(report.freedBytes)}` : ''}
                {report.skippedUsed && report.skippedUsed.length > 0 ? `，跳过占用 ${report.skippedUsed.length} 个` : ''}
              </p>
              {list.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="text-left px-2 py-1.5">仓库</th>
                        <th className="text-left px-2 py-1.5">标签</th>
                        <th className="text-right px-2 py-1.5">大小</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item) => (
                        <tr key={item.id + item.tag} className="border-t border-gray-100 dark:border-gray-700/50">
                          <td className="px-2 py-1.5 text-gray-800 dark:text-gray-200 break-all">{item.repo}</td>
                          <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{item.tag}</td>
                          <td className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-400">{fmtSize(item.size)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {list.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">没有需要清理的镜像。</p>}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            关闭
          </button>
          <button
            onClick={() => run(true)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" /> 预览
          </button>
          <button
            onClick={() => run(false)}
            disabled={busy || !report || report.dryRun}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-600 text-white disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> 执行删除
          </button>
        </div>
      </div>
    </div>
  )
}
