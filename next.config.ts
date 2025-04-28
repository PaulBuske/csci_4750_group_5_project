/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: false,
        tsconfigPath: './tsconfig.json',
    },
    webpack: (config) => {
        config.resolve.extensionAlias = {
            '.js': ['.js', '.ts', '.tsx'],
            '.jsx': ['.jsx', '.tsx'],
        };
        return config;
    },
    turbopack: {
        resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    },
};

export default nextConfig;