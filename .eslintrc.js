module.exports = {
  root: true,
  env: {
    node: true
  },
  globals: {
    // vue-cli-plugin-electron-builder 注入的静态资源路径全局变量
    __static: 'readonly'
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    semi: 'off', // 语句后分号设置;
    camelcase: 'off',
    'no-unused-vars': 'off',
    'space-before-function-paren': 0,
    'vue/multi-word-component-names': 'off',
    'no-constant-condition': ['error', { checkLoops: false }],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto' // 允许自动处理行尾符
      }
    ]
  },
  ignorePatterns: ['src/utils/grwebapp.js', 'src/assets/iconfont.js']
};
