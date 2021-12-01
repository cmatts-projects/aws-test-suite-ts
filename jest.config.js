/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/test/.*\\.test.ts$',
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
};