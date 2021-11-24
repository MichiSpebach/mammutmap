module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts'
};
