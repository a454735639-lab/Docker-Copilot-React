// 关于页：只保留一个项目介绍
export function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-2 sm:px-6 py-4 pt-4 sm:pt-4">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Docker Copilot</h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            一个简洁的 Docker 容器管理工具：查看容器与镜像、一键更新并支持失败自动回滚，
            可按需检查新版本并推送通知，也支持定时自动更新与旧镜像清理。
          </p>
        </div>
      </div>
    </div>
  )
}
