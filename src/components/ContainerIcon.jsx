import React, { useEffect, useMemo, useState } from 'react'
import { getImageLogo, getRemoteLogo } from '../config/imageLogos.js'

// 同一张卡片图标：内置 logo → 用户上传 → 在线品牌图标 → 首字母头像
const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
  'from-red-500 to-orange-600',
]

const hashOf = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const initialsOf = (name, image) => {
  const raw = String(name || image || '?')
  const cleaned = raw.replace(/\s+/g, ' ').trim()
  const first = cleaned.split(' ')[0] || '?'
  return first.slice(0, 2).toUpperCase()
}

export function ContainerIcon({ name, usingImage, iconUrl, customIcons = {} }) {
  const candidates = useMemo(() => {
    const list = []
    if (iconUrl) list.push(iconUrl)
    if (usingImage) {
      const builtIn = getImageLogo(usingImage)
      if (builtIn) list.push(builtIn)
      for (const [key, url] of Object.entries(customIcons || {})) {
        if (key && (usingImage.startsWith(key) || usingImage.includes(`${key}:`))) {
          list.push(url)
          break
        }
      }
      const remote = getRemoteLogo(usingImage)
      if (remote) list.push(remote)
    }
    return Array.from(new Set(list.filter(Boolean)))
  }, [iconUrl, usingImage, customIcons])

  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [usingImage])

  if (index < candidates.length) {
    return (
      <img
        src={candidates[index]}
        alt={name || usingImage || 'container'}
        className="h-12 w-12 rounded-xl object-cover shadow-sm flex-shrink-0 bg-white dark:bg-gray-800"
        onError={() => setIndex((i) => i + 1)}
      />
    )
  }

  const seed = name || usingImage || '?'
  const gradient = GRADIENTS[hashOf(seed) % GRADIENTS.length]
  return (
    <div
      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0`}
      title={usingImage || name}
    >
      <span className="text-white text-sm font-semibold tracking-tight">{initialsOf(name, usingImage)}</span>
    </div>
  )
}
