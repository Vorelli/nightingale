export default {
    roots: ["src"],
    testMatch: ["**/?(*.)+(spec|test).(ts|tsx)"],
    extensionsToTreatAsEsm: [".ts"],
    preset: "ts-jest",
    resolver: "ts-jest-resolver",
    transform: {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                useESM: true
            }
        ]
    }
};
