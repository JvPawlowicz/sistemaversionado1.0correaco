/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            }
        ],
    },
    // This is the key part for Firebase config.
    // It safely checks if FIREBASE_WEBAPP_CONFIG exists before passing it.
    env: {
        NEXT_PUBLIC_FIREBASE_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG || '',
    }
};

export default nextConfig;
