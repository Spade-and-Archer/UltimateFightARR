import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.min.js",
                format: "cjs",
                plugins: [terser()],
            },
            {
                file: "dist/index.dev.js",
                format: "cjs",
                sourcemap: true,
            },
        ],

        plugins: [typescript()],
    },
];