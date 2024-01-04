/* eslint-disable import/no-commonjs */
/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest/presets/js-with-ts",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    "transformIgnorePatterns": [
        "node_modules/(?!variables/.*)"
    ],
    testPathIgnorePatterns: ["<rootDir>/dist/", "node_modules"],
    moduleDirectories: ["node_modules", "<rootdir>/src/"],
    setupFiles: ['dotenv/config'],
    collectCoverage: true,
    coverageDirectory: "coverage",
    extensionsToTreatAsEsm: ['.ts'],
    "moduleNameMapper": {
        '^utils/(.*)$': '<rootDir>/src/utils$1',
        '^models/(.*)$': '<rootDir>/src/models$1',
        '^deviceCommunication/(.*)$': '<rootDir>/src/deviceCommunication/$1',
        '^utils$': '<rootDir>/src/utils',
        '^dbConnector$': '<rootDir>/src/dbConnector',
        '^models': '<rootDir>/src/models',
    },
    "transform": {
        "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest"
    },
    testTimeout: 2000000
};
