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
          {/* Official Gobierno de Mendoza Logo */}
          <div className="mx-auto flex items-center justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mendoza-vertical.svg"
              alt="Gobierno de Mendoza"
              className="h-20 w-auto dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mendoza-vertical-white.svg"
              alt="Gobierno de Mendoza"
              className="h-20 w-auto hidden dark:block"
            />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-rem">
            Secretar<span className="text-[#000f9f] dark:text-[#3cb4e5]">·iA</span>
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            Secretaría Privada — Min. de Gobierno, Infraestructura y Desarrollo Territorial
          </p>
          <div className="mt-1.5 flex items-center justify-center space-x-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#000f9f] dark:bg-[#3cb4e5]" />
            <p className="text-[11px] font-semibold text-[#000f9f] dark:text-[#3cb4e5]">
              Sistema de Trazabilidad Documental y Despacho Ministerial
            </p>
          </div>
        </div>

        {/* Quick User Chips */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Acceso Rápido al Sistema:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPredefinedUser("vaninapardo")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                username === "vaninapardo"
                  ? "bg-[#000f9f] text-white dark:bg-[#3cb4e5] dark:text-slate-950"
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
            className="mt-2 flex w-full items-center justify-center space-x-2 rounded-lg bg-[#000f9f] py-2.5 font-bold text-white shadow-md shadow-[#000f9f]/20 hover:bg-[#000966] active:scale-95 disabled:opacity-50 transition cursor-pointer dark:bg-[#3cb4e5] dark:text-slate-950 dark:hover:bg-[#32a2cf]"
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
