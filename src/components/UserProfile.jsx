'use client';

import { useFirebase } from '../context/Firebase';

const UserProfile = () => {
    const { user, loading } = useFirebase();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-4 text-center text-gray-500">
                No user signed in
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-600">
            <div className="px-6 py-4">
                <div className="flex items-center">
                    {user.photoURL && (
                        <img
                            className="h-16 w-16 rounded-full object-cover mr-4"
                            src={user.photoURL}
                            alt="Profile"
                        />
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-gray-100">
                            {user.displayName || 'Anonymous User'}
                        </h2>
                        <p className="text-gray-300">{user.email}</p>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-200">Role:</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : user.role === 'moderator'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                            {user.role || 'user'}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-medium text-gray-200">User ID:</span>
                        <span className="text-gray-300 text-sm font-mono">
                            {user.uid.substring(0, 8)}...
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-medium text-gray-200">Email Verified:</span>
                        <span className={`text-sm ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                            {user.emailVerified ? 'Yes' : 'No'}
                        </span>
                    </div>

                    {user.createdAt && (
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-200">Member Since:</span>
                            <span className="text-gray-300 text-sm">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    {user.lastLogin && (
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-200">Last Login:</span>
                            <span className="text-gray-300 text-sm">
                                {new Date(user.lastLogin).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;