'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import UserManagement from '../../components/UserManagement';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
    const { user, isAdmin, canManageUsers } = useAuth();
    const router = useRouter();

    // if (!isAdmin) {
    //     return (
    //         <ProtectedRoute>
    //             <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    //                 <div className="bg-gray-800 p-8 rounded-lg shadow-md text-center border border-gray-700">
    //                     <div className="text-red-500 text-6xl mb-4">🚫</div>
    //                     <h1 className="text-2xl font-bold text-gray-100 mb-2">Access Denied</h1>
    //                     <p className="text-gray-300 mb-4">
    //                         You need administrator privileges to access this page.
    //                     </p>
    //                     <p className="text-sm text-gray-400">
    //                         Current role: <span className="font-medium text-gray-200">{user?.role || 'user'}</span>
    //                     </p>
    //                 </div>
    //             </div>
    //         </ProtectedRoute>
    //     );
    // }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-gray-100">
                <div className="container mx-auto px-6 py-12">
                    <div className="max-w-6xl mx-auto">
                        {/* Verify Alerts Button */}
                        <div className="flex justify-center mb-12">
                            <button
                                onClick={() => router.push('/admin/alertMap')}
                                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                🚨 Verify Alerts
                            </button>
                        </div>

                        {/* User Management Section */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                            <UserManagement />
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}