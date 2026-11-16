"use client";

import React, { useState } from "react";
import { loginUser } from "@/lib/api";
import { Usuario } from "@/types";
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Por favor ingresa usuario y contraseña");
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(username.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || "Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  const setPredefinedUser = (userKey: string) => {
    setUsername(userKey);
    setPassword(""); // NUNCA precargar la contraseña: debe ingresarla la secretaria
    setErrorMsg("");
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 antialiased">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        {/* Brand & Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Secretar<span className="text-blue-600 dark:text-blue-400">·iA</span>
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            Secretaría Privada — Ministerio de Gobierno
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Sistema de Trazabilidad Documental y Despacho
          </p>
        </div>

        {/* Quick User Chips */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center dark:border-blue-950 dark:bg-blue-950/30">
          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Acceso Rápido al Sistema:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPredefinedUser("vaninapardo")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                username === "vaninapardo"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
              }`}
            >
              👩‍💼 Vanina Pardo
            </button>
            <button
              type="button"
              onClick={() => setPredefinedUser("betianasalinas")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                username === "betianasalinas"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
              }`}
            >
              👩‍💼 Betiana Salinas
            </button>
            <button
              type="button"
              onClick={() => setPredefinedUser("admin")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                username === "admin"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
              }`}
            >
              🛠️ Administrador
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center space-x-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Usuario / Nombre *
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="vaninapardo, betianasalinas o admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                required
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 py-2.5 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition"
          >
            <span>{isLoading ? "Validando credenciales..." : "Ingresar al Sistema"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400 dark:border-slate-800">
          🔒 Acceso restringido y auditado por normativa oficial
        </div>
      </div>
    </div>
  );
}
