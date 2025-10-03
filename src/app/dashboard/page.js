'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import UserProfile from '../../components/UserProfile';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { user } = useAuth();
    const router = useRouter();

    const handleRedirect = () => {
        router.push('/dashboard/alertMap');
    };

    return (
        <ProtectedRoute>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-lg p-6 w-100">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Smart Navigation</h3>
                    </div>
                    <p className="text-gray-600">
                        AI-powered route optimization that finds the fastest path to your destination,
                        considering real-time foot traffic and accessibility needs.
                    </p>
                    <button
                        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        onClick={handleRedirect}
                    >
                        Go to Alert Map
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );
}