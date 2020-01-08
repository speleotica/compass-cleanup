module.exports = function(api) {
  api.cache(() => process.env.NODE_ENV)
  return {
    presets: [
      ['@babel/preset-env', { targets: 'maintained node versions' }],
      '@babel/preset-typescript'
    ],
    plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]]
  }
}
