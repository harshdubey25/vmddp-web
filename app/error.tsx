'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>

            <p className="mb-6 text-red-600">{error.message}</p>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}