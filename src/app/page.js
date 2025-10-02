"use client"

import { useFirebase } from "@/context/Firebase";
import AuthButton from "@/components/AuthButton";
import UserProfile from "@/components/UserProfile";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

export default function Home() {
  const { user, isAuthenticated, isAdmin } = useFirebase();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Firebase Google Authentication Demo
        </h1>

        {/* Authentication Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Authentication
          </h2>
          <AuthButton />
        </div>

        {/* Quick Navigation Section - Only show when authenticated */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Quick Navigation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="text-blue-600 text-2xl mb-2">📊</div>
                <h3 className="font-medium text-gray-900">Dashboard</h3>
                <p className="text-sm text-gray-600">View your personal dashboard</p>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="p-4 border border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <div className="text-red-600 text-2xl mb-2">👑</div>
                  <h3 className="font-medium text-gray-900">Admin Panel</h3>
                  <p className="text-sm text-gray-600">Manage users and settings</p>
                </Link>
              )}

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-gray-400 text-2xl mb-2">🔧</div>
                <h3 className="font-medium text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Section - Only show when authenticated */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              User Profile
            </h2>
            <UserProfile />
          </div>
        )}

        {/* Protected Content Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Protected Content
          </h2>
          <ProtectedRoute
            fallback={
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  This content is only available to authenticated users.
                </p>
                <p className="text-sm text-gray-500">
                  Please sign in with Google to view this section.
                </p>
              </div>
            }
          >
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                🎉 Welcome to the protected area!
              </h3>
              <p className="text-green-700">
                This content is only visible to authenticated users.
                You can now access all the features of the application.
              </p>
              <div className="mt-4 p-3 bg-white rounded border">
                <h4 className="font-medium text-gray-800 mb-2">User Details:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Name:</strong> {user?.displayName || 'Not provided'}</li>
                  <li><strong>Email:</strong> {user?.email}</li>
                  <li><strong>Role:</strong> {user?.role || 'user'}</li>
                  <li><strong>UID:</strong> {user?.uid}</li>
                  <li><strong>Email Verified:</strong> {user?.emailVerified ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            </div>
          </ProtectedRoute>
        </div>

        {/* Database & Role Features */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            🔥 Firebase Realtime Database Integration
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-blue-800">✅ New Features Added:</h3>
              <ul className="mt-2 space-y-1 text-blue-700">
                <li>• Automatic user profile creation in Realtime Database</li>
                <li>• Role-based access control (user, moderator, admin)</li>
                <li>• Real-time user data synchronization</li>
                <li>• Admin panel for user management</li>
                <li>• Persistent user roles and metadata</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">Database Structure:</h3>
              <code className="block bg-white p-3 rounded mt-1 text-xs text-gray-600">
                {`users/
  └── {uid}/
      ├── uid: string
      ├── email: string
      ├── displayName: string
      ├── photoURL: string
      ├── role: "user" | "moderator" | "admin"
      ├── createdAt: timestamp
      └── lastLogin: timestamp`}
              </code>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">Role-Based Access:</h3>
              <code className="block bg-white p-2 rounded mt-1 text-xs">
                {`const { isAdmin, isModerator, hasPermission } = useFirebase();`}
              </code>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            How to Use This Authentication System
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-700">1. Basic Authentication Check:</h3>
              <code className="block bg-white p-2 rounded mt-1 text-xs">
                {`const { user, isAuthenticated } = useFirebase();`}
              </code>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">2. Sign In/Out Functions:</h3>
              <code className="block bg-white p-2 rounded mt-1 text-xs">
                {`const { signInWithGoogle, logout } = useFirebase();`}
              </code>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">3. Protect Routes:</h3>
              <code className="block bg-white p-2 rounded mt-1 text-xs">
                {`<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>`}
              </code>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">4. Handle Loading States:</h3>
              <code className="block bg-white p-2 rounded mt-1 text-xs">
                {`const { loading, error } = useFirebase();`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
