module.exports = {
  transform: {
    '^.+\\.(js|jsx)?$': 'babel-jest'
  },
  testURL: 'http://localhost/',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/index.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'package.json',
    'package-lock.json',
  ],
  testResultsProcessor: 'jest-sonar-reporter',
  'coverageThreshold': {
    'global': {
      'branches': 70,
      'functions': 70,
      'lines': 70,
      'statements': 70
    }
  },
  'coverageReporters': ['html', 'lcov', 'text-summary']
}
