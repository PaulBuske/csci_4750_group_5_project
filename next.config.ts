/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: false,
        tsconfigPath: './tsconfig.json',
    },
    webpack: (config) => {
        // Allow importing .ts files with the extension specified
        config.resolve.extensionAlias = {
            '.js': ['.js', '.ts', '.tsx'],
            '.jsx': ['.jsx', '.tsx'],
        };
        return config;
    },
};

export default nextConfig;