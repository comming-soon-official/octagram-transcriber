/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const isDev = process.env.NODE_ENV === 'development';
        const destination = isDev
            ? 'http://localhost:8000/api/:path*'
            : 'https://octagram-transcriber-production.up.railway.app/api/:path*';

        return [
            {
                source: '/api/:path*',
                destination: destination,
            }
        ];
    }
};

module.exports = nextConfig;
