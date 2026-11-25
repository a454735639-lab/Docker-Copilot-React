module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  // 上游自带的 useProgress.js 内容重复（未被引用），不参与检查
  ignorePatterns: ['dist/', 'node_modules/', 'src/hooks/useProgress.js'],
  rules: {
    // 只查"构建能过、运行会崩"的未定义标识符
    'no-undef': 'error',
  },
}
