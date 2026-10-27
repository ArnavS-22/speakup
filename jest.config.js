// Unit tests cover pure logic (routing, questions, timing), so they run in
// plain Node with Babel instead of the full jest-expo React Native preset.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
  transformIgnorePatterns: ['node_modules/(?!(expo|expo-.*|@expo/.*)/)'],
  moduleNameMapper: { '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js', '^@/(.*)$': '<rootDir>/$1' },
  modulePathIgnorePatterns: ['<rootDir>/_to_delete/'],
};
