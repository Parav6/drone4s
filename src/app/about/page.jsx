"use client"

import React from "react";
import Link from "next/link";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-green-600/20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,119,198,0.3),transparent_50%)]"></div>

                <div className="relative container mx-auto px-6 py-20">
                    <div className="max-w-6xl mx-auto text-center">
                        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-8 leading-tight">
                            About CampusNaksha
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto mb-12">
                            Your all-in-one smart campus companion designed to make campus life easier, safer, and more efficient at IITR.
                        </p>
                        <div className="flex justify-center">
                            <Link href="/dashboard" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-6 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Features</h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Discover how CampusNaksha revolutionizes your campus experience with cutting-edge technology
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
                        {/* Interactive Campus Map */}
                        <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Interactive Campus Map</h3>
                            </div>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                View all important locations and alerts across the IITR campus in real-time. Navigate easily and stay informed about events, hazards, or announcements.
                            </p>
                        </div>

                        {/* SOS Assistance */}
                        <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white">SOS Assistance</h3>
                            </div>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                In emergencies, share your location instantly and get help from the nearest campus security personnel assigned to assist you. Safety at your fingertips.
                            </p>
                        </div>

                        {/* Parking Availability */}
                        <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1a2 2 0 00-2-2H8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Parking Availability</h3>
                            </div>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                Check live parking status across the campus. See which slots are free and which are occupied, saving time and avoiding hassle.
                            </p>
                        </div>

                        {/* Garbage Monitoring */}
                        <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Smart Garbage Monitoring</h3>
                            </div>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                Monitor garbage containers in real-time. Know which are full and which are empty to help maintain a clean and sustainable campus environment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Technology Section */}
            <div className="bg-gray-800/30 py-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Technology</h2>
                            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                                Built with cutting-edge technology for a seamless experience
                            </p>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/50">
                            <div className="grid md:grid-cols-3 gap-12 text-center">
                                <div className="group">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-4">Real-time Databases</h3>
                                    <p className="text-gray-400">
                                        Instant data synchronization for live updates across all features
                                    </p>
                                </div>

                                <div className="group">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-4">IoT Sensors</h3>
                                    <p className="text-gray-400">
                                        Smart sensors for parking, garbage monitoring, and campus insights
                                    </p>
                                </div>

                                <div className="group">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-4">Advanced Mapping APIs</h3>
                                    <p className="text-gray-400">
                                        Precise location tracking and navigation with real-time accuracy
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20 backdrop-blur-sm py-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Ready to Explore Campus?
                        </h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Join thousands of students already using CampusNaksha to navigate IITR smarter and safer.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link href="/dashboard" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105">
                                Start Exploring
                            </Link>
                            <Link href="/sos" className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-10 py-4 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105">
                                Emergency SOS
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-800 py-12">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto text-center">
                        <h3 className="text-2xl font-bold text-white mb-4">CampusNaksha</h3>
                        <p className="text-gray-400 mb-6">Making IITR campus life easier, safer, and more efficient.</p>
                        <div className="flex justify-center space-x-6">
                            <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
                            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                            <Link href="/sos" className="text-gray-400 hover:text-white transition-colors">SOS</Link>
                            <Link href="/dashboard/parking" className="text-gray-400 hover:text-white transition-colors">Parking</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
