import React, { useEffect, useState } from 'react'
import { X, Copy, Layers, Boxes } from 'lucide-react'
import { imageAPI } from '../api/client.js'

const fmtSize = (n) => {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function ImageDetailModal({ imageId, onClose }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!imageId) return
    setData(null)
    setErr('')
    imageAPI.imageDetail(imageId)
      .then((r) => {
        if (r.data.code === 200) setData(r.data.data)
        else setErr(r.data.msg || '获取详情失败')
      })
      .catch((e) => setErr(e.message || '获取详情失败'))
  }, [imageId])

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(''), 1500)
    } catch (e) { /* 剪贴板不可用时忽略 */ }
  }

  if (!imageId) return null

  const row = (label, value) => (
    <div className="flex gap-3 text-sm py-1">
      <span className="w-24 flex-shrink-0 text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 break-all">{value}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4" /> 镜像详情
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
          {!data && !err && <p className="text-sm text-gray-500">加载中…</p>}
          {data && (
            <>
              {row('镜像 ID', data.id)}
              {row('仓库标签', (data.repoTags || []).join(', ') || '<none>')}
              {row('平台', `${data.os || '?'}/${data.architecture || '?'}`)}
              {row('大小', fmtSize(data.size))}
              {row('层数', String(data.layers || 0))}
              {row('创建时间', data.created)}
              {data.repoDigests && data.repoDigests.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 py-1">
                    <span className="w-24 flex-shrink-0 text-gray-500 dark:text-gray-400">Digest</span>
                    <button
                      onClick={() => copy(data.repoDigests[0], 'digest')}
                      className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline break-all text-left"
                    >
                      <Copy className="h-3 w-3 flex-shrink-0" />
                      {copied === 'digest' ? '已复制' : data.repoDigests[0]}
                    </button>
                  </div>
                </div>
              )}
              {data.config && data.config.entrypoint && data.config.entrypoint.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ENTRYPOINT</p>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded-lg overflow-x-auto text-gray-800 dark:text-gray-200">
                    {data.config.entrypoint.join(' ')}
                  </pre>
                </div>
              )}
              {data.config && data.config.cmd && data.config.cmd.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CMD</p>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded-lg overflow-x-auto text-gray-800 dark:text-gray-200">
                    {data.config.cmd.join(' ')}
                  </pre>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Boxes className="h-3 w-3" /> 被这些容器使用（{(data.usedBy || []).length}）
                </p>
                {(data.usedBy || []).length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">没有容器引用，可安全删除</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.usedBy.map((c) => (
                      <span key={c.name} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {c.name} · {c.state}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
