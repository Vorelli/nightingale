export default {
  roots: ["src"],
  testMatch: ["**/?(*.)+(spec|test).ts"],
  extensionsToTreatAsEsm: [".ts"],
  preset: "ts-jest",
  resolver: "ts-jest-resolver",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
