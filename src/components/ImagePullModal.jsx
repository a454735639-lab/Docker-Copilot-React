import React, { useEffect, useRef, useState } from 'react'
import { X, DownloadCloud } from 'lucide-react'
import { imageAPI, progressAPI } from '../api/client.js'

// 拉取镜像：POST /api/image/pull → 轮询 /api/progress/:taskid
export function ImagePullModal({ open, onClose, onDone }) {
  const [image, setImage] = useState('')
  const [taskID, setTaskID] = useState(null)
  const [log, setLog] = useState('')
  const [percent, setPercent] = useState(0)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const timer = useRef(null)

  useEffect(() => {
    if (!open) {
      setImage('')
      setTaskID(null)
      setLog('')
      setPercent(0)
      setDone(false)
      setErr('')
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
  }, [open])

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const start = async () => {
    const ref = image.trim()
    if (!ref) return
    setErr('')
    setLog('')
    setDone(false)
    setPercent(0)
    try {
      const response = await imageAPI.pullImage(ref)
      if (response.data.code !== 200) {
        setErr(response.data.msg || '启动失败')
        return
      }
      const id = response.data.data.taskID
      setTaskID(id)
      timer.current = setInterval(async () => {
        try {
          const p = await progressAPI.getProgress(id)
          const d = p.data.data || {}
          const isDone = d.IsDone ?? d.isDone
          setLog([d.Message ?? d.message, d.DetailMsg ?? d.detailMsg].filter(Boolean).join(' · '))
          setPercent(d.Percentage ?? d.percentage ?? 0)
          if (isDone) {
            clearInterval(timer.current)
            timer.current = null
            setDone(true)
            if (onDone) onDone()
          }
        } catch (e) {
          // 轮询瞬间失败忽略，下一轮再试
        }
      }, 1000)
    } catch (e) {
      setErr('请求失败：' + (e.message || e))
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DownloadCloud className="h-4 w-4" /> 拉取镜像
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="nginx:1.27 / ghcr.io/foo/bar:latest"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
            disabled={!!taskID && !done}
          />
          {(taskID || log) && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${done ? 'bg-green-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.max(percent, 5)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{log || '准备中…'}</p>
            </div>
          )}
          {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              {done ? '关闭' : '取消'}
            </button>
            {!done && (
              <button
                onClick={start}
                disabled={!image.trim() || (!!taskID && !done)}
                className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white disabled:opacity-50"
              >
                开始拉取
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
