'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../context/Firebase';

const UserManagement = () => {
    const { getAllUsers, updateUserRole, isAdmin, user } = useFirebase();
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        }
    }, [isAdmin]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const allUsers = await getAllUsers();
            setUsers(allUsers || {});
        } catch (error) {
            setError('Failed to load users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (uid, newRole) => {
        try {
            await updateUserRole(uid, newRole);
            // Refresh users list
            await loadUsers();
        } catch (error) {
            setError('Failed to update user role');
            console.error(error);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-red-300">Access denied. Admin privileges required.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
                <span className="ml-2 text-gray-300">Loading users...</span>
            </div>
        );
    }

    const usersList = Object.values(users).filter(u => u.uid !== user?.uid);

    return (
        <div>
            <div className="px-6 py-4 border-b border-gray-600">
                <h2 className="text-xl font-semibold text-gray-100">User Management</h2>
                <p className="text-sm text-gray-300">Manage user roles and permissions</p>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-700 rounded-md">
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            <div className="p-6">
                {usersList.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No other users found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-600">
                                {usersList.map((userData) => (
                                    <tr key={userData.uid}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {userData.photoURL && (
                                                    <img
                                                        className="h-10 w-10 rounded-full mr-3"
                                                        src={userData.photoURL}
                                                        alt="Profile"
                                                    />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-100">
                                                        {userData.displayName || 'Anonymous'}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {userData.uid ? `${userData.uid.substring(0, 8)}...` : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                            {userData.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userData.role === 'admin'
                                                ? 'bg-red-100 text-red-800'
                                                : userData.role === 'moderator'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : userData.role === 'guard'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                {userData.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {userData.createdAt
                                                ? new Date(userData.createdAt).toLocaleDateString()
                                                : 'Unknown'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <select
                                                value={userData.role || 'user'}
                                                onChange={(e) => handleRoleChange(userData.uid, e.target.value)}
                                                className="bg-gray-700 border border-gray-600 text-gray-100 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="user">User</option>
                                                <option value="guard">Guard</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-900/20 rounded-md border border-blue-700">
                    <h3 className="text-sm font-medium text-blue-300 mb-2">Role Descriptions:</h3>
                    <ul className="text-sm text-blue-200 space-y-1">
                        <li><strong>User:</strong> Default role with basic access</li>
                        <li><strong>Guard:</strong> Security personnel who can respond to SOS alerts</li>
                        <li><strong>Admin:</strong> Full access to all features and user management</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;