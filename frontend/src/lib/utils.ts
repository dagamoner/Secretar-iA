import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEstadoBadgeClass(estado: string): string {
  switch (estado?.toUpperCase()) {
    case "DESPACHO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700";
    case "EN MANO":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700";
    case "FIRMADO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700";
    case "ARCHIVO":
      return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
    case "URGENTE":
    case "PRONTO DESPACHO":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700";
    default:
      return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700";
  }
}

export function getPrioridadBadgeClass(prioridad: string): string {
  switch (prioridad?.toUpperCase()) {
    case "URGENTE":
      return "bg-red-500 text-white font-bold animate-pulse";
    case "PRONTO DESPACHO":
      return "bg-orange-500 text-white font-semibold";
    default:
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}
