'use client';

export function AnalysisSkeleton() {
  return (
    <div className="p-6 overflow-y-auto h-full animate-pulse">
      <div className="space-y-8">
        {/* Key Questions section skeleton */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-transparent">
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="space-y-3 list-none">
                  <div className="flex items-start gap-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  </div>
                </li>
              ))}
            </div>
          </div>
        </section>

        {/* Recommendations section skeleton */}
        <section>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-transparent">
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Analysis section skeleton */}
        <section>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-transparent">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-100 dark:border-transparent">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-100 dark:border-transparent">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 