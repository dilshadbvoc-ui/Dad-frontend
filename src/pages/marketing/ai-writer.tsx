;

export default function AiWriterPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                AI Content Writer
                            </h1>
                            <p className="text-gray-500">Generate marketing content with AI.</p>
                        </div>
                        <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-900/50 rounded-lg border border-dashed">
                            AI Writer Module Coming Soon
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
