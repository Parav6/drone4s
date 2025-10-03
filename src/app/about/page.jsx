import React from "react";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            About CampusNaksha
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
                            Revolutionizing campus navigation with cutting-edge drone technology and intelligent mapping solutions
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">

                    {/* Mission Section */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our Mission</h2>
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <p className="text-lg text-gray-700 leading-relaxed mb-6">
                                CampusNaksha is dedicated to transforming how students, faculty, and visitors navigate educational institutions.
                                We leverage advanced drone technology, real-time mapping, and intelligent route optimization to create
                                seamless navigation experiences across university campuses.
                            </p>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Our platform eliminates the confusion of finding classrooms, facilities, and points of interest,
                                making campus life more efficient and accessible for everyone.
                            </p>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">What We Offer</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-lg shadow-lg p-6">
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
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6m8-6v6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">Drone Mapping</h3>
                                </div>
                                <p className="text-gray-600">
                                    High-resolution aerial mapping using advanced drone technology to create
                                    accurate, up-to-date campus layouts and 3D visualizations.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">Mobile First</h3>
                                </div>
                                <p className="text-gray-600">
                                    Responsive design optimized for mobile devices, ensuring seamless navigation
                                    whether you're walking across campus or planning your route.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800">Real-time Updates</h3>
                                </div>
                                <p className="text-gray-600">
                                    Live updates on building accessibility, construction zones, events, and
                                    temporary route changes to keep your journey smooth.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Technology Section */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our Technology</h2>
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="grid md:grid-cols-3 gap-8 text-center">
                                <div>
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">AI & Machine Learning</h3>
                                    <p className="text-gray-600 text-sm">
                                        Advanced algorithms for route optimization and predictive navigation
                                    </p>
                                </div>
                                <div>
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Cloud Infrastructure</h3>
                                    <p className="text-gray-600 text-sm">
                                        Scalable cloud services ensuring reliability and performance
                                    </p>
                                </div>
                                <div>
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Security & Privacy</h3>
                                    <p className="text-gray-600 text-sm">
                                        End-to-end encryption and privacy-first data handling
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8">Get In Touch</h2>
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <p className="text-lg text-gray-700 mb-6">
                                Ready to revolutionize navigation at your campus? We'd love to hear from you.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <a
                                    href="mailto:contact@campusnaksha.com"
                                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Contact Us
                                </a>
                                <a
                                    href="#"
                                    className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    Learn More
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
