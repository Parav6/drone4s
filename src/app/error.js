'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('CampusNaksha Error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Something went wrong!
                    </h1>
                    <p className="text-gray-400 text-lg mb-2">
                        CampusNaksha encountered an unexpected error.
                    </p>
                    <p className="text-gray-500 text-sm mb-8">
                        Error ID: {error.digest}
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={reset}
                        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
                    >
                        Try Again
                    </button>

                    <Link
                        href="/dashboard"
                        className="block w-full bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-semibold border border-gray-600"
                    >
                        Go to Dashboard
                    </Link>

                    <Link
                        href="/"
                        className="block w-full bg-transparent text-gray-400 px-6 py-3 rounded-xl hover:text-white transition-all duration-300 font-semibold border border-gray-600 hover:border-gray-400"
                    >
                        Go Home
                    </Link>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        If this problem persists, please contact our support team.
                    </p>
                </div>
            </div>
        </div>
    )
}