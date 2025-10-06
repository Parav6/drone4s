'use client';

import SOSButton from '@/components/SOSButton';
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

    const handleGuardDashboard = () => {
        router.push('/guardDashboard');
    };

    const handleSOSRedirect = () => {
        router.push('/sos');
    };

    const handleLocationsRedirect = () => {
        router.push('/locations');
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-gray-100">
                {/* Dashboard Features Section */}
                <div className="container mx-auto px-6 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 grid-cols-1 gap-6">
                            {/* Smart Navigation */}
                            <div className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Interactive Campus Map</h3>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                    View all important locations and alerts across the IITR campus in real-time. Navigate easily and stay informed about events, hazards, or announcements.
                                </p>
                                <button
                                    onClick={handleRedirect}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold shadow-lg text-sm"
                                >
                                    Go to Alert Map
                                </button>
                            </div>

                            {/* Parking Availability */}
                            <div className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1a2 2 0 00-2-2H8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Parking Availability</h3>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                    Check live parking status across the campus. See which slots are free and which are occupied, saving time and avoiding hassle.
                                </p>
                                <button
                                    onClick={handleLocationsRedirect}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg text-sm"
                                >
                                    Check Parking
                                </button>
                            </div>

                            {/* Garbage Monitoring */}
                            <div className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Smart Garbage Monitoring</h3>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                    Monitor garbage containers in real-time. Know which are full and which are empty to help maintain a clean and sustainable campus environment.
                                </p>
                                <button
                                    onClick={handleLocationsRedirect}
                                    className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg text-sm"
                                >
                                    Monitor Status
                                </button>
                            </div>

                            {/* Guard Dashboard - Show only for guards */}
                            {user?.role === 'guard' && (
                                <div className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">🛡️</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Guard Dashboard</h3>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                        Monitor active SOS alerts and respond to emergencies in your area. Track your location and help people in need.
                                    </p>
                                    <button
                                        onClick={handleGuardDashboard}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg text-sm"
                                    >
                                        Open Guard Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Emergency SOS Button - Fixed position */}
                <SOSButton />
            </div>
        </ProtectedRoute>
    );
}