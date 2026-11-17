"use client";

import React from "react";

export function TableSkeletonLoader({ rows = 12 }: { rows?: number }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white p-4 dark:bg-slate-950 animate-pulse">
      {/* Fake Toolbar metrics skeleton */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-7 w-48 rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>

      {/* Fake Table Header */}
      <div className="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60 rounded-t-lg">
        <div className="col-span-1 h-3.5 w-10 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="col-span-1 h-3.5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="col-span-3 h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="col-span-1 h-3.5 w-14 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="col-span-3 h-3.5 w-44 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="col-span-1 h-3.5 w-14 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="col-span-2 h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-700 ml-auto" />
      </div>

      {/* Fake Table Rows with shimmer lines */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-3 items-center px-4 py-3"
            style={{ opacity: Math.max(0.2, 1 - i * 0.06) }}
          >
            {/* Priority */}
            <div className="col-span-1">
              <div className="h-4 w-8 rounded bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Date */}
            <div className="col-span-1">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Expediente ID */}
            <div className="col-span-3">
              <div className="h-3.5 w-44 rounded bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Type badge */}
            <div className="col-span-1">
              <div className="h-4 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Carátula */}
            <div className="col-span-3 space-y-1">
              <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Status pill */}
            <div className="col-span-1">
              <div className="h-4 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Action button */}
            <div className="col-span-2 flex justify-end">
              <div className="h-6 w-14 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
