const fs = require('fs');
const eslintConfig = require('./.eslintrc.json');

const ignoredFiles = fs
  .readFileSync('./.eslintignore', 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean);

eslintConfig.ignorePatterns = ignoredFiles;

module.exports = eslintConfig;
