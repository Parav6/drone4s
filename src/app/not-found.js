'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="text-8xl font-bold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text mb-4">
                        404
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Page Not Found
                    </h1>
                    <p className="text-gray-400 text-lg mb-8">
                        Looks like you've wandered off the campus map! The page you're looking for doesn't exist.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        href="/dashboard"
                        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
                    >
                        Go to Dashboard
                    </Link>

                    <Link
                        href="/about"
                        className="block w-full bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-semibold border border-gray-600"
                    >
                        Learn About CampusNaksha
                    </Link>

                    <button
                        onClick={() => router.back()}
                        className="block w-full bg-transparent text-gray-400 px-6 py-3 rounded-xl hover:text-white transition-all duration-300 font-semibold border border-gray-600 hover:border-gray-400"
                    >
                        Go Back
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        Need help? Contact the CampusNaksha team
                    </p>
                </div>
            </div>
        </div>
    )
}