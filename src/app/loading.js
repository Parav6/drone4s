export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="relative">
                    {/* Animated logo or spinner */}
                    <div className="w-20 h-20 mx-auto mb-8">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent"></div>
                    </div>

                    {/* Loading text */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">
                            Loading CampusNaksha
                        </h2>
                        <p className="text-gray-400">
                            Preparing your campus experience...
                        </p>

                        {/* Animated dots */}
                        <div className="flex justify-center space-x-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}