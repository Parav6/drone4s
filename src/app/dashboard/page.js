'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import UserProfile from '../../components/UserProfile';
import { useAuth } from '../../hooks/useAuth';

// export default function Dashboard() {
//     const { user, signOut } = useAuth();

//     return (
//         <ProtectedRoute>
//             <div className="min-h-screen bg-gray-50">
//                 <div className="bg-white shadow">
//                     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                         <div className="flex justify-between items-center py-6">
//                             <h1 className="text-3xl font-bold text-gray-900">
//                                 Dashboard
//                             </h1>
//                             <button
//                                 onClick={signOut}
//                                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
//                             >
//                                 Sign Out
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//                     <div className="px-4 py-6 sm:px-0">
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                             {/* User Profile Card */}
//                             <div className="bg-white overflow-hidden shadow rounded-lg">
//                                 <div className="px-4 py-5 sm:p-6">
//                                     <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
//                                         Profile Information
//                                     </h3>
//                                     <UserProfile />
//                                 </div>
//                             </div>

//                             {/* Stats Card */}
//                             <div className="bg-white overflow-hidden shadow rounded-lg">
//                                 <div className="px-4 py-5 sm:p-6">
//                                     <h3 className="text-lg leading-6 font-medium text-gray-900">
//                                         Account Stats
//                                     </h3>
//                                     <div className="mt-4 space-y-3">
//                                         <div className="flex justify-between">
//                                             <span className="text-sm text-gray-600">Account Created:</span>
//                                             <span className="text-sm font-medium">
//                                                 {new Date().toLocaleDateString()}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span className="text-sm text-gray-600">Last Login:</span>
//                                             <span className="text-sm font-medium">
//                                                 {new Date().toLocaleDateString()}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span className="text-sm text-gray-600">Status:</span>
//                                             <span className="text-sm font-medium text-green-600">
//                                                 Active
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Quick Actions Card */}
//                             <div className="bg-white overflow-hidden shadow rounded-lg">
//                                 <div className="px-4 py-5 sm:p-6">
//                                     <h3 className="text-lg leading-6 font-medium text-gray-900">
//                                         Quick Actions
//                                     </h3>
//                                     <div className="mt-4 space-y-3">
//                                         <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border">
//                                             View Analytics
//                                         </button>
//                                         <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border">
//                                             Manage Settings
//                                         </button>
//                                         <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border">
//                                             Export Data
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Welcome Message */}
//                         <div className="mt-8 bg-white shadow rounded-lg">
//                             <div className="px-4 py-5 sm:p-6">
//                                 <h3 className="text-lg leading-6 font-medium text-gray-900">
//                                     Welcome back, {user?.displayName || user?.email}! 👋
//                                 </h3>
//                                 <p className="mt-2 text-sm text-gray-600">
//                                     This is your protected dashboard. Only authenticated users can access this page.
//                                     You can use this pattern to create any protected routes in your application.
//                                 </p>
//                                 <div className="mt-4 p-4 bg-blue-50 rounded-md">
//                                     <h4 className="text-sm font-medium text-blue-800">
//                                         Authentication Features Available:
//                                     </h4>
//                                     <ul className="mt-2 text-sm text-blue-700 space-y-1">
//                                         <li>✅ Google OAuth Sign-in</li>
//                                         <li>✅ Auto-persist authentication state</li>
//                                         <li>✅ Protected routes</li>
//                                         <li>✅ User profile management</li>
//                                         <li>✅ Error handling</li>
//                                         <li>✅ Loading states</li>
//                                     </ul>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </ProtectedRoute>
//     );
// }

export default function Dashboard() {
    // const { user, isAdmin } = useAuth();
    const { user } = useAuth();
    return (
        <ProtectedRoute>

        </ProtectedRoute>
    )
}

