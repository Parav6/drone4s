"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebase } from "@/context/Firebase";
import { redirect } from "next/navigation";

const Navbar = () => {
    const pathname = usePathname();
    const { user, logout, loading, signInWithGoogle, signInWithGoogleRedirect, clearAuthState } = useFirebase();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [popupFailCount, setPopupFailCount] = useState(0);
    const dropdownRef = useRef(null);

    const handleSignOut = async () => {
        try {
            await logout();
            setIsDropdownOpen(false);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handleSignIn = async () => {
        if (isSigningIn) return; // Prevent multiple calls

        try {
            setIsSigningIn(true);

            // Clear any lingering auth state before new attempt
            clearAuthState();

            // If popup failed multiple times, try redirect
            if (popupFailCount >= 1) {
                console.log('Using redirect method due to popup failures');
                await signInWithGoogleRedirect();
                return;
            }

            // Add timeout for sign-in process
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Sign-in timeout')), 60000); // 60 second timeout
            });

            const signInPromise = signInWithGoogle();

            const result = await Promise.race([signInPromise, timeoutPromise]);

            if (result === null) {
                // User cancelled sign-in - increment fail count
                console.log('Sign-in was cancelled by user');
                setPopupFailCount(prev => prev + 1);
                return;
            }

            if (result) {
                console.log('Sign-in successful:', result.email);
                setPopupFailCount(0); // Reset on success
            }
        } catch (error) {
            console.error('Sign in error:', error);

            // Handle timeout
            if (error.message === 'Sign-in timeout') {
                console.log('Sign-in timed out');
                setPopupFailCount(prev => prev + 1);
                return;
            }

            // Check if popup-related error
            const popupErrors = ['popup-blocked', 'popup-closed', 'cancelled'];
            const isPopupError = popupErrors.some(keyword =>
                error.code?.includes(keyword) || error.message?.toLowerCase().includes(keyword)
            );

            if (isPopupError) {
                setPopupFailCount(prev => prev + 1);
                if (popupFailCount >= 1) {
                    const useRedirect = confirm('Popup sign-in seems to be blocked. Would you like to try a different method?');
                    if (useRedirect) {
                        setPopupFailCount(2); // Force redirect next time
                    }
                }
                return;
            }

            // Only show alert for actual errors, not cancellations
            const cancellationKeywords = ['cancelled', 'popup-closed', 'popup-blocked', 'timeout'];
            const isCancellation = cancellationKeywords.some(keyword =>
                error.code?.includes(keyword) || error.message?.toLowerCase().includes(keyword)
            );

            if (!isCancellation) {
                alert('Sign in failed. Please try again.');
            }
        } finally {
            setIsSigningIn(false);
            // Ensure clean state after any sign-in attempt
            redirect('/dashboard');
            setTimeout(() => clearAuthState(), 1000);
        }
    };

    const isActive = (path) => pathname === path;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Power off icon component
    const PowerOffIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    );

    // Dashboard icon component
    const DashboardIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2v3a2 2 0 01-2 2H9V7z" />
        </svg>
    );

    // About icon component
    const AboutIcon = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    return (
        <nav className="bg-gray-800 p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-2xl font-bold hover:text-gray-300 transition-colors">
                    CampusNaksha
                </Link>

                <div className="flex items-center space-x-6">
                    {/* Navigation Links */}
                    <div className="hidden md:flex space-x-4">
                        <Link
                            href="/about"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/about")
                                ? "text-white bg-gray-700"
                                : "text-gray-300 hover:text-white hover:bg-gray-700"
                                }`}
                        >
                            About CampusNaksha
                        </Link>

                        {/* Admin link - only show for admins */}
                        {user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/admin")
                                    ? "text-white bg-gray-700"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* User Section */}
                    <div className="flex items-center space-x-4">
                        {loading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : user ? (
                            <div className="relative" ref={dropdownRef}>
                                {/* Profile Picture with Dropdown Toggle */}
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full"
                                >
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="Profile"
                                            className="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-500 flex items-center justify-center text-white text-sm font-medium">
                                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                                        </div>
                                    )}
                                    {/* Dropdown Arrow */}
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                        <div className="py-2">
                                            {/* User Info */}
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <div className="flex items-center space-x-3">
                                                    {user.photoURL ? (
                                                        <img
                                                            src={user.photoURL}
                                                            alt="Profile"
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-medium">
                                                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {user.displayName || 'Anonymous User'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {user.email}
                                                        </p>
                                                        {user.role && (
                                                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${user.role === 'admin'
                                                                ? 'bg-red-100 text-red-800'
                                                                : user.role === 'moderator'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {user.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dashboard Link */}
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2 border-b border-gray-100"
                                            >
                                                <DashboardIcon />
                                                <span>Dashboard</span>
                                            </Link>

                                            {/* About Link - Mobile Only */}
                                            <Link
                                                href="/about"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="md:hidden w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2 border-b border-gray-100"
                                            >
                                                <AboutIcon />
                                                <span>About</span>
                                            </Link>

                                            {/* Logout Button */}
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                                            >
                                                <PowerOffIcon />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleSignIn}
                                disabled={isSigningIn}
                                className="flex items-center space-x-2 px-3 py-1 text-sm text-white border border-gray-600 rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSigningIn ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        <span>Sign in with Google</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;