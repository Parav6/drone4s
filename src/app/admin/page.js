'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import UserManagement from '../../components/UserManagement';
import { useAuth } from '../../hooks/useAuth';

export default function AdminPanel() {
    const { user, isAdmin, canManageUsers } = useAuth();

    if (!isAdmin) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                        <div className="text-red-500 text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                        <p className="text-gray-600 mb-4">
                            You need administrator privileges to access this page.
                        </p>
                        <p className="text-sm text-gray-500">
                            Current role: <span className="font-medium">{user?.role || 'user'}</span>
                        </p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Admin Panel
                                </h1>
                                <p className="text-gray-600">
                                    Manage users and system settings
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">
                                    Welcome, {user?.displayName || user?.email}
                                </span>
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Admin
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        {/* Admin Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">👥</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Total Users
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    Loading...
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">✅</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Active Users
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    Loading...
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">👑</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Admins
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    Loading...
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Management Section */}
                        <UserManagement />

                        {/* Admin Features */}
                        <div className="mt-8 bg-white rounded-lg shadow-md">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Admin Features</h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">User Management</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            View and manage all registered users, change roles and permissions.
                                        </p>
                                        <div className="flex items-center text-green-600">
                                            <span className="text-sm">✅ Active</span>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">Role Management</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Assign roles (user, moderator, admin) to control access levels.
                                        </p>
                                        <div className="flex items-center text-green-600">
                                            <span className="text-sm">✅ Active</span>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            View user engagement metrics and system statistics.
                                        </p>
                                        <div className="flex items-center text-yellow-600">
                                            <span className="text-sm">🚧 Coming Soon</span>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">Content Moderation</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Moderate user-generated content and manage reports.
                                        </p>
                                        <div className="flex items-center text-yellow-600">
                                            <span className="text-sm">🚧 Coming Soon</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Database Structure Info */}
                        <div className="mt-8 bg-blue-50 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-blue-900 mb-4">
                                Firebase Realtime Database Structure
                            </h3>
                            <div className="bg-white rounded-md p-4 font-mono text-sm">
                                <div className="text-gray-600">
                                    {`{
  "users": {
    "user_uid": {
      "uid": "string",
      "email": "string",
      "displayName": "string",
      "photoURL": "string",
      "emailVerified": boolean,
      "role": "user|moderator|admin",
      "createdAt": timestamp,
      "lastLogin": timestamp
    }
  }
}`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}