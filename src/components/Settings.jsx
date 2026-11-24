import React, { useEffect, useState } from 'react'
import { Save, RefreshCw, Info } from 'lucide-react'
import { settingsAPI } from '../api/client.js'

// 分组定义：与后端 /api/settings 的字段一一对应
const SECTIONS = [
  {
    title: '忽略名单',
    desc: '命中的镜像不再检查更新，命中的容器不再显示"可更新"；支持 * 通配',
    fields: [
      { key: 'ignoreImages', label: '忽略镜像', placeholder: 'redis:*,ghcr.io/foo/bar（逗号分隔）' },
      { key: 'ignoreContainers', label: '忽略容器', placeholder: 'db,redis-*（逗号分隔）' },
    ],
  },
  {
    title: '更新通知',
    desc: '发现新版本、更新成功/失败/回滚都会推送；留空表示不通知',
    fields: [
      { key: 'notifyUrl', label: '通知地址', placeholder: 'https://api.day.app/你的key' },
      {
        key: 'notifyFormat',
        label: '通知格式',
        placeholder: '留空自动识别',
        options: ['', 'bark', 'dingtalk', 'feishu', 'ntfy', 'generic'],
      },
    ],
  },
  {
    title: '定时自动更新',
    desc: '到点自动拉取新镜像并重建容器，失败会自动回滚；关闭时只通知不动容器',
    fields: [
      {
        key: 'autoUpdate',
        label: '开关',
        placeholder: '',
        options: ['', '1', '0'],
        optionLabels: { '': '关闭', 1: '开启', 0: '关闭' },
      },
      { key: 'autoUpdateCron', label: '执行时刻', placeholder: '0 4 * * *（默认每天 04:00）' },
      { key: 'autoUpdateInclude', label: '仅更新这些容器', placeholder: '留空=全部（逗号分隔，支持 *）' },
      { key: 'autoUpdateMax', label: '每轮最多更新', placeholder: '5' },
    ],
  },
  {
    title: '旧镜像清理',
    desc: '更新成功后清理同仓库的旧版本；仍被容器引用的镜像永远不会删',
    fields: [
      {
        key: 'pruneOldImages',
        label: '开关',
        placeholder: '',
        options: ['', '1', '0'],
        optionLabels: { '': '关闭', 1: '开启', 0: '关闭' },
      },
      { key: 'pruneKeep', label: '每个仓库保留', placeholder: '2（个版本）' },
      {
        key: 'pruneDangling',
        label: '顺带清理无标签镜像',
        placeholder: '',
        options: ['', '1', '0'],
        optionLabels: { '': '不清理', 1: '清理', 0: '不清理' },
      },
      {
        key: 'pruneDryRun',
        label: '试运行',
        placeholder: '',
        options: ['', '1', '0'],
        optionLabels: { '': '关闭', 1: '只记录不删除', 0: '关闭' },
      },
    ],
  },
]

export function Settings() {
  const [values, setValues] = useState({})
  const [sources, setSources] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const load = async () => {
    setLoading(true)
    try {
      const response = await settingsAPI.getSettings()
      if (response.data.code === 200) {
        setValues(response.data.data.values || {})
        setSources(response.data.data.sources || {})
      } else {
        setToast({ type: 'error', msg: '加载设置失败：' + response.data.msg })
      }
    } catch (error) {
      setToast({ type: 'error', msg: '加载设置失败：' + (error.message || error) })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const response = await settingsAPI.updateSettings(values)
      if (response.data.code === 200) {
        setValues(response.data.data.values || {})
        setSources(response.data.data.sources || {})
        setToast({ type: 'success', msg: '设置已保存并立即生效' })
      } else {
        setToast({ type: 'error', msg: '保存失败：' + response.data.msg })
      }
    } catch (error) {
      setToast({ type: 'error', msg: '保存失败：' + (error.message || error) })
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field) => {
    const value = values[field.key] ?? ''
    const source = sources[field.key] || 'env'
    const commonClass =
      'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40'

    return (
      <div key={field.key} className="space-y-1">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
          {source === 'file' ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              UI 设置
            </span>
          ) : value ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              环境变量
            </span>
          ) : null}
        </div>
        {field.options ? (
          <select
            className={commonClass}
            value={value}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
          >
            {field.options.map((opt) => (
              <option key={opt || 'empty'} value={opt}>
                {(field.optionLabels && field.optionLabels[opt]) || opt || '（默认）'}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={commonClass}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-2 sm:px-6 py-4 pt-4 sm:pt-4 space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">设置</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading || saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={'h-4 w-4' + (loading ? ' animate-spin' : '')} />
                刷新
              </button>
              <button
                onClick={save}
                disabled={loading || saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            这里修改的值会保存在面板数据目录里并立即生效，优先于环境变量；留空则使用环境变量或默认值。
          </p>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{section.title}</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">{section.desc}</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {section.fields.map(renderField)}
            </div>
          </div>
        ))}

        <div className="card p-4 text-xs text-gray-500 dark:text-gray-400">
          提示：忽略名单也可以用环境变量 IGNORE_IMAGES / IGNORE_CONTAINERS 或容器标签
          dockercopilot.check=false 来配置；这里保存的值优先级最高。
        </div>
      </div>

      {toast && (
        <div
          className={
            'fixed bottom-24 sm:bottom-8 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm ' +
            (toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white')
          }
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
