import React from 'react'

// 错误边界：单个组件渲染出错时显示错误信息，而不是把整棵树卸载成白屏
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('页面渲染出错:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <div className="card p-6 space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">页面渲染出错</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              具体信息如下，可以截图反馈；点「重试」或刷新页面通常能恢复。
            </p>
            <pre className="text-xs whitespace-pre-wrap break-all bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-red-600 dark:text-red-400">
              {String((this.state.error && this.state.error.message) || this.state.error)}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
