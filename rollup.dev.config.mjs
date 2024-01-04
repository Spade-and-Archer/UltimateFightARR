export default [
    {
        input: "src",
        watch: {
            include: 'src/**'
        },
        output: [
            {
                file: "dist/index.min.js",
                format: "cjs",
            },

        ]
    },
];
