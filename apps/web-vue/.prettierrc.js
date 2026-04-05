module.exports = {
  // 缩进宽度
  tabWidth: 2,
  // 使用空格代替制表符
  useTabs: false,
  // 句尾是否加分号
  semi: true,
  // 使用单引号代替双引号
  singleQuote: true,
  // 对象属性是否加引号（as-needed：仅当需要时加）
  quoteProps: 'as-needed',
  // 多行数组/对象末尾是否加逗号
  trailingComma: 'es5',
  // 大括号内是否加空格（{ foo: bar }）
  bracketSpacing: true,
  // 箭头函数参数是否加括号（always：始终加）
  arrowParens: 'always',
  // 换行符格式（lf：unix格式，crlf：windows格式）
  endOfLine: 'lf',
  // HTML标签是否折行
  htmlWhitespaceSensitivity: 'ignore',
  // Vue文件脚本和样式标签缩进
  vueIndentScriptAndStyle: true,
  // 不格式化的文件类型
  ignorePath: '.prettierignore',
  // 格式化嵌入在HTML中的代码
  embeddedLanguageFormatting: 'auto'
}