import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowRight,
  Sparkles,
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  Moon,
  ShieldCheck,
  TrendingUp,
  Award,
  Play,
  Sun,
  CheckCheck,
  RotateCcw,
  Compass,
} from 'lucide-react';

export interface PurposeLandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  isDark: boolean;
}

export default function PurposeLandingModal({
  isOpen,
  onClose,
  onOpenRegister,
  onOpenLogin,
  isDark,
}: PurposeLandingModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border ${
            isDark
              ? 'bg-[#121A20] text-[#E7EEF2] border-[#2B3A45]'
              : 'bg-[#FFFFFF] text-[#1B2A33] border-[#DDE4E9]'
          }`}
        >
          {/* Barra superior fija con Logo, Acción rápida y Cerrar */}
          <header
            className={`sticky top-0 z-30 px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 border-b backdrop-blur-xl shrink-0 ${
              isDark
                ? 'bg-[#121A20]/95 border-[#2B3A45]'
                : 'bg-[#FFFFFF]/95 border-[#DDE4E9]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#3B4CCA] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                H
              </div>
              <div className="min-w-0">
                <span className="font-extrabold tracking-tight text-sm">
                  HOY
                </span>
                <span className="hidden xs:inline text-xs text-[var(--mute)] ml-1.5 font-medium">
                  · Sistema Diario
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="flex min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#15803D] to-[#0F766E] hover:from-[#166534] hover:to-[#115E59] text-white text-[11px] sm:text-xs font-black items-center gap-1 shadow-sm cursor-pointer transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>7 días gratis</span>
              </button>

              <button
                onClick={onClose}
                aria-label="Cerrar ventana"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40 cursor-pointer transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Contenido con scroll optimizado para móvil */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 sm:px-8 py-5 sm:py-8 space-y-7 sm:space-y-10 pb-24 sm:pb-8">
            {/* HERO SECTION: Titular y Promesa de Valor */}
            <section className="text-center space-y-3.5 max-w-xl mx-auto pt-1 sm:pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#15803D]/12 text-[#15803D] dark:text-[#4ADE80] border border-[#15803D]/25">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>EL ANTÍDOTO CONTRA EL FAMOSO &ldquo;DESPUÉS&rdquo;</span>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug sm:leading-tight">
                Rompe el &ldquo;después lo hago&rdquo;.{' '}
                <span className="text-[#3B4CCA] dark:text-[#7F8DF2]">
                  Comienza a avanzar hoy
                </span>{' '}
                en lo que dejaste a medias.
              </h1>

              <p className="text-xs sm:text-base text-[var(--mute)] leading-relaxed font-normal">
                Siempre postergamos por el famoso <em>&ldquo;después lo hago&rdquo;</em> o dejamos cosas en el tintero que nunca iniciamos por no saber exactamente cómo. HOY es el <strong>sistema diario de organización y rutinas</strong> diseñado para darte claridad radical, desbloquear tus pendientes y avanzar 1 día a la vez sin abrumarte.
              </p>

              {/* Botón CTA Superior */}
              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenRegister();
                  }}
                  className="w-full sm:w-auto min-h-[48px] sm:min-h-[50px] px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-[#15803D] to-[#0F766E] hover:from-[#166534] hover:to-[#115E59] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer transition active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Comenzar mis 7 días gratis</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[46px] px-4 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] hover:border-[var(--acc)] cursor-pointer transition"
                >
                  Ya soy socio · Iniciar sesión
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] text-[var(--mute)]">
                Acceso completo inmediato · Sin tarjeta · 7 días sin compromiso
              </p>
            </section>

            {/* SECCIÓN 1: La trampa del "Después" vs El Desbloqueo HOY */}
            <section className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#3B4CCA] dark:text-[#7F8DF2]">
                  La Verdad Detrás de la Procrastinación
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  ¿Por qué dejamos las cosas para &ldquo;después&rdquo;?
                </h2>
                <p className="text-xs text-[var(--mute)]">
                  No es falta de ganas: nos paralizamos cuando no sabemos cómo empezar o cuando una meta parece inmensa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* La trampa del después */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between space-y-3 ${
                    isDark
                      ? 'bg-red-500/8 border-red-500/20'
                      : 'bg-red-50/80 border-red-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-red-500 font-extrabold text-xs sm:text-sm">
                      <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                        <X className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span>La trampa del &ldquo;Después lo hago&rdquo;</span>
                    </div>

                    {/* MOCKUP VISUAL: El ciclo de postergación */}
                    <div
                      className={`p-3 rounded-2xl border space-y-1.5 text-xs ${
                        isDark
                          ? 'bg-[#121A20] border-red-500/25'
                          : 'bg-white border-red-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-red-500 pb-1 border-b border-red-500/20">
                        <span>El ciclo que nos estanca</span>
                        <span className="font-mono bg-red-500/10 px-1.5 py-0.5 rounded text-[10px]">
                          Postergado
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-red-500/5 text-[11px] flex items-center justify-between text-[var(--mute)]">
                        <span>1. &ldquo;Quiero iniciar pero parece mucho o confuso&rdquo;</span>
                        <span className="text-[10px] text-red-400 font-bold shrink-0">Duda</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-red-500/5 text-[11px] flex items-center justify-between text-[var(--mute)]">
                        <span>2. &ldquo;Mejor después cuando tenga más tiempo&rdquo;</span>
                        <span className="text-[10px] text-red-400 font-bold shrink-0">Excusa</span>
                      </div>
                      <div className="text-[10px] text-center text-red-500/90 font-bold pt-0.5">
                        ⚠️ Pasan los meses, la tarea sigue en cero y la culpa crece
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    ❌ El &ldquo;después&rdquo; nunca llega. Terminas frustrado sin haber iniciado.
                  </p>
                </div>

                {/* El Desbloqueo HOY */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between space-y-3 ${
                    isDark
                      ? 'bg-emerald-500/8 border-emerald-500/25'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[#15803D] dark:text-[#4ADE80] font-extrabold text-xs sm:text-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span>El desbloqueo inmediato de HOY</span>
                    </div>

                    {/* MOCKUP VISUAL: Avance diario concreto */}
                    <div
                      className={`p-3 rounded-2xl border space-y-1.5 text-xs ${
                        isDark
                          ? 'bg-[#121A20] border-emerald-500/25'
                          : 'bg-white border-emerald-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#15803D] dark:text-[#4ADE80] pb-1 border-b border-emerald-500/20">
                        <span>La solución psicológica</span>
                        <span className="font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Acción hoy
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-[11px] flex items-center justify-between text-[var(--ink)] font-bold">
                        <span className="flex items-center gap-1.5">
                          <span>🎯</span> 1 Solo paso visible de 25 min
                        </span>
                        <span className="text-[10px] text-[#15803D] dark:text-[#4ADE80] font-black shrink-0">
                          SIN CONFUSIÓN
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-500/5 text-[11px] flex items-center justify-between text-[var(--mute)]">
                        <span className="flex items-center gap-1.5">
                          <span>⚡</span> Regla 5-4-3-2-1 para arrancar ya
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold shrink-0">✓ Disparado</span>
                      </div>
                      <div className="text-[10px] text-center text-[#15803D] dark:text-[#4ADE80] font-bold pt-0.5">
                        ✨ Avanzas todos los días en lo que tenías estancado
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#15803D] dark:text-[#4ADE80] font-semibold">
                    ✅ No necesitas resolver todo el proyecto: solo haces el paso de hoy.
                  </p>
                </div>
              </div>
            </section>

            {/* SECCIÓN NUEVA: Finalidad de la App y Beneficios Concretos */}
            <section className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#3B4CCA] dark:text-[#7F8DF2]">
                  Finalidad & Propósito
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  ¿Cómo te ayuda HOY en tu día a día?
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mute)]">
                  Las 4 formas específicas en que la app te saca de la parálisis y organiza tu vida:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Beneficio 1 */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 transition ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#3B4CCA]/12 text-[#3B4CCA] dark:text-[#7F8DF2] flex items-center justify-center font-bold">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    1. Avanzas en lo que dejaste a medias
                  </h3>
                  <p className="text-xs text-[var(--mute)] leading-relaxed font-normal">
                    Ese negocio, ese curso, ese libro o ese pendiente que vienes posponiendo hace meses. HOY lo rescata del olvido y lo pone en marcha con un solo bloque diario sin fricción.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#3B4CCA] dark:text-[#7F8DF2]">
                    <span>🎯 Dejar atrás el &ldquo;algún día lo termino&rdquo;</span>
                  </div>
                </div>

                {/* Beneficio 2 */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 transition ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#15803D]/12 text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    2. ¿No sabes cómo hacerlo? Solo haz el paso de hoy
                  </h3>
                  <p className="text-xs text-[var(--mute)] leading-relaxed font-normal">
                    Cuando una meta parece inmensa no sabemos por dónde empezar y la mente prefiere huir al &ldquo;después&rdquo;. HOY elimina la confusión exigiéndote un único paso visible de 25 minutos.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                    <span>🧩 1 solo paso visible reemplaza 100 dudas</span>
                  </div>
                </div>

                {/* Beneficio 3 */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 transition ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/12 text-amber-500 flex items-center justify-center font-bold">
                    <Sun className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    3. Creas rutinas diarias sin fuerza de voluntad
                  </h3>
                  <p className="text-xs text-[var(--mute)] leading-relaxed font-normal">
                    Tu rutina matutina (agua, lectura, ejercicio y meditación) te da estructura antes de que el celular o las urgencias te roben el día. La disciplina se vuelve automática, no forzada.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <span>⚡ Ganas tu primera hora y ganas el día</span>
                  </div>
                </div>

                {/* Beneficio 4 */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 transition ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/12 text-purple-400 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    4. El fin definitivo de la trampa del &ldquo;después&rdquo;
                  </h3>
                  <p className="text-xs text-[var(--mute)] leading-relaxed font-normal">
                    La regla 5-4-3-2-1 y los bloques de enfoque entrenan a tu cerebro para accionar en el momento. Y al llegar las 9 PM, organizas mañana en 10 segundos y te vas a dormir en paz.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    <span>🌙 Cero culpa nocturna y mente despejada</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: Los 4 Pilares Específicos del Sistema (Ultra Visual) */}
            <section className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#3B4CCA] dark:text-[#7F8DF2]">
                  Metodología Comprobada
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Los 4 pilares específicos de HOY
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mute)]">
                  Diseñado para proteger tu energía mental y disparar tu ejecución:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pilar 1: Rutina de Arranque Matutina */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/12 text-amber-500 flex items-center justify-center font-bold">
                        <Sun className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                          1. Rutina de Arranque Matutina
                        </h3>
                        <span className="text-[11px] text-[var(--mute)]">
                          06:30 AM · Primera hora sin pantallas
                        </span>
                      </div>
                    </div>

                    {/* MINI UI MOCKUP: Rutina física interactiva visual */}
                    <div
                      className={`p-3 rounded-2xl border space-y-2 text-xs ${
                        isDark
                          ? 'bg-[#121A20] border-[#26353F]'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-[var(--mute)] pb-1 border-b border-[var(--line)]/50">
                        <span>Hábitos clave al despertar</span>
                        <span className="text-[#15803D] dark:text-[#4ADE80] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>100% Listo</span>
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between p-1.5 rounded-xl bg-emerald-500/10 text-[var(--ink)]">
                          <span className="flex items-center gap-2 font-semibold">
                            <span>💧</span> Agua y tender cama
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                            <span>6:30</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 rounded-xl bg-emerald-500/10 text-[var(--ink)]">
                          <span className="flex items-center gap-2 font-semibold">
                            <span>🧘</span> Meditar 5 min
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                            <span>6:35</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-1.5 rounded-xl bg-emerald-500/10 text-[var(--ink)]">
                          <span className="flex items-center gap-2 font-semibold">
                            <span>⚡</span> Ejercicio en casa (10 min)
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                            <span>6:55</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso visual */}
                      <div className="pt-1">
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#15803D] to-[#0F766E] w-full rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--mute)] pt-3 font-medium leading-relaxed">
                    🎯 <strong>Ganas tu mañana:</strong> Activas tu mente en modo ganador cumpliendo antes de tocar redes o noticias.
                  </p>
                </div>

                {/* Pilar 2: Enfoque Mono-Tarea */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#15803D]/12 text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center font-bold">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                          2. Enfoque Mono-Tarea
                        </h3>
                        <span className="text-[11px] text-[var(--mute)]">
                          1 solo proyecto activo a la vez
                        </span>
                      </div>
                    </div>

                    {/* MINI UI MOCKUP: Pipeline Kanban con 1 sola activa */}
                    <div
                      className={`p-3 rounded-2xl border space-y-2 text-xs ${
                        isDark
                          ? 'bg-[#121A20] border-[#26353F]'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      {/* Pestañas de estado */}
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-center">
                        <span className="text-[var(--mute)] py-0.5">Ideas (4)</span>
                        <span className="bg-[#3B4CCA] text-white rounded-lg py-0.5 shadow-sm">
                          Haciendo (1)
                        </span>
                        <span className="text-[var(--mute)] py-0.5">Terminado</span>
                      </div>

                      {/* Tarjeta del proyecto en ejecución */}
                      <div className="p-2.5 rounded-xl border border-[#3B4CCA]/30 bg-[#3B4CCA]/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[var(--ink)] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Lanzamiento de Sistema
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#3B4CCA] text-white">
                            EN MARCHA
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[11px] flex items-center gap-2 text-[var(--ink)] font-medium">
                          <span className="text-[#3B4CCA] font-bold">👉 Siguiente paso:</span>
                          <span className="truncate">Ejecutar bloque de 25 min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--mute)] pt-3 font-medium leading-relaxed">
                    🧠 <strong>Cero parálisis:</strong> Sin 20 proyectos a medias. Solo una meta activa con su paso inmediato claro.
                  </p>
                </div>

                {/* Pilar 3: Regla 5-4-3-2-1 y Hazlo */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/12 text-amber-500 flex items-center justify-center font-bold">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                          3. Regla 5-4-3-2-1 y Hazlo
                        </h3>
                        <span className="text-[11px] text-[var(--mute)]">
                          Cronómetro de disparo inmediato
                        </span>
                      </div>
                    </div>

                    {/* MINI UI MOCKUP: Contador regresivo y botón Hazlo */}
                    <div
                      className={`p-3 rounded-2xl border space-y-2.5 text-xs ${
                        isDark
                          ? 'bg-[#121A20] border-[#26353F]'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      {/* Secuencia 5-4-3-2-1 */}
                      <div className="flex items-center justify-center gap-2 pt-0.5">
                        {['5', '4', '3', '2', '1'].map((num, i) => (
                          <span
                            key={num}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                              i === 4
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md scale-110'
                                : 'bg-slate-100 dark:bg-slate-800 text-[var(--mute)] font-bold'
                            }`}
                          >
                            {num}
                          </span>
                        ))}
                      </div>

                      {/* Widget timer */}
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                              Bloque en progreso
                            </div>
                            <div className="font-mono font-extrabold text-sm text-[var(--ink)]">
                              25:00 min
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          ¡Hazlo ya!
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--mute)] pt-3 font-medium leading-relaxed">
                    ⚡ <strong>Acción en 5 segundos:</strong> Disparas el trabajo antes de que tu mente dude o invente excusas.
                  </p>
                </div>

                {/* Pilar 4: Cierre Nocturno a las 9 PM */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
                    isDark
                      ? 'bg-[#182229] border-[#2B3A45]'
                      : 'bg-[#F9FBFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/12 text-purple-400 flex items-center justify-center font-bold">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                          4. Cierre Nocturno a las 9 PM
                        </h3>
                        <span className="text-[11px] text-[var(--mute)]">
                          Organiza tu mañana en 10 segundos
                        </span>
                      </div>
                    </div>

                    {/* MINI UI MOCKUP: Alerta de cierre de jornada */}
                    <div
                      className={`p-3 rounded-2xl border space-y-2 text-xs ${
                        isDark
                          ? 'bg-[#121A20] border-[#26353F]'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>21:00 PM · Cierre del Día</span>
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--mute)]">
                          10 seg
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-[var(--ink)]">
                        &ldquo;¿Dejamos todo igual o lo organizamos?&rdquo;
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div className="p-1.5 rounded-lg border border-[var(--line)] text-center text-[10px] font-bold text-[var(--mute)]">
                          Dejar igual
                        </div>
                        <div className="p-1.5 rounded-lg bg-purple-600 text-white text-center text-[10px] font-extrabold shadow-sm flex items-center justify-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Listo para mañana</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--mute)] pt-3 font-medium leading-relaxed">
                    🌙 <strong>Descanso real:</strong> Duermes en paz sabiendo exactamente qué harás al despertar. Sin ruido mental.
                  </p>
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: ¿Qué obtienes con tu Prueba de 7 Días Gratis? */}
            <section
              className={`p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-gradient-to-b from-[#1B262E] to-[#162027] border-[#2B3A45]'
                  : 'bg-gradient-to-b from-[#F2F5F7] to-[#FFFFFF] border-[#DDE4E9]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#15803D] text-white flex items-center justify-center font-black">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold">
                    Tu acceso completo por 7 días incluye:
                  </h3>
                  <p className="text-xs text-[var(--mute)]">
                    Prueba el 100% de la experiencia sin restricciones
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Rutina semanal y domingo totalmente personalizables</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Sincronización en la nube con tu cuenta de WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Notificaciones Web Push y recordatorios de horario</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Reporte de progreso visual descargable en PDF con tu nombre</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Emblema inspirador y 6 colores de perfil para tu app</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Instalable en tu celular como aplicación nativa (PWA)</span>
                </div>
              </div>
            </section>

            {/* SECCIÓN 4: Preguntas Frecuentes (FAQ estilo Landing) */}
            <section className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#3B4CCA] dark:text-[#7F8DF2]">
                  Resuelve tus dudas
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Preguntas Frecuentes
                </h2>
                <p className="text-xs text-[var(--mute)]">
                  Todo lo que necesitas saber antes de comenzar tus 7 días:
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    q: '¿Cómo me ayuda si tengo un proyecto que dejé a medias o no sé cómo arrancar?',
                    a: 'HOY no te pide que planees todo de golpe ni que tengas todas las respuestas. Te pide definir únicamente tu siguiente paso visible de 25 minutos para hoy. Al avanzar un bloque diario sin distracciones, proyectos que tenías estancados durante meses se desbloquean desde el primer día.',
                  },
                  {
                    q: '¿Por qué este método rompe la trampa del famoso "después lo hago"?',
                    a: 'La mente posterga cuando ve listas caóticas de 40 tareas o metas inmensas. HOY reduce tu jornada a una sola prioridad activa y te impulsa con la regla 5-4-3-2-1: accionas en los primeros 5 segundos antes de que tu cerebro pueda fabricar una excusa.',
                  },
                  {
                    q: '¿Tengo que ingresar tarjeta de crédito o pagar algo ahora?',
                    a: 'No. El acceso por 7 días es 100% gratuito. No te pediremos tarjeta de crédito ni habrá cargos automáticos sorpresa.',
                  },
                  {
                    q: '¿Por qué HOY funciona mejor que una app de notas o Todoist?',
                    a: 'Las apps convencionales son almacenes de pendientes que alimentan la procrastinación. HOY es un sistema cerrado de ejecución diaria: te da una rutina matutina para ganar tu primera hora, te obliga a enfocarte en 1 sola meta y cierra a las 9 PM en 10 segundos.',
                  },
                  {
                    q: '¿Qué pasa cuando terminen mis 7 días de prueba?',
                    a: 'Si el sistema demostró mejorar tu constancia y enfoque, podrás activar tu plan preferido mediante Yape, Plin o transferencia bancaria. Si decides no continuar, tu cuenta expira sin compromiso ni penalidad alguna.',
                  },
                  {
                    q: '¿Cómo lo instalo en mi iPhone o Android?',
                    a: 'HOY funciona como una Progressive Web App (PWA) de alto rendimiento. En Safari toca "Compartir > Agregar a pantalla de inicio"; en Chrome toca los 3 puntos y "Instalar aplicación". Se abre en pantalla completa al instante.',
                  },
                ].map((faq, idx) => (
                  <details
                    key={idx}
                    className={`group rounded-2xl border transition p-4 ${
                      isDark
                        ? 'bg-[#182229] border-[#2B3A45]'
                        : 'bg-[#F8FAFB] border-[#E5ECF0]'
                    }`}
                  >
                    <summary className="flex items-center justify-between gap-3 font-extrabold text-xs sm:text-sm cursor-pointer list-none select-none">
                      <span className="text-left">{faq.q}</span>
                      <span className="text-[var(--mute)] group-open:rotate-180 transition-transform duration-200 shrink-0">
                        ▼
                      </span>
                    </summary>
                    <p className="pt-2.5 text-xs text-[var(--mute)] leading-relaxed border-t border-[var(--line)]/50 mt-3">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* SECCIÓN 5: CTA FINAL DE CONVERSIÓN */}
            <section className="text-center space-y-4 pt-4 pb-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[#3B4CCA]/12 text-[#3B4CCA] dark:text-[#7F8DF2] flex items-center justify-center font-black text-2xl shadow-sm">
                <Flame className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  ¿Listo para tomar el control de tus días?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--mute)]">
                  Empieza hoy mismo con tu prueba gratuita. Sin cobros automáticos,
                  sin tarjeta. Si te sirve y mejora tu vida, te quedas.
                </p>
              </div>

              <div className="pt-2 flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    onClose();
                    onOpenRegister();
                  }}
                  className="w-full min-h-[54px] px-6 rounded-2xl bg-gradient-to-r from-[#15803D] to-[#0F766E] hover:from-[#166534] hover:to-[#115E59] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/20 cursor-pointer transition active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>¡Quiero mis 7 días gratis ahora!</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="text-xs font-bold text-[var(--mute)] hover:text-[var(--acc)] cursor-pointer py-1 transition"
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-center gap-4 text-[11px] text-[var(--mute)]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Sin permanencia</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#3B4CCA]" />
                  <span>Racha y constancia real</span>
                </span>
              </div>
            </section>
          </div>

          {/* Barra inferior fija para móvil (Sticky Conversion CTA Bar) */}
          <div
            className={`sm:hidden sticky bottom-0 z-30 px-3.5 py-2.5 border-t backdrop-blur-xl flex items-center gap-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-xl shrink-0 ${
              isDark
                ? 'bg-[#121A20]/95 border-[#2B3A45]'
                : 'bg-[#FFFFFF]/95 border-[#DDE4E9]'
            }`}
          >
            <button
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="flex-1 min-h-[46px] px-3.5 rounded-xl bg-gradient-to-r from-[#15803D] to-[#0F766E] hover:from-[#166534] hover:to-[#115E59] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/25 active:scale-[0.98] transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">¡Comenzar 7 días gratis!</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="min-h-[46px] px-3 rounded-xl border border-[var(--line)] text-[11px] font-bold text-[var(--mute)] hover:text-[var(--ink)] active:scale-95 transition cursor-pointer shrink-0"
            >
              Entrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
