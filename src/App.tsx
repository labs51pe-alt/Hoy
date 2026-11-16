/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Flame,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  LogOut,
  Download,
  WifiOff,
  FolderKanban,
  Sun,
  Moon,
  Settings,
  Check,
  Clock,
  Trophy,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX,
  X,
  Share,
  MoreVertical,
  Smartphone,
  Zap,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import AdminCrmModal, {
  PaymentEntry,
  SubscriberPlan,
  SubscriberRecord,
} from './components/AdminCrmModal';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================
const STORAGE_KEY = 'progreso-v10';
const SESSION_TOKEN_KEY = 'hoy_session_token';
const PROFILE_ID_KEY = 'hoy_profile_id';

const ST = [
  ['ideas', 'Ideas'],
  ['haciendo', 'Haciendo'],
  ['esperando', 'Esperando'],
  ['terminado', 'Terminado'],
] as const;

const DEFAULT_RUT: [string, string][] = [
  ['Agua y tender la cama', '6:30'],
  ['Meditar 5 min', '6:35'],
  ['Audiolibro: un capítulo', '6:40'],
  ['Ejercicio en casa (10 min)', '6:55'],
  ['Baño y preparación', '7:05'],
  ['Paseo matutino', '7:20'],
  ['Desayuno sin pantalla', '8:20'],
  ['Ordenar espacio (10 min)', '8:35'],
  ['Bloque de enfoque (25 min)', '9:00'],
];

const DEFAULT_DOM: [string, string][] = [
  ['Agua y tender la cama', '8:00'],
  ['Audiolibro o lectura', '8:05'],
  ['Ejercicio en casa (10 min)', '8:20'],
  ['Baño', '8:30'],
  ['Paseo matutino', '8:45'],
  ['Desayuno sin pantallas', '9:45'],
  ['Revisión semanal (10 min)', '10:15'],
];

const DEFAULT_PROJECTS = [
  {
    id: 1,
    name: 'Lanzamiento de sistema diario',
    step: '',
    st: 'haciendo',
    tasks: [
      'Completar rutina matutina de enfoque',
      'Definir el entregable principal de hoy',
      'Ejecutar bloque de 25 min sin distracciones',
      'Registrar avance antes de cerrar el día',
    ].map((t) => ({ t, d: false })),
  },
];

const PRAISE_MESSAGES = [
  '¡Imparable! Cada paso cuenta.',
  '¡Eso es! Tu constancia se nota.',
  '¡Excelente! Sigue avanzando.',
  '¡Así se hace! Un paso más hoy.',
  '¡Muy bien! La disciplina construye resultados.',
];

// ==========================================
// LOGOTIPO VECTORIAL ARQUITECTÓNICO HOY
// ==========================================
function HoyLogo({
  size = 'md',
  variant = 'accent',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'accent' | 'light';
}) {
  const px = size === 'sm' ? 36 : size === 'lg' ? 76 : 44;
  const isLightSurface = variant === 'light';

  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none"
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 128 128"
        fill="none"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="hoyTileGrad" x1="12" y1="8" x2="116" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isLightSurface ? '#FFFFFF' : 'var(--acc)'} />
            <stop offset="100%" stopColor={isLightSurface ? '#E8ECFF' : '#2A369C'} />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="4"
          width="120"
          height="120"
          rx="30"
          fill={isLightSurface ? 'url(#hoyTileGrad)' : 'var(--acc)'}
          stroke={isLightSurface ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.16)'}
          strokeWidth="2"
        />
        {/* Left & Right Pillars */}
        <rect
          x="33"
          y="32"
          width="14"
          height="64"
          rx="7"
          fill={isLightSurface ? '#3B4CCA' : 'var(--accink)'}
        />
        <rect
          x="81"
          y="32"
          width="14"
          height="64"
          rx="7"
          fill={isLightSurface ? '#3B4CCA' : 'var(--accink)'}
        />
        {/* Kinetic Bridge */}
        <rect
          x="47"
          y="58"
          width="34"
          height="12"
          rx="4"
          fill={isLightSurface ? '#3B4CCA' : 'var(--accink)'}
          fillOpacity="0.9"
        />
        {/* Solar Focus Node */}
        <circle
          cx="64"
          cy="39"
          r="6.5"
          fill={isLightSurface ? '#3B4CCA' : 'var(--accink)'}
        />
      </svg>
    </div>
  );
}

// ==========================================
// ANILLO DE PROGRESO SVG
// ==========================================
function ProgressRing({
  progress,
  size = 52,
  stroke = 4.5,
}: {
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--acc)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <span className="absolute text-[11px] font-extrabold tabular-nums text-[var(--ink)]">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

// ==========================================
// HOOKS PWA Y UTILIDADES
// ==========================================
function ymd(d: Date) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function back(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymd(d);
}

function tomorrowYmd() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return ymd(d);
}

function shortDayLetter(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const letters = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return letters[d.getDay()];
}

function formattedToday() {
  const d = new Date();
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

function formatTimeDisplay(timeStr?: string): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function playAlertChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [659.25, 880]; // E5 -> A5 crisp two-tone chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.16);
      gain.gain.setValueAtTime(0.001, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.38);
    });
  } catch {
    // Ignore autoplay blocks
  }
}

function playCountdownTick(isGo = false) {
  try {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 523.25, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(isGo ? 0.16 : 0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isGo ? 0.35 : 0.14));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (isGo ? 0.38 : 0.16));
  } catch {
    // Ignore autoplay restrictions
  }
}

function triggerHaptic(isGo = false) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(isGo ? [60, 40, 90] : 25);
    }
  } catch {
    // Ignore unsupported environments
  }
}

async function dispatchSystemNotification(
  title: string,
  body: string,
  tag: string
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag,
          requireInteraction: false,
        });
        return;
      }
    }
    const n = new Notification(title, {
      body,
      icon: '/icon.svg',
      tag,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Fallback ignored cleanly
  }
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() =>
    typeof window !== 'undefined' ? window.__deferredInstallPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    setIsIOS(ios);
    setIsAndroid(android);
    setIsMobile(ios || android);

    if (window.__deferredInstallPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__deferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const promptEvent = deferredPrompt || window.__deferredInstallPrompt;
    if (!promptEvent) return false;
    await (promptEvent as any).prompt();
    const { outcome } = await (promptEvent as any).userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__deferredInstallPrompt = null;
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    install,
  };
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default function App() {
  const [state, setState] = useState(() => {
    const defaultState = {
      view: 'welcome',
      hasStarted: false,
      theme: 'light',
      f: 'todos',
      days: [] as string[],
      same: true,
      re: 'semana',
      routines: {
        semana: DEFAULT_RUT.slice(),
        domingo: DEFAULT_DOM.slice(),
      },
      projects: DEFAULT_PROJECTS,
      rut: { d: ymd(new Date()), x: [] as number[] },
      sel: null as number | null,
      del: null as number | null,
      newTaskText: '',
      newTaskTime: '',
      newProjectName: '',
      newProjectTasks: '',
      newRoutineName: '',
      newRoutineTime: '',
      subscribers: [
        {
          id: 1,
          name: 'Carlos Mendoza',
          phone: '+51 999 888 777',
          city: 'Lima, Perú',
          status: 'pendiente',
          plan: 'Vitalicio',
          amount: 75,
          paymentMethod: 'Yape',
          paymentStatus: 'pendiente',
          date: back(0),
          payments: [],
        },
        {
          id: 2,
          name: 'Ana Sofía Ruiz',
          phone: '+52 555 123 4567',
          city: 'CDMX, México',
          status: 'activo',
          plan: 'Vitalicio',
          amount: 75,
          paymentMethod: 'Tarjeta',
          paymentStatus: 'pagado',
          paymentRef: 'STR-8410',
          date: back(1),
          approvedAt: back(1),
          payments: [
            {
              id: 201,
              date: back(1),
              amount: 75,
              method: 'Tarjeta',
              ref: 'STR-8410',
              note: 'Membresía Vitalicio',
            },
          ],
        },
        {
          id: 3,
          name: 'Mateo Vargas',
          phone: '+57 310 442 1900',
          city: 'Bogotá, Colombia',
          status: 'activo',
          plan: 'Trimestral',
          amount: 55,
          paymentMethod: 'Transferencia',
          paymentStatus: 'pagado',
          paymentRef: 'TRF-2911',
          date: back(2),
          approvedAt: back(2),
          payments: [
            {
              id: 301,
              date: back(2),
              amount: 55,
              method: 'Transferencia',
              ref: 'TRF-2911',
              note: 'Plan Trimestral',
            },
          ],
        },
        {
          id: 4,
          name: 'Lucía Paredes',
          phone: '+51 987 654 321',
          city: 'Arequipa, Perú',
          status: 'activo',
          plan: 'Vitalicio',
          amount: 75,
          paymentMethod: 'Plin',
          paymentStatus: 'pagado',
          paymentRef: 'PLN-4402',
          date: back(4),
          approvedAt: back(4),
          payments: [
            {
              id: 401,
              date: back(4),
              amount: 75,
              method: 'Plin',
              ref: 'PLN-4402',
              note: 'Membresía Vitalicio',
            },
          ],
        },
        {
          id: 5,
          name: 'Diego Torres',
          phone: '+54 11 5520 8812',
          city: 'Buenos Aires, Argentina',
          status: 'pausado',
          plan: 'Mensual',
          amount: 25,
          paymentMethod: 'Tarjeta',
          paymentStatus: 'pagado',
          paymentRef: 'MP-7731',
          date: back(5),
          approvedAt: back(5),
          payments: [
            {
              id: 501,
              date: back(5),
              amount: 25,
              method: 'Tarjeta',
              ref: 'MP-7731',
              note: 'Primer mes',
            },
          ],
        },
      ] as SubscriberRecord[],
      alertsEnabled: false,
      alertsSound: true,
      eveningReviewEnabled: true,
      eveningReviewTime: '21:00',
      morningPromptedDate: '',
      eveningPromptedDate: '',
      appliedPlanDate: '',
      plannedDays: {} as Record<
        string,
        {
          confirmedAt: string;
          routineType?: 'semana' | 'domingo';
          activeProjectId?: number | null;
          priorityTask?: string;
          priorityTime?: string;
        }
      >,
      alertLog: {
        d: ymd(new Date()),
        fired: [] as string[],
        snoozedUntil: {} as Record<string, number>,
      },
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const todayStr = ymd(new Date());
          const savedAlertLog =
            parsed.alertLog &&
            typeof parsed.alertLog === 'object' &&
            parsed.alertLog.d === todayStr
              ? {
                  d: todayStr,
                  fired: Array.isArray(parsed.alertLog.fired)
                    ? parsed.alertLog.fired
                    : [],
                  snoozedUntil:
                    parsed.alertLog.snoozedUntil &&
                    typeof parsed.alertLog.snoozedUntil === 'object'
                      ? parsed.alertLog.snoozedUntil
                      : {},
                }
              : { d: todayStr, fired: [], snoozedUntil: {} };

          return {
            ...defaultState,
            ...parsed,
            view: 'welcome',
            projects: Array.isArray(parsed.projects)
              ? parsed.projects
              : DEFAULT_PROJECTS,
            days: Array.isArray(parsed.days) ? parsed.days : [],
            routines: {
              semana: Array.isArray(parsed.routines?.semana)
                ? parsed.routines.semana
                : DEFAULT_RUT.slice(),
              domingo: Array.isArray(parsed.routines?.domingo)
                ? parsed.routines.domingo
                : DEFAULT_DOM.slice(),
            },
            rut:
              parsed.rut && typeof parsed.rut === 'object'
                ? {
                    d: parsed.rut.d || todayStr,
                    x: Array.isArray(parsed.rut.x) ? parsed.rut.x : [],
                  }
                : { d: todayStr, x: [] },
            subscribers: Array.isArray(parsed.subscribers)
              ? parsed.subscribers
              : defaultState.subscribers,
            plannedDays:
              parsed.plannedDays && typeof parsed.plannedDays === 'object'
                ? parsed.plannedDays
                : {},
            alertLog: savedAlertLog,
          };
        }
      }
    } catch {
      // Fallback to defaultState
    }

    return defaultState;
  });

  // Sincronizar tema claro / oscuro con atributo HTML y barra de navegador
  useEffect(() => {
    const currentTheme = state.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        currentTheme === 'dark' ? '#121A20' : '#3B4CCA'
      );
    }
  }, [state.theme]);

  const toggleTheme = () => {
    setState((prev: any) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Sesión WhatsApp OTP y Sincronización Backend (/api/* -> Supabase)
  const [sessionToken, setSessionToken] = useState<string>(() => {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY) || '';
    } catch {
      return '';
    }
  });
  const [cloudStatus, setCloudStatus] = useState<{
    checked: boolean;
    supabaseConfigured: boolean;
    n8nConfigured: boolean;
  }>({
    checked: false,
    supabaseConfigured: false,
    n8nConfigured: false,
  });
  const [activeProfile, setActiveProfile] = useState<{
    id: string;
    name: string;
    phone: string;
    plan?: string;
  } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [adminVerifiedPin, setAdminVerifiedPin] = useState('');
  const [crmSyncing, setCrmSyncing] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [isRegBusy, setIsRegBusy] = useState(false);

  // Notificación Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);

  // PWA & Conectividad
  const { isInstallable, isInstalled, isIOS, isAndroid, isMobile, install } =
    usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const isOnline = useOnlineStatus();

  // Mostrar aviso de instalación al ingresar a la web app si aún no está instalada
  useEffect(() => {
    if (isInstalled) {
      setShowInstallBanner(false);
      return;
    }
    try {
      const dismissedAt = Number(
        localStorage.getItem('hoy_install_dismissed_at') || 0
      );
      const twelveHours = 12 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < twelveHours) return;
    } catch {
      // Ignore storage errors
    }

    const timer = setTimeout(() => {
      setShowInstallBanner(true);
    }, 550);
    return () => clearTimeout(timer);
  }, [isInstalled]);

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('hoy_install_dismissed_at', String(Date.now()));
    } catch {
      // Ignore storage errors
    }
  };

  const handleInstallAction = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setShowInstallBanner(false);
        setShowInstallGuide(false);
        say('HOY instalada en tu dispositivo.');
      }
      return;
    }
    setShowInstallBanner(false);
    setShowInstallGuide(true);
  };

  // Alertas de Horario
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{
    key: string;
    source: 'rutina' | 'proyecto';
    title: string;
    subtitle: string;
    timeStr: string;
    routineIdx?: number;
    projectId?: number;
    taskIdx?: number;
  } | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  // Pantalla inicial de arranque 5-4-3-2-1 antes del portal
  const [introSplash, setIntroSplash] = useState<boolean>(true);
  const [introCount, setIntroCount] = useState<number>(5);
  const [launchModal, setLaunchModal] = useState<{
    title: string;
    subtitle: string;
    phase: 'countdown' | 'focus';
    count: number;
    elapsedSec: number;
    target?:
      | { kind: 'routine'; index: number }
      | { kind: 'project'; projectId: number; taskText: string; taskIdx?: number };
  } | null>(null);

  useEffect(() => {
    if (!introSplash) return;
    if (introCount <= 0) {
      setIntroSplash(false);
      return;
    }
    const timer = setTimeout(() => {
      setIntroCount((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [introSplash, introCount]);

  // Cierre nocturno (9 PM), respaldo matutino y organizador rápido de 2 pasos
  const [showEveningPrompt, setShowEveningPrompt] = useState(false);
  const [showMorningPrompt, setShowMorningPrompt] = useState(false);
  const [dayOrganizerTarget, setDayOrganizerTarget] = useState<'today' | 'tomorrow' | null>(null);
  const [orgRoutine, setOrgRoutine] = useState<'semana' | 'domingo'>('semana');
  const [orgProjectId, setOrgProjectId] = useState<number | null>(null);
  const [orgPriorityTask, setOrgPriorityTask] = useState('');
  const [orgPriorityTime, setOrgPriorityTime] = useState('');

  // Estados para Inscripción (Hazte socio) y CRM Admin secreto (3 clicks en logo)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdminCrmModal, setShowAdminCrmModal] = useState(false);
  const [adminPinModal, setAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const logoClickTimerRef = useRef<any>(null);
  const navWelcomeTimerRef = useRef<any>(null);

  const fetchAdminSubscribers = async (pin: string) => {
    setCrmSyncing(true);
    try {
      const res = await fetch('/api/admin/subscribers', {
        headers: { 'x-admin-pin': pin },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.mode === 'supabase' && Array.isArray(data.subscribers)) {
        setState((prev: any) => ({ ...prev, subscribers: data.subscribers }));
      }
    } catch {
      // Mantiene datos locales si no hay conexión
    } finally {
      setCrmSyncing(false);
    }
  };

  const handleAdminPinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pin = adminPinInput.trim();
    if (!pin) {
      setAdminPinError('Ingresa tu clave de administrador.');
      return;
    }

    let verified = false;
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        verified = Boolean(data.ok);
      } else if (res.status === 401) {
        verified = false;
      } else {
        verified = pin === '1982';
      }
    } catch {
      verified = pin === '1982';
    }

    if (verified) {
      setAdminVerifiedPin(pin);
      setAdminPinModal(false);
      setAdminPinInput('');
      setAdminPinError('');
      setShowAdminPin(false);
      setShowAdminCrmModal(true);
      void fetchAdminSubscribers(pin);
    } else {
      setAdminPinError('Clave incorrecta. Intenta de nuevo.');
      say('Clave incorrecta.');
    }
  };

  const handleSecretAdminTap = (fromInnerHeader = false) => {
    if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);
    if (navWelcomeTimerRef.current) clearTimeout(navWelcomeTimerRef.current);

    const next = logoClicks + 1;
    if (next >= 3) {
      setLogoClicks(0);
      setAdminPinModal(true);
      return;
    }

    setLogoClicks(next);
    logoClickTimerRef.current = setTimeout(() => {
      setLogoClicks(0);
    }, 1500);

    if (fromInnerHeader) {
      navWelcomeTimerRef.current = setTimeout(() => {
        setIntroSplash(false);
        setState((prev: any) => ({ ...prev, view: 'welcome' }));
      }, 320);
    }
  };

  const [regName, setRegName] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('+51');
  const [regPhoneNum, setRegPhoneNum] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPlan, setRegPlan] = useState<SubscriberPlan>('Vitalicio');
  const [lastRegSummary, setLastRegSummary] = useState<{
    plan: SubscriberPlan;
    amount: number;
    whatsappSent?: boolean;
  }>({ plan: 'Vitalicio', amount: 75, whatsappSent: false });

  // Estados para el flujo de inicio de sesión por WhatsApp OTP al dar Comenzar
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [loginCountryCode, setLoginCountryCode] = useState('+51');
  const [loginPhoneNum, setLoginPhoneNum] = useState('');
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpHintMessage, setOtpHintMessage] = useState('');

  const openDayOrganizer = (target: 'today' | 'tomorrow') => {
    const targetDateStr = target === 'tomorrow' ? tomorrowYmd() : ymd(new Date());
    const existingPlan = state.plannedDays?.[targetDateStr];
    const activeProj = (Array.isArray(state.projects) ? state.projects : []).find(
      (p: any) => p.st === 'haciendo'
    );
    const defaultRoutine: 'semana' | 'domingo' =
      existingPlan?.routineType ||
      (target === 'tomorrow' && new Date().getDay() === 6
        ? 'domingo'
        : state.same === false && state.re === 'domingo'
        ? 'domingo'
        : 'semana');

    setOrgRoutine(defaultRoutine);
    setOrgProjectId(
      existingPlan?.activeProjectId !== undefined
        ? existingPlan.activeProjectId
        : activeProj?.id ?? null
    );
    setOrgPriorityTask(existingPlan?.priorityTask || '');
    setOrgPriorityTime(existingPlan?.priorityTime || '');
    setShowMorningPrompt(false);
    setShowEveningPrompt(false);
    setDayOrganizerTarget(target);
  };

  const confirmKeepAsIs = (target: 'today' | 'tomorrow') => {
    const todayStr = ymd(new Date());
    const targetDateStr = target === 'tomorrow' ? tomorrowYmd() : todayStr;
    setState((prev: any) => ({
      ...prev,
      ...(target === 'tomorrow'
        ? { eveningPromptedDate: todayStr }
        : { morningPromptedDate: todayStr, appliedPlanDate: todayStr }),
      plannedDays: {
        ...(prev.plannedDays || {}),
        [targetDateStr]: {
          confirmedAt: new Date().toISOString(),
        },
      },
    }));
    if (target === 'tomorrow') {
      setShowEveningPrompt(false);
      say('Mañana confirmado tal como está.');
    } else {
      setShowMorningPrompt(false);
      say('¡Perfecto! Seguimos con tu plan de hoy.');
    }
  };

  const saveDayOrganizer = () => {
    if (!dayOrganizerTarget) return;
    const todayStr = ymd(new Date());
    const targetDateStr =
      dayOrganizerTarget === 'tomorrow' ? tomorrowYmd() : todayStr;
    const cleanTask = orgPriorityTask.trim();
    const cleanTime = orgPriorityTime.trim();

    if (dayOrganizerTarget === 'today') {
      setState((prev: any) => {
        let nextProjects = Array.isArray(prev.projects) ? [...prev.projects] : [];
        if (orgProjectId !== null) {
          nextProjects = nextProjects.map((p: any) => {
            if (p.id === orgProjectId) return { ...p, st: 'haciendo' };
            if (p.st === 'haciendo') return { ...p, st: 'ideas' };
            return p;
          });
        }
        if (cleanTask) {
          const targetIdx = nextProjects.findIndex((p: any) =>
            orgProjectId !== null ? p.id === orgProjectId : p.st === 'haciendo'
          );
          if (targetIdx !== -1) {
            const p = nextProjects[targetIdx];
            const prevTasks = Array.isArray(p.tasks) ? p.tasks : [];
            const already = prevTasks.some(
              (t: any) => t.t?.toLowerCase() === cleanTask.toLowerCase() && !t.d
            );
            if (!already) {
              const newTaskObj = cleanTime
                ? { t: cleanTask, d: false, time: cleanTime }
                : { t: cleanTask, d: false };
              nextProjects[targetIdx] = {
                ...p,
                tasks: [newTaskObj, ...prevTasks],
              };
            }
          } else {
            const newTaskObj = cleanTime
              ? { t: cleanTask, d: false, time: cleanTime }
              : { t: cleanTask, d: false };
            nextProjects = [
              ...nextProjects,
              {
                id: Date.now(),
                name: 'Enfoque de hoy',
                step: '',
                st: 'haciendo',
                tasks: [newTaskObj],
              },
            ];
          }
        }
        return {
          ...prev,
          same: false,
          re: orgRoutine,
          projects: nextProjects,
          morningPromptedDate: todayStr,
          appliedPlanDate: todayStr,
          plannedDays: {
            ...(prev.plannedDays || {}),
            [todayStr]: {
              confirmedAt: new Date().toISOString(),
              routineType: orgRoutine,
              activeProjectId: orgProjectId,
              priorityTask: cleanTask,
              priorityTime: cleanTime,
            },
          },
        };
      });
      setDayOrganizerTarget(null);
      say('Tu día de hoy quedó organizado.');
    } else {
      setState((prev: any) => ({
        ...prev,
        eveningPromptedDate: todayStr,
        plannedDays: {
          ...(prev.plannedDays || {}),
          [targetDateStr]: {
            confirmedAt: new Date().toISOString(),
            routineType: orgRoutine,
            activeProjectId: orgProjectId,
            priorityTask: cleanTask,
            priorityTime: cleanTime,
          },
        },
      }));
      setDayOrganizerTarget(null);
      say('Plan de mañana guardado. Descansa tranquilo.');
    }
  };

  useEffect(() => {
    if (!launchModal) return;
    if (launchModal.phase === 'countdown') {
      if (launchModal.count <= 0) {
        if (state.alertsSound !== false) playCountdownTick(true);
        triggerHaptic(true);
        setLaunchModal((prev) =>
          prev ? { ...prev, phase: 'focus', elapsedSec: 0 } : null
        );
        return;
      }
      const timer = setTimeout(() => {
        const nextCount = launchModal.count - 1;
        if (nextCount > 0) {
          if (state.alertsSound !== false) playCountdownTick(false);
          triggerHaptic(false);
        }
        setLaunchModal((prev) =>
          prev ? { ...prev, count: nextCount } : null
        );
      }, 1000);
      return () => clearTimeout(timer);
    }

    const focusTimer = setInterval(() => {
      setLaunchModal((prev) =>
        prev && prev.phase === 'focus'
          ? { ...prev, elapsedSec: prev.elapsedSec + 1 }
          : prev
      );
    }, 1000);
    return () => clearInterval(focusTimer);
  }, [launchModal, state.alertsSound]);

  const startFiveSecondRule = (
    title: string,
    subtitle: string,
    target?:
      | { kind: 'routine'; index: number }
      | { kind: 'project'; projectId: number; taskText: string; taskIdx?: number }
  ) => {
    if (state.alertsSound !== false) playCountdownTick(false);
    triggerHaptic(false);
    setLaunchModal({
      title,
      subtitle,
      phase: 'countdown',
      count: 5,
      elapsedSec: 0,
      target,
    });
  };

  const completeLaunchTask = () => {
    if (!launchModal) return;
    const t = launchModal.target;
    if (t?.kind === 'routine') {
      setState((prev: any) => {
        const prevRut = prev.rut || { d: ymd(new Date()), x: [] };
        const xList = Array.isArray(prevRut.x) ? prevRut.x : [];
        if (xList.includes(t.index)) return prev;
        return {
          ...prev,
          rut: { ...prevRut, x: [...xList, t.index] },
        };
      });
      say(praise());
    } else if (t?.kind === 'project') {
      setState((prev: any) => {
        const projs = (prev.projects || []).map((p: any) => {
          if (p.id === t.projectId && Array.isArray(p.tasks)) {
            const updatedTasks = p.tasks.map((tk: any, i: number) => {
              if (typeof t.taskIdx === 'number' && i === t.taskIdx) {
                return { ...tk, d: true };
              }
              if (
                typeof t.taskIdx !== 'number' &&
                tk.t === t.taskText &&
                !tk.d
              ) {
                return { ...tk, d: true };
              }
              return tk;
            });
            return { ...p, tasks: updatedTasks };
          }
          return p;
        });
        return { ...prev, projects: projs };
      });
      markDay();
      say(praise());
    }
    setLaunchModal(null);
  };

  const applyAuthenticatedProfileState = (
    profile: { id: string; name: string; phone: string; plan?: string },
    progressData: any,
    moveToHoy: boolean
  ) => {
    setActiveProfile(profile);
    let prevProfileId = '';
    try {
      prevProfileId = localStorage.getItem(PROFILE_ID_KEY) || '';
      localStorage.setItem(PROFILE_ID_KEY, profile.id);
    } catch {
      // Ignore storage errors
    }

    const isSwitchingToFreshUser =
      prevProfileId !== '' && prevProfileId !== profile.id && !progressData;

    setState((prev: any) => {
      if (progressData && typeof progressData === 'object') {
        return {
          ...prev,
          ...progressData,
          subscribers: prev.subscribers,
          ...(moveToHoy ? { view: 'hoy', hasStarted: true } : {}),
        };
      }
      if (isSwitchingToFreshUser) {
        return {
          ...prev,
          view: moveToHoy ? 'hoy' : prev.view,
          hasStarted: moveToHoy ? true : prev.hasStarted,
          same: true,
          re: 'semana',
          rut: { d: ymd(new Date()), x: [] },
          days: [],
          routines: { semana: DEFAULT_RUT, domingo: DEFAULT_DOM },
          projects: DEFAULT_PROJECTS,
          plannedDays: {},
          morningPromptedDate: '',
          eveningPromptedDate: '',
          appliedPlanDate: '',
        };
      }
      return moveToHoy ? { ...prev, view: 'hoy', hasStarted: true } : prev;
    });
  };

  useEffect(() => {
    let active = true;
    const initCloud = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok && active) {
          const healthData = await healthRes.json();
          const sbReady = Boolean(healthData.supabaseConfigured);
          setCloudStatus({
            checked: true,
            supabaseConfigured: sbReady,
            n8nConfigured: Boolean(healthData.n8nConfigured),
          });

          if (sbReady && active) {
            setState((prev: any) => ({ ...prev, subscribers: [] }));
          }

          if (sbReady && sessionToken) {
            const sessRes = await fetch('/api/auth/session', {
              headers: { Authorization: `Bearer ${sessionToken}` },
            });
            if (sessRes.ok && active) {
              const sessData = await sessRes.json();
              if (sessData.authenticated && sessData.profile) {
                applyAuthenticatedProfileState(
                  sessData.profile,
                  sessData.progressData,
                  false
                );
              } else if (sessData.mode === 'supabase') {
                setActiveProfile(null);
                setSessionToken('');
                try {
                  localStorage.removeItem(SESSION_TOKEN_KEY);
                } catch {
                  // Ignore storage errors
                }
              }
            }
          }
        }
      } catch {
        if (active) {
          setCloudStatus({
            checked: true,
            supabaseConfigured: false,
            n8nConfigured: false,
          });
        }
      }
    };
    void initCloud();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }

    if (cloudStatus.supabaseConfigured && sessionToken) {
      const timer = setTimeout(() => {
        const { subscribers: _omitSubscribers, ...userProgressPayload } = state;
        void fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ data: userProgressPayload }),
        }).catch(() => {
          // Persiste localmente en caso de corte temporal de red
        });
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [state, cloudStatus.supabaseConfigured, sessionToken]);

  const handleLogoutCloudSession = async () => {
    if (sessionToken && cloudStatus.supabaseConfigured) {
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
    setSessionToken('');
    setActiveProfile(null);
    setShowConfigModal(false);
    setState((prev: any) => ({ ...prev, view: 'welcome', hasStarted: false }));
    say('Sesión cerrada.');
  };

  function say(msg: string) {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3200);
  }

  function praise() {
    return PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
  }

  function markDay() {
    const todayStr = back(0);
    setState((prev: any) => {
      const days = Array.isArray(prev.days) ? prev.days : [];
      if (days.includes(todayStr)) return prev;
      return { ...prev, days: [...days, todayStr] };
    });
  }

  const currentRoutineKey =
    state.same === false ? state.re || 'semana' : 'semana';
  const routinesObj = state.routines || {
    semana: DEFAULT_RUT,
    domingo: DEFAULT_DOM,
  };
  const currentRoutineList: [string, string][] =
    routinesObj[currentRoutineKey === 'domingo' ? 'domingo' : 'semana'] ||
    DEFAULT_RUT;

  useEffect(() => {
    const todayStr = ymd(new Date());
    if (!state.rut || state.rut.d !== todayStr) {
      setState((prev: any) => ({ ...prev, rut: { d: todayStr, x: [] } }));
    }
  }, []);

  const calculateStreak = () => {
    let n = 0;
    const days = Array.isArray(state.days) ? state.days : [];
    let i = days.includes(back(0)) ? 0 : 1;
    while (days.includes(back(i))) {
      n++;
      i++;
    }
    return n;
  };

  const projectsList = Array.isArray(state.projects) ? state.projects : [];
  const currentProject = projectsList.find((p: any) => p.st === 'haciendo');

  const moveProject = (pId: number, targetSt: string) => {
    setState((prev: any) => {
      const projs = Array.isArray(prev.projects) ? prev.projects : [];
      const updatedProjects = projs.map((p: any) => {
        if (p.id === pId) return { ...p, st: targetSt };
        if (targetSt === 'haciendo' && p.st === 'haciendo' && p.id !== pId) {
          return { ...p, st: 'ideas' };
        }
        return p;
      });
      return { ...prev, projects: updatedProjects };
    });
    if (targetSt === 'haciendo') {
      say('Proyecto activo en ejecución.');
    } else {
      const stName = ST.find((s) => s[0] === targetSt)?.[1] || targetSt;
      say(`Movido a ${stName}.`);
    }
  };

  const getNextTask = (p: any) => {
    if (!p || !Array.isArray(p.tasks)) return null;
    return p.tasks.find((x: any) => !x.d);
  };

  const isWelcome = state.view === 'welcome';
  const isDark = state.theme === 'dark';
  const streakCount = calculateStreak();
  const rutDoneCount = Array.isArray(state.rut?.x) ? state.rut.x.length : 0;

  // Recopilar próximos recordatorios programados de hoy (Rutina + Tareas con horario)
  const getScheduledItemsForToday = () => {
    const items: Array<{
      key: string;
      source: 'rutina' | 'proyecto';
      title: string;
      subtitle: string;
      timeStr: string;
      mins: number;
      routineIdx?: number;
      projectId?: number;
      taskIdx?: number;
    }> = [];

    const doneRut: number[] = Array.isArray(state.rut?.x) ? state.rut.x : [];
    currentRoutineList.forEach((step, idx) => {
      if (doneRut.includes(idx)) return;
      const mins = parseTimeToMinutes(step[1]);
      if (mins === null) return;
      items.push({
        key: `rut-${idx}-${formatTimeDisplay(step[1])}`,
        source: 'rutina',
        title: step[0],
        subtitle: 'Rutina de hoy',
        timeStr: formatTimeDisplay(step[1]),
        mins,
        routineIdx: idx,
      });
    });

    projectsList.forEach((proj: any) => {
      if (proj.st === 'terminado' || !Array.isArray(proj.tasks)) return;
      proj.tasks.forEach((tk: any, tIdx: number) => {
        if (tk.d) return;
        const mins = parseTimeToMinutes(tk.time);
        if (mins === null) return;
        items.push({
          key: `proj-${proj.id}-${tIdx}-${formatTimeDisplay(tk.time)}`,
          source: 'proyecto',
          title: tk.t,
          subtitle: proj.name,
          timeStr: formatTimeDisplay(tk.time),
          mins,
          projectId: proj.id,
          taskIdx: tIdx,
        });
      });
    });

    return items.sort((a, b) => a.mins - b.mins);
  };

  // Motor de verificación de alertas cada 15 segundos
  useEffect(() => {
    if (!state.alertsEnabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const todayStr = ymd(now);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const nowMs = now.getTime();
      const log =
        state.alertLog?.d === todayStr
          ? state.alertLog
          : { d: todayStr, fired: [] as string[], snoozedUntil: {} as Record<string, number> };

      const items = getScheduledItemsForToday();
      const candidate = items.find((item) => {
        const snoozeTs = log.snoozedUntil?.[item.key];
        if (typeof snoozeTs === 'number') {
          return nowMs >= snoozeTs;
        }
        if (log.fired.includes(item.key)) return false;
        return nowMins >= item.mins && nowMins <= item.mins + 15;
      });

      if (candidate) {
        setState((prev: any) => {
          const prevLog =
            prev.alertLog?.d === todayStr
              ? prev.alertLog
              : { d: todayStr, fired: [], snoozedUntil: {} };
          const nextSnoozed = { ...(prevLog.snoozedUntil || {}) };
          delete nextSnoozed[candidate.key];
          const nextFired = prevLog.fired.includes(candidate.key)
            ? prevLog.fired
            : [...prevLog.fired, candidate.key];

          return {
            ...prev,
            alertLog: {
              d: todayStr,
              fired: nextFired,
              snoozedUntil: nextSnoozed,
            },
          };
        });

        setActiveAlert(candidate);
        if (state.alertsSound !== false) {
          playAlertChime();
        }
        dispatchSystemNotification(
          `HOY · ${candidate.timeStr}`,
          `${candidate.title} (${candidate.subtitle})`,
          candidate.key
        );
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 15000);
    return () => clearInterval(interval);
  }, [
    state.alertsEnabled,
    state.alertsSound,
    state.rut,
    state.routines,
    state.same,
    state.re,
    state.projects,
    state.alertLog,
  ]);

  // Aplicar automáticamente el plan nocturno cuando llega el día siguiente
  useEffect(() => {
    const todayStr = ymd(new Date());
    const planForToday = state.plannedDays?.[todayStr];
    if (!planForToday || state.appliedPlanDate === todayStr) return;

    setState((prev: any) => {
      let nextProjects = Array.isArray(prev.projects) ? [...prev.projects] : [];
      if (
        planForToday.activeProjectId !== undefined &&
        planForToday.activeProjectId !== null
      ) {
        nextProjects = nextProjects.map((p: any) => {
          if (p.id === planForToday.activeProjectId) return { ...p, st: 'haciendo' };
          if (p.st === 'haciendo') return { ...p, st: 'ideas' };
          return p;
        });
      }
      const cleanTask = planForToday.priorityTask?.trim();
      const cleanTime = planForToday.priorityTime?.trim();
      if (cleanTask) {
        const targetIdx = nextProjects.findIndex((p: any) =>
          planForToday.activeProjectId != null
            ? p.id === planForToday.activeProjectId
            : p.st === 'haciendo'
        );
        const newTaskObj = cleanTime
          ? { t: cleanTask, d: false, time: cleanTime }
          : { t: cleanTask, d: false };
        if (targetIdx !== -1) {
          const p = nextProjects[targetIdx];
          const prevTasks = Array.isArray(p.tasks) ? p.tasks : [];
          const already = prevTasks.some(
            (t: any) => t.t?.toLowerCase() === cleanTask.toLowerCase() && !t.d
          );
          if (!already) {
            nextProjects[targetIdx] = { ...p, tasks: [newTaskObj, ...prevTasks] };
          }
        } else {
          nextProjects = [
            ...nextProjects,
            {
              id: Date.now(),
              name: 'Enfoque de hoy',
              step: '',
              st: 'haciendo',
              tasks: [newTaskObj],
            },
          ];
        }
      }

      return {
        ...prev,
        ...(planForToday.routineType
          ? { same: false, re: planForToday.routineType }
          : {}),
        projects: nextProjects,
        appliedPlanDate: todayStr,
      };
    });
  }, [state.plannedDays, state.appliedPlanDate]);

  // Motor de alerta de cierre nocturno (9 PM por defecto, editable)
  useEffect(() => {
    if (state.eveningReviewEnabled === false) return;

    const checkEvening = () => {
      const now = new Date();
      const todayStr = ymd(now);
      const tmrStr = tomorrowYmd();
      if (state.plannedDays?.[tmrStr]) return;
      if (state.eveningPromptedDate === todayStr) return;

      const targetMins =
        parseTimeToMinutes(state.eveningReviewTime || '21:00') ?? 21 * 60;
      const nowMins = now.getHours() * 60 + now.getMinutes();

      if (nowMins >= targetMins) {
        setShowEveningPrompt(true);
        setState((prev: any) => ({ ...prev, eveningPromptedDate: todayStr }));
        if (state.alertsSound !== false) playAlertChime();
        dispatchSystemNotification(
          'HOY · Cierre del día',
          '¿Dejamos todo igual para mañana o quieres organizarlo?',
          `hoy-evening-${todayStr}`
        );
      }
    };

    checkEvening();
    const t = setInterval(checkEvening, 30000);
    return () => clearInterval(t);
  }, [
    state.eveningReviewEnabled,
    state.eveningReviewTime,
    state.eveningPromptedDate,
    state.plannedDays,
    state.alertsSound,
  ]);

  // Respaldo inteligente en la mañana: SOLO si anoche no organizaste ni confirmaste hoy
  useEffect(() => {
    if (introSplash || state.view !== 'hoy') return;
    if (dayOrganizerTarget || showEveningPrompt) return;

    const todayStr = ymd(new Date());
    if (state.plannedDays?.[todayStr]) return;
    if (state.morningPromptedDate === todayStr) return;

    const timer = setTimeout(() => {
      setShowMorningPrompt(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [
    introSplash,
    state.view,
    dayOrganizerTarget,
    showEveningPrompt,
    state.plannedDays,
    state.morningPromptedDate,
  ]);

  const enableAlerts = async () => {
    let perm =
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'unsupported';

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        perm = await Notification.requestPermission();
      } catch {
        perm = Notification.permission;
      }
    }
    setNotifPermission(perm);
    setState((prev: any) => ({ ...prev, alertsEnabled: true }));
    if (state.alertsSound !== false) playAlertChime();

    if (perm === 'granted') {
      say('Alertas activadas con notificaciones del sistema.');
    } else if (perm === 'denied') {
      say('Alertas en pantalla activadas (notificaciones bloqueadas en el navegador).');
    } else {
      say('Alertas en pantalla activadas.');
    }
  };

  const handleAlertDone = () => {
    if (!activeAlert) return;
    if (
      activeAlert.source === 'rutina' &&
      typeof activeAlert.routineIdx === 'number'
    ) {
      const idx = activeAlert.routineIdx;
      setState((prev: any) => {
        const prevRut = prev.rut || { d: ymd(new Date()), x: [] };
        const xList = Array.isArray(prevRut.x) ? prevRut.x : [];
        if (xList.includes(idx)) return prev;
        return {
          ...prev,
          rut: { ...prevRut, x: [...xList, idx] },
        };
      });
      say(praise());
    } else if (
      activeAlert.source === 'proyecto' &&
      typeof activeAlert.projectId === 'number' &&
      typeof activeAlert.taskIdx === 'number'
    ) {
      const { projectId, taskIdx } = activeAlert;
      setState((prev: any) => {
        const projs = (prev.projects || []).map((proj: any) => {
          if (proj.id === projectId && Array.isArray(proj.tasks)) {
            const tasks = [...proj.tasks];
            if (tasks[taskIdx]) {
              tasks[taskIdx] = { ...tasks[taskIdx], d: true };
            }
            return { ...proj, tasks };
          }
          return proj;
        });
        return { ...prev, projects: projs };
      });
      markDay();
      say(praise());
    }
    setActiveAlert(null);
  };

  const handleAlertSnooze = () => {
    if (!activeAlert) return;
    const key = activeAlert.key;
    const todayStr = ymd(new Date());
    const snoozeUntil = Date.now() + 10 * 60 * 1000;
    setState((prev: any) => {
      const prevLog =
        prev.alertLog?.d === todayStr
          ? prev.alertLog
          : { d: todayStr, fired: [], snoozedUntil: {} };
      return {
        ...prev,
        alertLog: {
          ...prevLog,
          snoozedUntil: {
            ...(prevLog.snoozedUntil || {}),
            [key]: snoozeUntil,
          },
        },
      };
    });
    setActiveAlert(null);
    say('Recordatorio pospuesto 10 minutos.');
  };

  const scheduledToday = getScheduledItemsForToday();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nextScheduledItem =
    scheduledToday.find((item) => item.mins >= nowMinutes) || null;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--ink)] antialiased selection:bg-[var(--acc)] selection:text-[var(--accink)]">
      {/* =======================================================
          PANTALLA DE ARRANQUE 5-4-3-2-1 (ANTES DEL PORTAL)
         ======================================================= */}
      {introSplash ? (
        <motion.div
          key="intro-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`min-h-[100dvh] w-full flex flex-col justify-between px-6 py-8 relative overflow-hidden ${
            isDark
              ? 'bg-[#121A20] text-[#E7EEF2]'
              : 'bg-[#3B4CCA] text-white'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 50% 42%, rgba(127, 141, 242, 0.18) 0%, rgba(18, 26, 32, 0) 68%)'
                : 'radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.16) 0%, rgba(43, 57, 168, 0.3) 72%)',
            }}
          />

          <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-center gap-2.5 pt-2">
            <HoyLogo size="sm" variant={isDark ? 'accent' : 'light'} />
            <span className="text-xl font-extrabold tracking-tight">HOY</span>
          </header>

          <main className="relative z-10 w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-7">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r="78"
                  fill="none"
                  stroke={isDark ? 'rgba(127,141,242,0.2)' : 'rgba(255,255,255,0.2)'}
                  strokeWidth="8"
                />
                <circle
                  cx="90"
                  cy="90"
                  r="78"
                  fill="none"
                  stroke={isDark ? '#7F8DF2' : '#FFFFFF'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 78}
                  strokeDashoffset={
                    2 * Math.PI * 78 * (1 - Math.max(0, introCount) / 5)
                  }
                  style={{ transition: 'stroke-dashoffset 0.85s linear' }}
                />
              </svg>

              <motion.span
                key={introCount}
                initial={{ scale: 0.65, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute text-7xl font-extrabold tabular-nums tracking-tight"
              >
                {introCount > 0 ? introCount : '¡YA!'}
              </motion.span>
            </div>

            <div className="space-y-1 max-w-[300px]">
              <p
                className={`text-sm sm:text-base font-semibold ${
                  isDark ? 'text-[#92A3AF]' : 'text-white/80'
                }`}
              >
                No lo pienses. 5, 4, 3, 2, 1
              </p>
              <p
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDark ? 'text-[#E7EEF2]' : 'text-white'
                }`}
              >
                y{' '}
                <span
                  className={
                    isDark
                      ? 'text-[#5CC48A] underline decoration-[#5CC48A]/60 decoration-2 underline-offset-4'
                      : 'text-white underline decoration-white/75 decoration-2 underline-offset-4'
                  }
                >
                  hazlo.
                </span>
              </p>
            </div>
          </main>

          <div className="relative z-10 h-6" aria-hidden="true" />
        </motion.div>
      ) : isWelcome ? (
        <motion.div
          key="welcome-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`min-h-[100dvh] w-full flex flex-col justify-between px-6 pt-5 pb-8 sm:px-10 sm:py-8 relative overflow-hidden ${
            isDark
              ? 'bg-[#121A20] text-[#E7EEF2]'
              : 'bg-[#3B4CCA] text-white'
          }`}
        >
          {/* Sutil profundidad atmosférica arquitectónica */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 50% 35%, rgba(127, 141, 242, 0.16) 0%, rgba(18, 26, 32, 0) 65%)'
                : 'radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.14) 0%, rgba(43, 57, 168, 0.28) 70%)',
            }}
          />

          {/* Barra superior nativa limpia (solo fecha y tema) */}
          <header className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between gap-4">
            <span
              className={`text-xs sm:text-sm font-semibold capitalize tabular-nums ${
                isDark ? 'text-[#92A3AF]' : 'text-white/85'
              }`}
            >
              {formattedToday()}
            </span>

            <button
              onClick={toggleTheme}
              className={`min-h-[44px] px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition active:scale-[0.97] cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-[#1B262E] border-[#2B3A45] text-[#E7EEF2] hover:border-[#7F8DF2]'
                  : 'bg-white/14 border-white/25 text-white hover:bg-white/22'
              }`}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-[#E6B04A]" />
                  <span>Modo claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-white" />
                  <span>Modo oscuro</span>
                </>
              )}
            </button>
          </header>

          {/* Núcleo Visual Central: Emblema + Marca HOY + Gráfico Cinético */}
          <main className="relative z-10 w-full max-w-md mx-auto my-auto py-3 sm:py-6 flex flex-col items-center text-center">
            {/* Dial cinético de carga / enfoque diario (3 clics en H para Admin) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleSecretAdminTap(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSecretAdminTap(false);
              }}
              aria-label="Logotipo HOY"
              className="relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 mb-3.5 sm:mb-5 cursor-pointer select-none focus:outline-none"
            >
              <motion.svg
                viewBox="0 0 144 144"
                className="pointer-events-none absolute inset-0 w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
              >
                <circle
                  cx="72"
                  cy="72"
                  r="66"
                  fill="none"
                  stroke={isDark ? 'rgba(127, 141, 242, 0.22)' : 'rgba(255, 255, 255, 0.22)'}
                  strokeWidth="2"
                  strokeDasharray="6 8"
                />
              </motion.svg>

              <motion.svg
                viewBox="0 0 144 144"
                className="pointer-events-none absolute inset-0 w-full h-full -rotate-90"
              >
                <motion.circle
                  cx="72"
                  cy="72"
                  r="58"
                  fill="none"
                  stroke={isDark ? '#7F8DF2' : '#FFFFFF'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="364"
                  initial={{ strokeDashoffset: 364 }}
                  animate={{ strokeDashoffset: [290, 95, 290] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.svg>

              <div className="relative z-10">
                <HoyLogo size="lg" variant={isDark ? 'accent' : 'light'} />
              </div>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-none mb-2"
            >
              HOY
            </motion.h1>

            {/* Lema limpio de 1 línea */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`text-base sm:text-lg font-medium tracking-tight max-w-xs mb-7 ${
                isDark ? 'text-[#92A3AF]' : 'text-white/85'
              }`}
            >
              El día de empezar es hoy.
            </motion.p>

            {/* Gráfico visual de pulso diario & barras semanales (100% visual, sin ruido) */}
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.22, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-[320px] rounded-2xl border p-4 backdrop-blur-md ${
                isDark
                  ? 'bg-[#1B262E]/85 border-[#2B3A45]'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <svg
                viewBox="0 0 280 86"
                fill="none"
                className="w-full h-20"
                aria-label="Visualización de ritmo semanal y enfoque de hoy"
              >
                {/* Curva de horizonte ascendente */}
                <motion.path
                  d="M 16 62 C 62 56, 98 34, 146 38 C 190 42, 226 18, 264 14"
                  stroke={isDark ? 'rgba(127,141,242,0.45)' : 'rgba(255,255,255,0.45)'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* 7 barras gráficas de ritmo semanal */}
                {[6, 5, 4, 3, 2, 1, 0].map((offset, idx) => {
                  const daysArr = Array.isArray(state.days) ? state.days : [];
                  const dayStr = back(offset);
                  const isDone = daysArr.includes(dayStr);
                  const isToday = offset === 0;
                  const baseHeights = [26, 36, 30, 44, 38, 50, 62];
                  const barH = isDone ? Math.max(baseHeights[idx], 48) : baseHeights[idx];
                  const x = 22 + idx * 36;
                  const y = 74 - barH;
                  const barColor = isToday
                    ? isDark
                      ? '#7F8DF2'
                      : '#FFFFFF'
                    : isDone
                    ? isDark
                      ? '#5CC48A'
                      : '#FFFFFF'
                    : isDark
                    ? 'rgba(146,163,175,0.28)'
                    : 'rgba(255,255,255,0.26)';

                  return (
                    <g key={offset}>
                      <motion.rect
                        x={x}
                        y={y}
                        width="16"
                        height={barH}
                        rx="6"
                        fill={barColor}
                        initial={{ scaleY: 0.2, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{
                          delay: 0.25 + idx * 0.05,
                          duration: 0.45,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{ transformOrigin: `${x + 8}px 74px` }}
                      />
                      {isToday && (
                        <circle
                          cx={x + 8}
                          cy={y - 7}
                          r="3.5"
                          fill={isDark ? '#5CC48A' : '#FFFFFF'}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Iniciales limpias de los 7 días bajo el gráfico */}
              <div className="grid grid-cols-7 px-2 mt-1">
                {[6, 5, 4, 3, 2, 1, 0].map((offset) => {
                  const isToday = offset === 0;
                  return (
                    <span
                      key={offset}
                      className={`text-[11px] font-bold text-center ${
                        isToday
                          ? isDark
                            ? 'text-[#7F8DF2]'
                            : 'text-white'
                          : isDark
                          ? 'text-[#92A3AF]'
                          : 'text-white/65'
                      }`}
                    >
                      {shortDayLetter(offset)}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          </main>

          {/* Zona inferior limpia: CTA Principal Comenzar y Hazte socio */}
          <footer className="relative z-10 w-full max-w-sm mx-auto space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (activeProfile && sessionToken) {
                  setState((prev: any) => ({
                    ...prev,
                    view: 'hoy',
                    hasStarted: true,
                  }));
                  window.scrollTo(0, 0);
                  say(`¡Hola de nuevo, ${activeProfile.name}!`);
                } else {
                  setShowLoginModal(true);
                }
              }}
              className={`w-full min-h-[54px] px-6 rounded-2xl font-extrabold text-base flex items-center justify-between transition cursor-pointer shadow-xl border ${
                isDark
                  ? 'bg-[#7F8DF2] hover:bg-[#909DF6] text-[#10161B] border-white/20 shadow-black/30'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#3B4CCA] border-white shadow-black/20'
              }`}
            >
              <span>Comenzar</span>
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-[#10161B]/12' : 'bg-[#3B4CCA]/10'
                }`}
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </span>
            </motion.button>

            <button
              onClick={() => setShowRegisterModal(true)}
              className={`w-full min-h-[48px] px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-[#1B262E] border-[#2B3A45] text-[#E7EEF2] hover:border-[#7F8DF2]'
                  : 'bg-white/12 border-white/25 text-white hover:bg-white/20'
              }`}
            >
              <Zap className="w-4 h-4 text-[#E6B04A] shrink-0" />
              <span>Hazte socio / Empieza ya</span>
            </button>
          </footer>
        </motion.div>
      ) : (
        /* =======================================================
           INTERFAZ PRINCIPAL DE LA APLICACIÓN
           ======================================================= */
        <div className="min-h-[100dvh] pb-28">
          {/* Barra superior limpia */}
          <header className="sticky top-0 z-40 h-16 backdrop-blur-xl bg-[var(--bg)]/85 border-b border-[var(--line)]">
            <div className="max-w-4xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
              <button
                onClick={() => handleSecretAdminTap(true)}
                className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none shrink-0"
                title="Volver a la portada (3 clics rápidos para Admin)"
              >
                <HoyLogo size="sm" />
                <span className="font-extrabold text-xl tracking-tight text-[var(--ink)] whitespace-nowrap">
                  HOY
                </span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {!isOnline && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--warn)] px-2 py-1">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Offline</span>
                  </span>
                )}

                <button
                  onClick={() => setShowAlertsModal(true)}
                  aria-label="Alertas de horario"
                  className={`min-h-[40px] px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    state.alertsEnabled
                      ? 'bg-[var(--acc)]/12 border-[var(--acc)] text-[var(--acc)]'
                      : 'bg-[var(--card)] border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] hover:border-[var(--acc)]'
                  }`}
                  title="Alertas de horario"
                >
                  {state.alertsEnabled ? (
                    <BellRing className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {state.alertsEnabled ? 'Alertas' : 'Avisos'}
                  </span>
                </button>

                <button
                  onClick={toggleTheme}
                  aria-label="Cambiar tema claro u oscuro"
                  className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:border-[var(--acc)] transition flex items-center justify-center cursor-pointer"
                  title={isDark ? 'Modo claro' : 'Modo oscuro'}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-[var(--warn)]" />
                  ) : (
                    <Moon className="w-4 h-4 text-[var(--acc)]" />
                  )}
                </button>

                {!isInstalled && (
                  <button
                    onClick={handleInstallAction}
                    aria-label="Instalar HOY como aplicación"
                    className="flex min-h-[40px] items-center gap-1.5 text-xs font-bold bg-[var(--acc)] text-[var(--accink)] px-3 sm:px-3.5 rounded-xl hover:opacity-95 transition cursor-pointer whitespace-nowrap"
                    title="Instalar en tu móvil"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Instalar</span>
                  </button>
                )}

                <button
                  onClick={() => setShowConfigModal(true)}
                  aria-label="Cuenta y respaldo"
                  className="min-h-[40px] min-w-[40px] rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--mute)] hover:text-[var(--ink)] hover:border-[var(--acc)] transition flex items-center justify-center cursor-pointer"
                  title="Cuenta y respaldo"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIntroSplash(false);
                    setState((prev: any) => ({
                      ...prev,
                      view: 'welcome',
                      hasStarted: false,
                    }));
                  }}
                  className="min-h-[40px] px-3 rounded-xl border border-[var(--line)] bg-[var(--card)] text-xs font-bold text-[var(--ink)] hover:border-red-500/60 hover:text-red-500 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Salir a portada"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </header>

          {/* Contenido Principal */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
            {/* Banner interactivo de Cierre Nocturno (9 PM) para preparar mañana */}
            <AnimatePresence>
              {showEveningPrompt && (
                <motion.div
                  key="evening-review-banner"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[var(--card)] border-2 border-[var(--acc)] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[var(--acc)]/15 text-[var(--acc)] flex items-center justify-center shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--acc)] tabular-nums">
                        Cierre del día · {state.eveningReviewTime || '21:00'}
                      </p>
                      <h3 className="text-base font-extrabold text-[var(--ink)] leading-snug">
                        ¿Dejamos todo igual para mañana o quieres organizarlo?
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => openDayOrganizer('tomorrow')}
                      className="min-h-[44px] px-4 bg-[var(--acc)] text-[var(--accink)] font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition whitespace-nowrap"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Organizar mañana</span>
                    </button>
                    <button
                      onClick={() => confirmKeepAsIs('tomorrow')}
                      className="min-h-[44px] px-3.5 border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-xs rounded-xl hover:border-[var(--acc)] transition cursor-pointer whitespace-nowrap"
                    >
                      Dejar igual
                    </button>
                    <button
                      onClick={() => setShowEveningPrompt(false)}
                      aria-label="Cerrar aviso nocturno"
                      className="min-h-[44px] min-w-[44px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Banner interactivo de Alerta Activa cuando llega la hora */}
            <AnimatePresence>
              {activeAlert && (
                <motion.div
                  key={activeAlert.key}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[var(--card)] border-2 border-[var(--acc)] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[var(--acc)] text-[var(--accink)] flex items-center justify-center shrink-0">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--acc)] tabular-nums">
                        Ahora · {activeAlert.timeStr} · {activeAlert.subtitle}
                      </p>
                      <h3 className="text-base font-extrabold text-[var(--ink)] leading-snug">
                        {activeAlert.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const alertRef = activeAlert;
                        setActiveAlert(null);
                        startFiveSecondRule(
                          alertRef.title,
                          alertRef.subtitle,
                          alertRef.source === 'rutina' &&
                            typeof alertRef.routineIdx === 'number'
                            ? { kind: 'routine', index: alertRef.routineIdx }
                            : alertRef.source === 'proyecto' &&
                              typeof alertRef.projectId === 'number'
                            ? {
                                kind: 'project',
                                projectId: alertRef.projectId,
                                taskText: alertRef.title,
                                taskIdx: alertRef.taskIdx,
                              }
                            : undefined
                        );
                      }}
                      className="min-h-[44px] px-3.5 bg-[var(--acc)] text-[var(--accink)] font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition whitespace-nowrap"
                    >
                      <Zap className="w-4 h-4" />
                      <span>5s ¡Voy!</span>
                    </button>
                    <button
                      onClick={handleAlertDone}
                      className="min-h-[44px] px-3.5 border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:border-[var(--acc)] transition whitespace-nowrap"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Hecho</span>
                    </button>
                    <button
                      onClick={handleAlertSnooze}
                      className="min-h-[44px] px-3.5 border border-[var(--line)] bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)] font-bold text-xs rounded-xl hover:border-[var(--acc)] transition cursor-pointer whitespace-nowrap"
                    >
                      Posponer 10 min
                    </button>
                    <button
                      onClick={() => setActiveAlert(null)}
                      aria-label="Cerrar aviso"
                      className="min-h-[44px] min-w-[44px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {/* VISTA HOY */}
                {state.view === 'hoy' &&
                  (() => {
                    const leftRoutineIndex = currentRoutineList.findIndex(
                      (_: any, idx: number) =>
                        !(state.rut?.x || []).includes(idx)
                    );
                    const currentStep =
                      leftRoutineIndex !== -1
                        ? currentRoutineList[leftRoutineIndex]
                        : null;
                    const daysArr = Array.isArray(state.days) ? state.days : [];
                    const rutPct =
                      currentRoutineList.length > 0
                        ? (rutDoneCount / currentRoutineList.length) * 100
                        : 100;

                    return (
                      <motion.div
                        key="hoy"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start"
                      >
                        {/* Columna Izquierda: Racha + Rutina Matutina */}
                        <div className="md:col-span-6 space-y-5">
                          {/* Tarjeta de Racha Semanal */}
                          <section className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[var(--warn)]/12 text-[var(--warn)] flex items-center justify-center shrink-0">
                                  <Flame className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-extrabold tabular-nums tracking-tight">
                                      {streakCount}
                                    </span>
                                    <span className="text-sm font-bold text-[var(--mute)]">
                                      {streakCount === 1
                                        ? 'día de racha'
                                        : 'días de racha'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[var(--mute)]">
                                    Últimos 7 días de actividad
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-end gap-1.5">
                                {[6, 5, 4, 3, 2, 1, 0].map((i) => {
                                  const dayStr = back(i);
                                  const isOn = daysArr.includes(dayStr);
                                  const isToday = i === 0;
                                  return (
                                    <div
                                      key={i}
                                      className="flex flex-col items-center gap-1"
                                      title={dayStr}
                                    >
                                      <div
                                        className={`w-5 h-7 rounded-lg border transition-colors ${
                                          isOn
                                            ? 'bg-[var(--ok)] border-[var(--ok)]'
                                            : 'bg-[var(--bg)] border-[var(--line)]'
                                        } ${
                                          isToday
                                            ? 'ring-2 ring-[var(--acc)] ring-offset-1 ring-offset-[var(--card)]'
                                            : ''
                                        }`}
                                      />
                                      <span className="text-[10px] font-bold text-[var(--mute)]">
                                        {shortDayLetter(i)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </section>

                          {/* Tarjeta de Rutina */}
                          <section className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold text-[var(--mute)]">
                                  Rutina{' '}
                                  {currentRoutineKey === 'domingo'
                                    ? 'dominical'
                                    : 'matutina'}
                                </p>
                                <p className="text-sm font-bold tabular-nums text-[var(--ink)] mt-0.5">
                                  {rutDoneCount} de {currentRoutineList.length}{' '}
                                  completados
                                </p>
                              </div>
                              <ProgressRing progress={rutPct} />
                            </div>

                            {currentStep ? (
                              <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1.5">
                                  {currentStep[1] && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--acc)] tabular-nums">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{currentStep[1]}</span>
                                    </div>
                                  )}
                                  <h3 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                                    {currentStep[0]}
                                  </h3>
                                </div>

                                {/medit/i.test(currentStep[0]) && (
                                  <p className="text-xs text-[var(--mute)] leading-relaxed">
                                    Espalda recta, ojos cerrados y 5 minutos de respiración consciente.
                                  </p>
                                )}
                                {/ejercicio/i.test(currentStep[0]) && (
                                  <p className="text-xs text-[var(--mute)] leading-relaxed">
                                    Circuito rápido: 10 sentadillas, 8 flexiones, 20 s de plancha.
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() =>
                                      startFiveSecondRule(
                                        currentStep[0],
                                        'Rutina matutina',
                                        { kind: 'routine', index: leftRoutineIndex }
                                      )
                                    }
                                    className="min-h-[48px] px-4 border border-[var(--acc)]/35 bg-[var(--acc)]/10 text-[var(--acc)] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-[var(--acc)]/18 transition cursor-pointer whitespace-nowrap"
                                  >
                                    <Zap className="w-4 h-4" />
                                    <span>5s ¡Ya!</span>
                                  </motion.button>

                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setState((prev: any) => {
                                        const prevRut = prev.rut || {
                                          d: ymd(new Date()),
                                          x: [],
                                        };
                                        const xList = Array.isArray(prevRut.x)
                                          ? prevRut.x
                                          : [];
                                        return {
                                          ...prev,
                                          rut: {
                                            ...prevRut,
                                            x: [...xList, leftRoutineIndex],
                                          },
                                        };
                                      });
                                      const newXLen =
                                        (state.rut?.x || []).length + 1;
                                      if (
                                        newXLen >= currentRoutineList.length
                                      ) {
                                        say(
                                          '¡Rutina completa! Ya ganaste la mañana.'
                                        );
                                      } else {
                                        say(praise());
                                      }
                                    }}
                                    className="flex-1 min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition hover:opacity-95 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Hecho</span>
                                  </motion.button>

                                  <button
                                    onClick={() => {
                                      setState((prev: any) => {
                                        const prevRut = prev.rut || {
                                          d: ymd(new Date()),
                                          x: [],
                                        };
                                        const xList = Array.isArray(prevRut.x)
                                          ? prevRut.x
                                          : [];
                                        return {
                                          ...prev,
                                          rut: {
                                            ...prevRut,
                                            x: [...xList, leftRoutineIndex],
                                          },
                                        };
                                      });
                                    }}
                                    className="min-h-[48px] px-3.5 border border-[var(--line)] rounded-xl text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] hover:border-[var(--acc)] transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                                  >
                                    <SkipForward className="w-3.5 h-3.5" />
                                    <span>Saltar</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="py-5 text-center space-y-2 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                                <div className="w-11 h-11 bg-[var(--ok)]/15 text-[var(--ok)] rounded-full flex items-center justify-center mx-auto">
                                  <Trophy className="w-5 h-5" />
                                </div>
                                <p className="text-base font-extrabold text-[var(--ok)]">
                                  Rutina matutina completada
                                </p>
                                <p className="text-xs text-[var(--mute)]">
                                  Has comenzado tu día con enfoque.
                                </p>
                              </div>
                            )}

                            <div className="pt-3 border-t border-[var(--line)] flex justify-between items-center">
                              <button
                                onClick={() =>
                                  setState((prev: any) => ({
                                    ...prev,
                                    view: 'rutina',
                                  }))
                                }
                                className="text-xs font-bold text-[var(--mute)] hover:text-[var(--acc)] flex items-center gap-1.5 py-1 cursor-pointer transition"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Personalizar rutina</span>
                              </button>
                              {rutDoneCount > 0 && (
                                <button
                                  onClick={() =>
                                    setState((prev: any) => ({
                                      ...prev,
                                      rut: { d: ymd(new Date()), x: [] },
                                    }))
                                  }
                                  className="text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] py-1 cursor-pointer transition"
                                >
                                  Reiniciar hoy
                                </button>
                              )}
                            </div>
                          </section>
                        </div>

                        {/* Columna Derecha: Proyecto Activo */}
                        <div className="md:col-span-6 space-y-5">
                          {!currentProject ? (
                            <section className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-sm text-center space-y-4">
                              <div className="w-12 h-12 bg-[var(--acc)]/12 text-[var(--acc)] rounded-2xl flex items-center justify-center mx-auto">
                                <FolderKanban className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-lg font-extrabold tracking-tight">
                                  Sin proyecto activo
                                </h3>
                                <p className="text-xs text-[var(--mute)]">
                                  Selecciona un proyecto para enfocarte hoy.
                                </p>
                              </div>
                              <div className="flex gap-2.5">
                                <button
                                  onClick={() =>
                                    setState((prev: any) => ({
                                      ...prev,
                                      view: 'proys',
                                      f: 'ideas',
                                    }))
                                  }
                                  className="flex-1 min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-bold text-sm rounded-xl cursor-pointer transition hover:opacity-95"
                                >
                                  Elegir proyecto
                                </button>
                                <button
                                  onClick={() =>
                                    setState((prev: any) => ({
                                      ...prev,
                                      view: 'nuevo',
                                    }))
                                  }
                                  className="min-h-[48px] px-4 border border-[var(--line)] font-bold text-sm rounded-xl hover:border-[var(--acc)] cursor-pointer transition"
                                >
                                  Crear nuevo
                                </button>
                              </div>
                            </section>
                          ) : (
                            (() => {
                              const tasks = Array.isArray(currentProject.tasks)
                                ? currentProject.tasks
                                : [];
                              const doneTasks = tasks.filter(
                                (t: any) => t.d
                              ).length;
                              const nextT = getNextTask(currentProject);
                              const isTodayDone = daysArr.includes(back(0));
                              const pct =
                                tasks.length > 0
                                  ? Math.round((doneTasks / tasks.length) * 100)
                                  : 0;

                              return (
                                <section className="bg-[var(--acc)] text-[var(--accink)] rounded-2xl p-6 shadow-lg space-y-5 relative overflow-hidden">
                                  <div className="flex items-center justify-between gap-3 text-xs font-bold opacity-90">
                                    <span>Proyecto activo</span>
                                    <span className="tabular-nums">
                                      {isTodayDone
                                        ? 'Avanzado hoy · '
                                        : ''}
                                      {pct}%
                                    </span>
                                  </div>

                                  <div className="space-y-2.5">
                                    <h3 className="text-2xl font-extrabold tracking-tight leading-snug">
                                      {currentProject.name}
                                    </h3>

                                    {tasks.length > 0 && (
                                      <div className="space-y-1.5">
                                        <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                                          <div
                                            className="h-full bg-[var(--accink)] transition-all duration-500 rounded-full"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                        <p className="text-xs opacity-85 tabular-nums">
                                          {doneTasks} de {tasks.length}{' '}
                                          pendientes completados
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {nextT ? (
                                    <div className="space-y-3 pt-1">
                                      <div className="p-4 rounded-xl bg-black/15 border border-white/15 space-y-1">
                                        <div className="flex items-center justify-between text-[11px] font-bold opacity-80">
                                          <span>Siguiente paso</span>
                                          {nextT.time && (
                                            <span className="flex items-center gap-1 tabular-nums">
                                              <Clock className="w-3 h-3" />
                                              {nextT.time}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-base font-extrabold leading-snug">
                                          {nextT.t}
                                        </p>
                                      </div>

                                      <div className="space-y-2.5">
                                        <motion.button
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() =>
                                            startFiveSecondRule(
                                              nextT.t,
                                              currentProject.name,
                                              {
                                                kind: 'project',
                                                projectId: currentProject.id,
                                                taskText: nextT.t,
                                              }
                                            )
                                          }
                                          className="w-full min-h-[48px] bg-[var(--accink)] text-[var(--acc)] font-extrabold text-sm rounded-xl shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                          <Zap className="w-4 h-4" />
                                          <span>5, 4, 3, 2, 1 · Empezar ahora</span>
                                        </motion.button>

                                        <motion.button
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => {
                                            setState((prev: any) => {
                                              const projs = (
                                                prev.projects || []
                                              ).map((p: any) => {
                                                if (p.id === currentProject.id) {
                                                  const updatedTasks = (
                                                    p.tasks || []
                                                  ).map((tk: any) =>
                                                    tk.t === nextT.t && !tk.d
                                                      ? { ...tk, d: true }
                                                      : tk
                                                  );
                                                  return {
                                                    ...p,
                                                    tasks: updatedTasks,
                                                  };
                                                }
                                                return p;
                                              });
                                              return { ...prev, projects: projs };
                                            });
                                            markDay();
                                            say(praise());
                                          }}
                                          className="w-full min-h-[46px] bg-black/22 hover:bg-black/32 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                          <Check className="w-4 h-4 stroke-[3]" />
                                          <span>Terminé este pendiente</span>
                                        </motion.button>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                          onClick={() => {
                                            markDay();
                                            say(
                                              `${praise()} Avance registrado.`
                                            );
                                          }}
                                          className="min-h-[44px] bg-black/18 hover:bg-black/28 font-bold text-xs rounded-xl transition cursor-pointer"
                                        >
                                          Avancé hoy
                                        </button>
                                        <button
                                          onClick={() =>
                                            setState((prev: any) => ({
                                              ...prev,
                                              sel: currentProject.id,
                                              view: 'det',
                                            }))
                                          }
                                          className="min-h-[44px] bg-black/18 hover:bg-black/28 font-bold text-xs rounded-xl transition cursor-pointer"
                                        >
                                          Ver lista completa
                                        </button>
                                      </div>
                                    </div>
                                  ) : tasks.length > 0 ? (
                                    <div className="space-y-3 pt-1 text-center">
                                      <p className="text-lg font-extrabold">
                                        Todos los pendientes completados
                                      </p>
                                      <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                          onClick={() =>
                                            moveProject(
                                              currentProject.id,
                                              'esperando'
                                            )
                                          }
                                          className="min-h-[44px] bg-black/20 hover:bg-black/30 font-bold text-xs rounded-xl cursor-pointer transition"
                                        >
                                          Pasar a Esperando
                                        </button>
                                        <button
                                          onClick={() =>
                                            moveProject(
                                              currentProject.id,
                                              'terminado'
                                            )
                                          }
                                          className="min-h-[44px] bg-[var(--accink)] text-[var(--acc)] font-extrabold text-xs rounded-xl cursor-pointer transition"
                                        >
                                          Marcar Terminado
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3 pt-1 text-center">
                                      <p className="text-sm font-semibold opacity-90">
                                        Aún no hay pendientes en este proyecto.
                                      </p>
                                      <button
                                        onClick={() =>
                                          setState((prev: any) => ({
                                            ...prev,
                                            sel: currentProject.id,
                                            view: 'det',
                                          }))
                                        }
                                        className="w-full min-h-[48px] bg-[var(--accink)] text-[var(--acc)] font-bold text-sm rounded-xl cursor-pointer transition"
                                      >
                                        Agregar pendientes
                                      </button>
                                    </div>
                                  )}
                                </section>
                              );
                            })()
                          )}

                          {(() => {
                            const tmrReady = !!state.plannedDays?.[tomorrowYmd()];
                            return (
                              <button
                                onClick={() => openDayOrganizer('tomorrow')}
                                className={`w-full min-h-[48px] px-4 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                                  tmrReady
                                    ? 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ink)]'
                                    : 'bg-[var(--card)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--acc)]'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Calendar
                                    className={`w-4 h-4 ${
                                      tmrReady ? 'text-[var(--ok)]' : 'text-[var(--acc)]'
                                    }`}
                                  />
                                  <span>
                                    {tmrReady
                                      ? 'Plan de mañana listo (editar)'
                                      : 'Preparar mañana'}
                                  </span>
                                </span>
                                <span
                                  className={
                                    tmrReady
                                      ? 'text-[var(--ok)] font-extrabold'
                                      : 'text-[var(--mute)]'
                                  }
                                >
                                  {tmrReady ? 'Listo ✓' : state.eveningReviewTime || '21:00'}
                                </span>
                              </button>
                            );
                          })()}

                          {activeProfile && (
                            <button
                              onClick={() => void handleLogoutCloudSession()}
                              className="w-full min-h-[44px] border border-[var(--line)] bg-[var(--card)] rounded-xl text-xs font-bold text-[var(--mute)] hover:text-red-500 hover:border-red-500/40 flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Cerrar sesión ({activeProfile.phone})</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}

                {/* VISTA PROYECTOS */}
                {state.view === 'proys' &&
                  (() => {
                    const currentFilter = state.f || 'todos';
                    const chips = [
                      ['todos', 'Todos', projectsList.length] as const,
                      ...ST.map(
                        ([k, label]) =>
                          [
                            k,
                            label,
                            projectsList.filter((p: any) => p.st === k).length,
                          ] as const
                      ),
                    ];

                    const filteredProjects = projectsList
                      .filter(
                        (p: any) =>
                          currentFilter === 'todos' || p.st === currentFilter
                      )
                      .sort((a: any, b: any) => {
                        const ordA = ST.findIndex((s) => s[0] === a.st);
                        const ordB = ST.findIndex((s) => s[0] === b.st);
                        return ordA - ordB;
                      });

                    return (
                      <motion.div
                        key="proys"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-extrabold tracking-tight">
                              Proyectos
                            </h2>
                            <p className="text-xs text-[var(--mute)]">
                              Ideas · Haciendo · Esperando · Terminado
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setState((prev: any) => ({
                                ...prev,
                                view: 'nuevo',
                              }))
                            }
                            className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold bg-[var(--acc)] text-[var(--accink)] px-4 rounded-xl hover:opacity-95 transition cursor-pointer whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo proyecto</span>
                          </button>
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                          {chips.map(([key, label, count]) => (
                            <button
                              key={key}
                              onClick={() =>
                                setState((prev: any) => ({ ...prev, f: key }))
                              }
                              aria-pressed={currentFilter === key}
                              className={`min-h-[40px] font-bold text-xs px-3.5 rounded-xl whitespace-nowrap transition cursor-pointer border tabular-nums ${
                                currentFilter === key
                                  ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                                  : 'bg-[var(--card)] text-[var(--mute)] border-[var(--line)] hover:border-[var(--acc)]'
                              }`}
                            >
                              {label} ({count})
                            </button>
                          ))}
                        </div>

                        {filteredProjects.length === 0 ? (
                          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-8 text-center space-y-4">
                            <p className="text-sm font-semibold text-[var(--mute)]">
                              No hay proyectos en esta categoría.
                            </p>
                            <button
                              onClick={() =>
                                setState((prev: any) => ({
                                  ...prev,
                                  view: 'nuevo',
                                }))
                              }
                              className="min-h-[44px] px-5 bg-[var(--acc)] text-[var(--accink)] rounded-xl font-bold text-xs cursor-pointer"
                            >
                              Crear nuevo proyecto
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {filteredProjects.map((p: any) => {
                              const tasks = Array.isArray(p.tasks)
                                ? p.tasks
                                : [];
                              const done = tasks.filter((t: any) => t.d).length;
                              const nextT = getNextTask(p);
                              const stLabel =
                                ST.find((s) => s[0] === p.st)?.[1] || p.st;
                              const pct =
                                tasks.length > 0
                                  ? Math.round((done / tasks.length) * 100)
                                  : 0;

                              return (
                                <motion.button
                                  key={p.id}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() =>
                                    setState((prev: any) => ({
                                      ...prev,
                                      sel: p.id,
                                      view: 'det',
                                    }))
                                  }
                                  className="w-full text-left bg-[var(--card)] border border-[var(--line)] hover:border-[var(--acc)] transition rounded-2xl p-5 cursor-pointer shadow-sm space-y-3"
                                >
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span
                                      className={
                                        p.st === 'haciendo'
                                          ? 'text-[var(--acc)]'
                                          : 'text-[var(--mute)]'
                                      }
                                    >
                                      {stLabel}
                                    </span>
                                    <span className="text-[var(--mute)] tabular-nums">
                                      {tasks.length > 0
                                        ? `${done}/${tasks.length}`
                                        : 'Sin tareas'}
                                    </span>
                                  </div>

                                  <h3 className="text-base font-extrabold text-[var(--ink)] leading-snug">
                                    {p.name}
                                  </h3>

                                  {tasks.length > 0 && (
                                    <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                                      <div
                                        className="h-full bg-[var(--acc)] rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  )}

                                  {nextT && (
                                    <p className="text-xs text-[var(--mute)] truncate">
                                      Sigue: {nextT.t}
                                    </p>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}

                {/* VISTA DETALLE PROYECTO */}
                {state.view === 'det' &&
                  (() => {
                    const p = projectsList.find(
                      (proj: any) => proj.id === state.sel
                    );
                    if (!p) {
                      setTimeout(
                        () =>
                          setState((prev: any) => ({ ...prev, view: 'proys' })),
                        0
                      );
                      return null;
                    }

                    const stLabel = ST.find((s) => s[0] === p.st)?.[1] || p.st;
                    const projectTasks = Array.isArray(p.tasks) ? p.tasks : [];

                    return (
                      <motion.div
                        key="det"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="max-w-2xl mx-auto space-y-4"
                      >
                        <button
                          onClick={() =>
                            setState((prev: any) => ({
                              ...prev,
                              view: 'proys',
                              sel: null,
                              del: null,
                            }))
                          }
                          className="min-h-[40px] text-xs font-bold text-[var(--mute)] flex items-center gap-1.5 hover:text-[var(--ink)] transition cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Volver a proyectos</span>
                        </button>

                        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-[var(--acc)]">
                              {stLabel}
                            </span>
                            <h2 className="text-2xl font-extrabold tracking-tight">
                              {p.name}
                            </h2>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            {p.st !== 'haciendo' && (
                              <button
                                onClick={() => moveProject(p.id, 'haciendo')}
                                className="min-h-[44px] px-3 bg-[var(--acc)] text-[var(--accink)] font-bold rounded-xl text-xs col-span-2 cursor-pointer transition hover:opacity-95"
                              >
                                Hacer activo (trabajar hoy)
                              </button>
                            )}
                            {p.st !== 'esperando' && (
                              <button
                                onClick={() => moveProject(p.id, 'esperando')}
                                className="min-h-[44px] px-3 border border-[var(--line)] font-bold rounded-xl text-xs hover:border-[var(--acc)] cursor-pointer transition"
                              >
                                Esperando respuesta
                              </button>
                            )}
                            {p.st !== 'terminado' && (
                              <button
                                onClick={() => moveProject(p.id, 'terminado')}
                                className="min-h-[44px] px-3 border border-[var(--line)] font-bold rounded-xl text-xs hover:border-[var(--ok)] cursor-pointer transition"
                              >
                                Marcar terminado
                              </button>
                            )}
                            {p.st !== 'ideas' && (
                              <button
                                onClick={() => moveProject(p.id, 'ideas')}
                                className="min-h-[44px] px-3 border border-[var(--line)] font-bold rounded-xl text-xs col-span-2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer transition"
                              >
                                Mover a Ideas
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-[var(--mute)]">
                            Lista de pendientes
                          </h3>

                          <div className="divide-y divide-[var(--line)]">
                            {projectTasks.length === 0 ? (
                              <p className="text-xs text-[var(--mute)] py-2">
                                No hay pendientes todavía. Agrega uno abajo.
                              </p>
                            ) : (
                              projectTasks.map((x: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 py-3"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(x.d)}
                                    onChange={() => {
                                      setState((prev: any) => {
                                        const projs = (
                                          prev.projects || []
                                        ).map((proj: any) => {
                                          if (proj.id === p.id) {
                                            const tasks = Array.isArray(
                                              proj.tasks
                                            )
                                              ? [...proj.tasks]
                                              : [];
                                            tasks[idx] = {
                                              ...tasks[idx],
                                              d: !tasks[idx].d,
                                            };
                                            return { ...proj, tasks };
                                          }
                                          return proj;
                                        });
                                        return { ...prev, projects: projs };
                                      });
                                      if (!x.d) say(praise());
                                    }}
                                    className="w-5 h-5 accent-[var(--ok)] rounded cursor-pointer shrink-0"
                                  />
                                  <span
                                    className={`text-sm flex-1 ${
                                      x.d
                                        ? 'line-through text-[var(--mute)]'
                                        : 'font-medium text-[var(--ink)]'
                                    }`}
                                  >
                                    {x.t}
                                  </span>
                                  <input
                                    type="time"
                                    value={x.time || ''}
                                    aria-label="Hora de recordatorio"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setState((prev: any) => {
                                        const projs = (
                                          prev.projects || []
                                        ).map((proj: any) => {
                                          if (proj.id === p.id) {
                                            const tasks = Array.isArray(
                                              proj.tasks
                                            )
                                              ? [...proj.tasks]
                                              : [];
                                            tasks[idx] = {
                                              ...tasks[idx],
                                              time: val,
                                            };
                                            return { ...proj, tasks };
                                          }
                                          return proj;
                                        });
                                        return { ...prev, projects: projs };
                                      });
                                    }}
                                    style={{ width: '116px', padding: '7px 10px' }}
                                    className="text-xs font-bold tabular-nums shrink-0"
                                    title="Hora opcional para alerta"
                                  />
                                  <button
                                    onClick={() => {
                                      setState((prev: any) => {
                                        const projs = (
                                          prev.projects || []
                                        ).map((proj: any) => {
                                          if (proj.id === p.id) {
                                            const tasks = Array.isArray(
                                              proj.tasks
                                            )
                                              ? proj.tasks.filter(
                                                  (_: any, i: number) =>
                                                    i !== idx
                                                )
                                              : [];
                                            return { ...proj, tasks };
                                          }
                                          return proj;
                                        });
                                        return { ...prev, projects: projs };
                                      });
                                    }}
                                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--mute)] hover:text-red-500 transition cursor-pointer"
                                    title="Eliminar pendiente"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Escribe un nuevo pendiente..."
                              value={state.newTaskText || ''}
                              onChange={(e) =>
                                setState((prev: any) => ({
                                  ...prev,
                                  newTaskText: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === 'Enter' &&
                                  state.newTaskText?.trim()
                                ) {
                                  const val = state.newTaskText.trim();
                                  const timeVal = state.newTaskTime || '';
                                  setState((prev: any) => {
                                    const projs = (prev.projects || []).map(
                                      (proj: any) => {
                                        if (proj.id === p.id) {
                                          const existing = Array.isArray(
                                            proj.tasks
                                          )
                                            ? proj.tasks
                                            : [];
                                          return {
                                            ...proj,
                                            tasks: [
                                              ...existing,
                                              {
                                                t: val,
                                                d: false,
                                                ...(timeVal
                                                  ? { time: timeVal }
                                                  : {}),
                                              },
                                            ],
                                          };
                                        }
                                        return proj;
                                      }
                                    );
                                    return {
                                      ...prev,
                                      projects: projs,
                                      newTaskText: '',
                                      newTaskTime: '',
                                    };
                                  });
                                }
                              }}
                              className="flex-1"
                            />
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={state.newTaskTime || ''}
                                onChange={(e) =>
                                  setState((prev: any) => ({
                                    ...prev,
                                    newTaskTime: e.target.value,
                                  }))
                                }
                                style={{ width: '124px' }}
                                className="tabular-nums font-bold shrink-0"
                                aria-label="Hora opcional del pendiente"
                                title="Hora opcional para recibir alerta"
                              />
                              <button
                                onClick={() => {
                                  if (!state.newTaskText?.trim()) return;
                                  const val = state.newTaskText.trim();
                                  const timeVal = state.newTaskTime || '';
                                  setState((prev: any) => {
                                    const projs = (prev.projects || []).map(
                                      (proj: any) => {
                                        if (proj.id === p.id) {
                                          const existing = Array.isArray(
                                            proj.tasks
                                          )
                                            ? proj.tasks
                                            : [];
                                          return {
                                            ...proj,
                                            tasks: [
                                              ...existing,
                                              {
                                                t: val,
                                                d: false,
                                                ...(timeVal
                                                  ? { time: timeVal }
                                                  : {}),
                                              },
                                            ],
                                          };
                                        }
                                        return proj;
                                      }
                                    );
                                    return {
                                      ...prev,
                                      projects: projs,
                                      newTaskText: '',
                                      newTaskTime: '',
                                    };
                                  });
                                }}
                                className="min-h-[48px] px-5 bg-[var(--acc)] text-[var(--accink)] font-bold rounded-xl text-xs whitespace-nowrap cursor-pointer hover:opacity-95 transition flex-1 sm:flex-initial"
                              >
                                Añadir
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (state.del === p.id) {
                              setState((prev: any) => ({
                                ...prev,
                                projects: (prev.projects || []).filter(
                                  (proj: any) => proj.id !== p.id
                                ),
                                del: null,
                                view: 'proys',
                                sel: null,
                              }));
                              say('Proyecto eliminado.');
                            } else {
                              setState((prev: any) => ({ ...prev, del: p.id }));
                              say('Toca otra vez para confirmar eliminación.');
                            }
                          }}
                          className="w-full min-h-[44px] text-xs font-bold text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl hover:bg-red-500/15 transition cursor-pointer"
                        >
                          {state.del === p.id
                            ? 'Confirmar eliminación de proyecto'
                            : 'Eliminar este proyecto'}
                        </button>
                      </motion.div>
                    );
                  })()}

                {/* VISTA RUTINAS */}
                {state.view === 'rutina' &&
                  (() => {
                    const routineKey =
                      state.same === false ? state.re || 'semana' : 'semana';
                    const routineList =
                      routinesObj[
                        routineKey === 'domingo' ? 'domingo' : 'semana'
                      ] || DEFAULT_RUT;

                    return (
                      <motion.div
                        key="rutina"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="max-w-2xl mx-auto space-y-4"
                      >
                        <button
                          onClick={() =>
                            setState((prev: any) => ({ ...prev, view: 'hoy' }))
                          }
                          className="min-h-[40px] text-xs font-bold text-[var(--mute)] flex items-center gap-1.5 hover:text-[var(--ink)] transition cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Volver a Hoy</span>
                        </button>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-2xl font-extrabold tracking-tight">
                            Personalizar rutina
                          </h2>

                          {state.same === false ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() =>
                                  setState((prev: any) => ({
                                    ...prev,
                                    re: 'semana',
                                  }))
                                }
                                className={`min-h-[40px] text-xs font-bold px-3.5 rounded-xl border transition cursor-pointer ${
                                  routineKey === 'semana'
                                    ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                                    : 'bg-[var(--card)] text-[var(--mute)] border-[var(--line)]'
                                }`}
                              >
                                Lunes a Sábado
                              </button>
                              <button
                                onClick={() =>
                                  setState((prev: any) => ({
                                    ...prev,
                                    re: 'domingo',
                                  }))
                                }
                                className={`min-h-[40px] text-xs font-bold px-3.5 rounded-xl border transition cursor-pointer ${
                                  routineKey === 'domingo'
                                    ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                                    : 'bg-[var(--card)] text-[var(--mute)] border-[var(--line)]'
                                }`}
                              >
                                Domingo
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setState((prev: any) => {
                                  const semanaList =
                                    prev.routines?.semana || DEFAULT_RUT;
                                  return {
                                    ...prev,
                                    same: false,
                                    routines: {
                                      ...prev.routines,
                                      domingo: semanaList.map((r: any) => [
                                        ...r,
                                      ]),
                                    },
                                    re: 'domingo',
                                    rut: { ...prev.rut, x: [] },
                                  };
                                });
                              }}
                              className="text-xs font-bold text-[var(--acc)] hover:underline cursor-pointer"
                            >
                              Personalizar domingo aparte
                            </button>
                          )}
                        </div>

                        <div className="space-y-2.5">
                          {routineList.map((r: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-3.5 flex flex-wrap sm:flex-nowrap items-center gap-2.5"
                            >
                              <input
                                type="text"
                                value={r[0]}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setState((prev: any) => {
                                    const rKey =
                                      prev.same === false
                                        ? prev.re || 'semana'
                                        : 'semana';
                                    const list = [
                                      ...(prev.routines?.[rKey] || DEFAULT_RUT),
                                    ];
                                    list[idx] = [val, list[idx][1]];
                                    return {
                                      ...prev,
                                      routines: {
                                        ...prev.routines,
                                        [rKey]: list,
                                      },
                                    };
                                  });
                                }}
                                className="flex-1 min-w-[180px] font-semibold"
                              />
                              <input
                                type="text"
                                value={r[1]}
                                style={{ width: '88px' }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setState((prev: any) => {
                                    const rKey =
                                      prev.same === false
                                        ? prev.re || 'semana'
                                        : 'semana';
                                    const list = [
                                      ...(prev.routines?.[rKey] || DEFAULT_RUT),
                                    ];
                                    list[idx] = [list[idx][0], val];
                                    return {
                                      ...prev,
                                      routines: {
                                        ...prev.routines,
                                        [rKey]: list,
                                      },
                                    };
                                  });
                                }}
                                className="text-center font-bold tabular-nums shrink-0"
                              />
                              <div className="flex items-center gap-1 ml-auto shrink-0">
                                <button
                                  onClick={() => {
                                    if (idx > 0) {
                                      setState((prev: any) => {
                                        const rKey =
                                          prev.same === false
                                            ? prev.re || 'semana'
                                            : 'semana';
                                        const list = [
                                          ...(prev.routines?.[rKey] ||
                                            DEFAULT_RUT),
                                        ];
                                        const tmp = list[idx];
                                        list[idx] = list[idx - 1];
                                        list[idx - 1] = tmp;
                                        return {
                                          ...prev,
                                          routines: {
                                            ...prev.routines,
                                            [rKey]: list,
                                          },
                                          rut: { ...prev.rut, x: [] },
                                        };
                                      });
                                    }
                                  }}
                                  className="min-h-[40px] min-w-[40px] rounded-xl bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
                                  title="Subir paso"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (idx < routineList.length - 1) {
                                      setState((prev: any) => {
                                        const rKey =
                                          prev.same === false
                                            ? prev.re || 'semana'
                                            : 'semana';
                                        const list = [
                                          ...(prev.routines?.[rKey] ||
                                            DEFAULT_RUT),
                                        ];
                                        const tmp = list[idx];
                                        list[idx] = list[idx + 1];
                                        list[idx + 1] = tmp;
                                        return {
                                          ...prev,
                                          routines: {
                                            ...prev.routines,
                                            [rKey]: list,
                                          },
                                          rut: { ...prev.rut, x: [] },
                                        };
                                      });
                                    }
                                  }}
                                  className="min-h-[40px] min-w-[40px] rounded-xl bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
                                  title="Bajar paso"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setState((prev: any) => {
                                      const rKey =
                                        prev.same === false
                                          ? prev.re || 'semana'
                                          : 'semana';
                                      const list = (
                                        prev.routines?.[rKey] || DEFAULT_RUT
                                      ).filter((_: any, i: number) => i !== idx);
                                      return {
                                        ...prev,
                                        routines: {
                                          ...prev.routines,
                                          [rKey]: list,
                                        },
                                        rut: { ...prev.rut, x: [] },
                                      };
                                    });
                                  }}
                                  className="min-h-[40px] min-w-[40px] rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center cursor-pointer"
                                  title="Eliminar paso"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 space-y-3">
                          <h3 className="text-xs font-bold text-[var(--mute)]">
                            Añadir nuevo paso
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <input
                              type="text"
                              placeholder="Ej: Leer 10 páginas"
                              value={state.newRoutineName || ''}
                              onChange={(e) =>
                                setState((prev: any) => ({
                                  ...prev,
                                  newRoutineName: e.target.value,
                                }))
                              }
                              className="sm:col-span-3"
                            />
                            <input
                              type="text"
                              placeholder="7:15"
                              value={state.newRoutineTime || ''}
                              onChange={(e) =>
                                setState((prev: any) => ({
                                  ...prev,
                                  newRoutineTime: e.target.value,
                                }))
                              }
                              className="text-center tabular-nums"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const name = state.newRoutineName?.trim();
                              if (!name) {
                                say('Escribe el nombre del paso.');
                                return;
                              }
                              const time = state.newRoutineTime?.trim() || '';
                              setState((prev: any) => {
                                const rKey =
                                  prev.same === false
                                    ? prev.re || 'semana'
                                    : 'semana';
                                const list = [
                                  ...(prev.routines?.[rKey] || DEFAULT_RUT),
                                  [name, time],
                                ];
                                return {
                                  ...prev,
                                  routines: { ...prev.routines, [rKey]: list },
                                  newRoutineName: '',
                                  newRoutineTime: '',
                                };
                              });
                              say('Paso añadido a la rutina.');
                            }}
                            className="w-full min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-bold rounded-xl text-sm cursor-pointer transition hover:opacity-95"
                          >
                            Agregar a la rutina
                          </button>
                        </div>

                        {state.same === false && (
                          <button
                            onClick={() => {
                              setState((prev: any) => ({
                                ...prev,
                                same: true,
                                re: 'semana',
                                rut: { ...prev.rut, x: [] },
                              }));
                              say('Rutina unificada para toda la semana.');
                            }}
                            className="w-full py-3 text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] transition text-center cursor-pointer"
                          >
                            Usar la misma rutina de lunes a domingo
                          </button>
                        )}
                      </motion.div>
                    );
                  })()}

                {/* VISTA NUEVO PROYECTO */}
                {state.view === 'nuevo' && (
                  <motion.div
                    key="nuevo"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="max-w-xl mx-auto space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-extrabold tracking-tight">
                        Nuevo proyecto
                      </h2>
                      <button
                        onClick={() =>
                          setState((prev: any) => ({ ...prev, view: 'proys' }))
                        }
                        className="text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--mute)] mb-1.5">
                          Nombre del proyecto
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Rediseño web para cliente"
                          value={state.newProjectName || ''}
                          onChange={(e) =>
                            setState((prev: any) => ({
                              ...prev,
                              newProjectName: e.target.value,
                            }))
                          }
                          className="font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--mute)] mb-1.5">
                          Pendientes (uno por línea)
                        </label>
                        <textarea
                          rows={6}
                          placeholder={
                            'Definir objetivos\nCrear estructura inicial\nRevisar resultados'
                          }
                          value={state.newProjectTasks || ''}
                          onChange={(e) =>
                            setState((prev: any) => ({
                              ...prev,
                              newProjectTasks: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        <button
                          onClick={() => {
                            const name = state.newProjectName?.trim();
                            if (!name) return say('Escribe un nombre.');
                            const tasks = (state.newProjectTasks || '')
                              .split('\n')
                              .map((x: string) => x.trim())
                              .filter(Boolean)
                              .map((t: string) => ({ t, d: false }));
                            const newProj = {
                              id: Date.now(),
                              name,
                              step: '',
                              st: 'ideas',
                              tasks,
                            };
                            setState((prev: any) => ({
                              ...prev,
                              projects: [...(prev.projects || []), newProj],
                              view: 'proys',
                              f: 'ideas',
                              newProjectName: '',
                              newProjectTasks: '',
                            }));
                            say('Proyecto guardado en Ideas.');
                            window.scrollTo(0, 0);
                          }}
                          className="min-h-[48px] border border-[var(--line)] bg-[var(--bg)] font-bold text-sm rounded-xl hover:border-[var(--acc)] transition cursor-pointer"
                        >
                          Guardar en Ideas
                        </button>
                        <button
                          onClick={() => {
                            const name = state.newProjectName?.trim();
                            if (!name) return say('Escribe un nombre.');
                            const tasks = (state.newProjectTasks || '')
                              .split('\n')
                              .map((x: string) => x.trim())
                              .filter(Boolean)
                              .map((t: string) => ({ t, d: false }));
                            const newProj = {
                              id: Date.now(),
                              name,
                              step: '',
                              st: 'haciendo',
                              tasks,
                            };
                            setState((prev: any) => {
                              const projs = Array.isArray(prev.projects)
                                ? prev.projects
                                : [];
                              const updated = projs.map((p: any) =>
                                p.st === 'haciendo' ? { ...p, st: 'ideas' } : p
                              );
                              return {
                                ...prev,
                                projects: [...updated, newProj],
                                view: 'hoy',
                                newProjectName: '',
                                newProjectTasks: '',
                              };
                            });
                            say('Proyecto activo en Hoy.');
                            window.scrollTo(0, 0);
                          }}
                          className="min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-bold text-sm rounded-xl hover:opacity-95 transition cursor-pointer"
                        >
                          Guardar y activar hoy
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </main>

          {/* Barra inferior fija estilo app nativa */}
          <nav className="fixed left-0 right-0 bottom-0 z-40 bg-[var(--card)]/92 backdrop-blur-xl border-t border-[var(--line)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="max-w-lg mx-auto px-3 py-2 grid grid-cols-3 gap-2">
              {[
                ['hoy', 'Hoy', Sun],
                ['proys', 'Proyectos', FolderKanban],
                ['nuevo', 'Nuevo', Plus],
              ].map(([key, label, Icon]: any) => {
                const isActive =
                  state.view === key ||
                  (state.view === 'det' && key === 'proys') ||
                  (state.view === 'rutina' && key === 'hoy');
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setState((prev: any) => ({
                        ...prev,
                        view: key,
                        re:
                          key === 'hoy' &&
                          new Date().getDay() === 0 &&
                          prev.same === false
                            ? 'domingo'
                            : prev.re,
                      }));
                      window.scrollTo(0, 0);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 font-bold text-xs rounded-2xl cursor-pointer transition ${
                      isActive
                        ? 'text-[var(--acc)]'
                        : 'text-[var(--mute)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-[var(--acc)]/10 rounded-2xl -z-10"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'
                      }`}
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="fixed left-4 right-4 bottom-24 max-w-md mx-auto bg-[var(--ink)] text-[var(--bg)] px-4 py-3.5 rounded-2xl text-xs font-bold z-[100] shadow-2xl flex items-center gap-3 border border-[var(--line)]/20"
          >
            <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt automático de instalación PWA al ingresar */}
      <AnimatePresence>
        {!isWelcome &&
          !isInstalled &&
          showInstallBanner &&
          !showInstallGuide &&
          !showMorningPrompt &&
          !dayOrganizerTarget && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-3 right-3 bottom-20 sm:bottom-24 max-w-md mx-auto z-50 rounded-3xl bg-[var(--card)] text-[var(--ink)] p-4 sm:p-5 shadow-2xl border border-[var(--line)]"
          >
            <div className="flex items-start gap-3.5">
              <HoyLogo size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold tracking-tight leading-tight">
                      Instala HOY en tu móvil
                    </h3>
                    <p className="text-xs text-[var(--mute)] mt-1 leading-relaxed">
                      {isInstallable
                        ? 'Ábrela desde tu pantalla de inicio como app nativa, sin barras del navegador.'
                        : isIOS
                        ? 'Añádela a tu pantalla de inicio en iPhone para usarla como aplicación nativa.'
                        : isMobile
                        ? 'Agrégala a tu pantalla de inicio para abrirla al instante como app nativa.'
                        : 'Instala HOY en tu dispositivo para acceso directo y modo sin conexión.'}
                    </p>
                  </div>
                  <button
                    onClick={dismissInstallBanner}
                    aria-label="Cerrar aviso de instalación"
                    className="min-h-[32px] min-w-[32px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3.5">
                  <button
                    onClick={handleInstallAction}
                    className="flex-1 min-h-[44px] px-4 bg-[var(--acc)] text-[var(--accink)] font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>
                      {isInstallable ? 'Instalar ahora' : 'Instalar como app'}
                    </span>
                  </button>
                  <button
                    onClick={dismissInstallBanner}
                    className="min-h-[44px] px-3.5 border border-[var(--line)] bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)] font-bold text-xs rounded-xl transition cursor-pointer whitespace-nowrap"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Guía / Instalación PWA Multiplataforma */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 shadow-2xl border border-[var(--line)] space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <HoyLogo size="sm" />
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    Instalar HOY como App
                  </h3>
                  <p className="text-[11px] font-semibold text-[var(--mute)]">
                    {isIOS
                      ? 'iPhone / iPad (Safari)'
                      : isAndroid
                      ? 'Android (Chrome / Edge)'
                      : 'Instalación directa'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                aria-label="Cerrar"
                className="min-h-[36px] min-w-[36px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInstallable ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--mute)] leading-relaxed">
                  Tu dispositivo ya está listo para instalar <strong>HOY</strong> en un solo toque.
                </p>
                <button
                  onClick={handleInstallAction}
                  className="w-full min-h-[48px] bg-[var(--acc)] text-[var(--accink)] rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar ahora</span>
                </button>
              </div>
            ) : isIOS ? (
              <div className="space-y-2.5 text-xs text-[var(--mute)] leading-relaxed">
                <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] p-3">
                  <Share className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
                  <span>
                    1. Toca el botón <strong className="text-[var(--ink)]">Compartir</strong> en la barra inferior de Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] p-3">
                  <Smartphone className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
                  <span>
                    2. Desliza y elige <strong className="text-[var(--ink)]">Añadir a pantalla de inicio</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-[var(--mute)] leading-relaxed">
                <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] p-3">
                  <MoreVertical className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
                  <span>
                    1. Abre el menú del navegador (<strong className="text-[var(--ink)]">⋮</strong> arriba a la derecha en Chrome o Edge).
                  </span>
                </div>
                <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--bg)] border border-[var(--line)] p-3">
                  <Smartphone className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
                  <span>
                    2. Toca <strong className="text-[var(--ink)]">Instalar aplicación</strong> o <strong className="text-[var(--ink)]">Añadir a pantalla de inicio</strong>.
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full min-h-[46px] bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] rounded-xl font-bold text-sm cursor-pointer hover:border-[var(--acc)] transition"
            >
              Entendido
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal Configuración de Alertas de Horario */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 shadow-2xl border border-[var(--line)] space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  Alertas de horario
                </h3>
                <p className="text-xs text-[var(--mute)] mt-1">
                  Recibe avisos dentro de HOY cuando llegue la hora de tu rutina o pendiente programado.
                </p>
              </div>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="min-h-[36px] min-w-[36px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (state.alertsEnabled) {
                    setState((prev: any) => ({ ...prev, alertsEnabled: false }));
                    say('Alertas desactivadas.');
                  } else {
                    enableAlerts();
                  }
                }}
                className={`w-full min-h-[52px] px-4 rounded-2xl border flex items-center justify-between font-bold text-sm transition cursor-pointer ${
                  state.alertsEnabled
                    ? 'bg-[var(--acc)]/12 border-[var(--acc)] text-[var(--ink)]'
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--acc)]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {state.alertsEnabled ? (
                    <BellRing className="w-4 h-4 text-[var(--acc)]" />
                  ) : (
                    <BellOff className="w-4 h-4 text-[var(--mute)]" />
                  )}
                  <span>Alertas automáticas</span>
                </span>
                <span
                  className={`text-xs font-extrabold ${
                    state.alertsEnabled ? 'text-[var(--acc)]' : 'text-[var(--mute)]'
                  }`}
                >
                  {state.alertsEnabled ? 'Activas' : 'Apagadas'}
                </span>
              </button>

              <button
                onClick={() =>
                  setState((prev: any) => ({
                    ...prev,
                    alertsSound: prev.alertsSound === false,
                  }))
                }
                className="w-full min-h-[48px] px-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] flex items-center justify-between font-bold text-sm hover:border-[var(--acc)] transition cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  {state.alertsSound !== false ? (
                    <Volume2 className="w-4 h-4 text-[var(--acc)]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[var(--mute)]" />
                  )}
                  <span>Sonido de aviso</span>
                </span>
                <span className="text-xs font-bold text-[var(--mute)]">
                  {state.alertsSound !== false ? 'Activado' : 'Silencio'}
                </span>
              </button>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                    <Moon className="w-4 h-4 text-[var(--acc)]" />
                    <span>Cierre nocturno (para mañana)</span>
                  </span>
                  <button
                    onClick={() =>
                      setState((prev: any) => ({
                        ...prev,
                        eveningReviewEnabled: prev.eveningReviewEnabled === false,
                      }))
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                      state.eveningReviewEnabled !== false
                        ? 'bg-[var(--acc)]/15 text-[var(--acc)]'
                        : 'bg-[var(--card)] text-[var(--mute)] border border-[var(--line)]'
                    }`}
                  >
                    {state.eveningReviewEnabled !== false ? 'Activo' : 'Apagado'}
                  </button>
                </div>
                {state.eveningReviewEnabled !== false && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[var(--mute)]">
                      Hora de aviso:
                    </span>
                    <input
                      type="time"
                      value={state.eveningReviewTime || '21:00'}
                      onChange={(e) =>
                        setState((prev: any) => ({
                          ...prev,
                          eveningReviewTime: e.target.value || '21:00',
                        }))
                      }
                      className="w-28 text-center text-xs font-bold tabular-nums"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bg)] border border-[var(--line)] p-4 space-y-1.5">
              <p className="text-xs font-bold text-[var(--mute)]">
                Próximo horario programado hoy
              </p>
              {nextScheduledItem ? (
                <p className="text-sm font-extrabold text-[var(--ink)] tabular-nums">
                  {nextScheduledItem.timeStr} · {nextScheduledItem.title}
                </p>
              ) : (
                <p className="text-xs text-[var(--mute)]">
                  No quedan avisos pendientes para lo que resta de hoy.
                </p>
              )}
              {notifPermission === 'denied' && (
                <p className="text-[11px] text-[var(--warn)] pt-1">
                  Las notificaciones del navegador están bloqueadas en la configuración del sitio; verás las alertas en pantalla mientras HOY esté abierta.
                </p>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={async () => {
                  await enableAlerts();
                  const demoItem = nextScheduledItem || {
                    key: `test-${Date.now()}`,
                    source: 'rutina' as const,
                    title: 'Prueba de alerta de HOY',
                    subtitle: 'Recordatorio instantáneo',
                    timeStr: new Date().toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  };
                  setActiveAlert(demoItem);
                  dispatchSystemNotification(
                    `HOY · ${demoItem.timeStr}`,
                    demoItem.title,
                    'hoy-test'
                  );
                  setShowAlertsModal(false);
                }}
                className="flex-1 min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-bold text-sm rounded-xl cursor-pointer hover:opacity-95 transition"
              >
                Probar alerta ahora
              </button>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="min-h-[48px] px-5 border border-[var(--line)] font-bold text-sm rounded-xl hover:border-[var(--acc)] cursor-pointer transition"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Respaldo Matutino (solo si anoche no organizaste hoy) */}
      {showMorningPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 shadow-2xl border border-[var(--line)] space-y-5"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[var(--acc)]/12 text-[var(--acc)] flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  ¿Cómo arrancamos hoy?
                </h3>
                <p className="text-xs text-[var(--mute)] mt-1 leading-relaxed">
                  ¿Seguimos con tu organización inicial o ajustamos tu día en 30 segundos?
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => confirmKeepAsIs('today')}
                className="w-full min-h-[50px] bg-[var(--acc)] text-[var(--accink)] font-extrabold text-sm rounded-xl hover:opacity-95 transition cursor-pointer"
              >
                Seguir con la organización inicial
              </button>
              <button
                onClick={() => openDayOrganizer('today')}
                className="w-full min-h-[48px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-sm rounded-xl hover:border-[var(--acc)] transition cursor-pointer"
              >
                Organizar mi día
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Organizador Rápido de 2 Pasos (Hoy o Mañana) */}
      {dayOrganizerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 shadow-2xl border border-[var(--line)] max-h-[90vh] overflow-y-auto space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {dayOrganizerTarget === 'tomorrow'
                    ? 'Organizar mañana'
                    : 'Organizar tu día de hoy'}
                </h3>
                <p className="text-xs text-[var(--mute)] mt-1">
                  Solo 2 pasos rápidos para despertar sin dudas y actuar directo.
                </p>
              </div>
              <button
                onClick={() => setDayOrganizerTarget(null)}
                aria-label="Cerrar organizador"
                className="min-h-[36px] min-w-[36px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Paso 1: Rutina */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--mute)]">
                1. ¿Qué rutina usarás?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setOrgRoutine('semana')}
                  className={`min-h-[48px] px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    orgRoutine === 'semana'
                      ? 'bg-[var(--acc)] text-[var(--accink)] border-[var(--acc)]'
                      : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--acc)]'
                  }`}
                >
                  Rutina habitual
                </button>
                <button
                  onClick={() => setOrgRoutine('domingo')}
                  className={`min-h-[48px] px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    orgRoutine === 'domingo'
                      ? 'bg-[var(--acc)] text-[var(--accink)] border-[var(--acc)]'
                      : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--acc)]'
                  }`}
                >
                  Día ligero (Domingo)
                </button>
              </div>
            </div>

            {/* Paso 2: Proyecto principal y prioridad #1 */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[var(--mute)]">
                2. Proyecto principal y prioridad #1
              </label>
              {projectsList.filter((p: any) => p.st !== 'terminado').length > 0 && (
                <div className="space-y-1.5">
                  {projectsList
                    .filter((p: any) => p.st !== 'terminado')
                    .slice(0, 5)
                    .map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => setOrgProjectId(p.id)}
                        className={`w-full min-h-[44px] px-3.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          orgProjectId === p.id
                            ? 'bg-[var(--acc)]/12 border-[var(--acc)] text-[var(--ink)]'
                            : 'bg-[var(--bg)] border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <span className="truncate pr-2">{p.name}</span>
                        {orgProjectId === p.id && (
                          <Check className="w-4 h-4 text-[var(--acc)] shrink-0" />
                        )}
                      </button>
                    ))}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={orgPriorityTask}
                  onChange={(e) => setOrgPriorityTask(e.target.value)}
                  placeholder="Prioridad #1 (opcional, ej: Enviar reporte)"
                  className="text-xs font-semibold"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--mute)]">
                    Hora de aviso (opcional):
                  </span>
                  <input
                    type="time"
                    value={orgPriorityTime}
                    onChange={(e) => setOrgPriorityTime(e.target.value)}
                    className="w-28 text-center text-xs font-bold tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={saveDayOrganizer}
                className="flex-1 min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-extrabold text-sm rounded-xl cursor-pointer hover:opacity-95 transition"
              >
                {dayOrganizerTarget === 'tomorrow'
                  ? 'Guardar plan de mañana'
                  : 'Guardar para hoy'}
              </button>
              <button
                onClick={() => setDayOrganizerTarget(null)}
                className="min-h-[48px] px-4 border border-[var(--line)] font-bold text-sm rounded-xl hover:border-[var(--acc)] cursor-pointer transition"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Cuenta y Respaldo (sin inputs de API keys) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 shadow-2xl border border-[var(--line)] max-h-[90vh] overflow-y-auto space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[var(--acc)]/12 text-[var(--acc)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    Cuenta y Respaldo
                  </h3>
                  <p className="text-xs text-[var(--mute)] mt-0.5">
                    {cloudStatus.supabaseConfigured
                      ? 'Sincronización automática activa con Supabase.'
                      : 'Guardado localmente en este navegador.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                aria-label="Cerrar"
                className="min-h-[36px] min-w-[36px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeProfile ? (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 space-y-1.5 text-xs">
                <p className="font-extrabold text-[var(--ink)] text-sm">
                  {activeProfile.name}
                </p>
                <p className="font-mono font-bold text-[var(--acc)]">
                  {activeProfile.phone}
                </p>
                <p className="text-[var(--mute)]">
                  Plan {activeProfile.plan || 'Vitalicio'} · Sesión vigente por 7 días
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-xs text-[var(--mute)] leading-relaxed">
                Tus rutinas y proyectos se guardan automáticamente en este dispositivo. Inicia sesión desde portada con tu WhatsApp para sincronizar entre dispositivos.
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  try {
                    const { subscribers: _omit, ...exportPayload } = state;
                    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
                      type: 'application/json;charset=utf-8',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `hoy-respaldo-${ymd(new Date())}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    say('Respaldo descargado.');
                  } catch {
                    say('No se pudo exportar el respaldo.');
                  }
                }}
                className="w-full min-h-[46px] border border-[var(--line)] bg-[var(--bg)] font-bold text-xs rounded-xl hover:border-[var(--acc)] cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar respaldo JSON</span>
              </button>

              {activeProfile && (
                <button
                  onClick={() => void handleLogoutCloudSession()}
                  className="w-full min-h-[46px] border border-red-500/30 bg-red-500/8 text-red-500 font-bold text-xs rounded-xl hover:bg-red-500/15 cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión en este dispositivo</span>
                </button>
              )}

              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full min-h-[46px] bg-[var(--acc)] text-[var(--accink)] font-bold text-sm rounded-xl hover:opacity-95 cursor-pointer transition"
              >
                Listo
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pantalla inmersiva Regla de los 5 Segundos (5-4-3-2-1) */}
      <AnimatePresence>
        {launchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 ${
              isDark
                ? 'bg-[#121A20] text-[#E7EEF2]'
                : 'bg-[#3B4CCA] text-white'
            }`}
          >
            <header className="w-full max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HoyLogo size="sm" variant={isDark ? 'accent' : 'light'} />
                <span className="text-xs font-extrabold uppercase tracking-wider opacity-85">
                  Regla 5-4-3-2-1
                </span>
              </div>
              <button
                onClick={() => setLaunchModal(null)}
                aria-label="Cerrar modo enfoque"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-white/12 hover:bg-white/20 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-6">
              {launchModal.phase === 'countdown' ? (
                <>
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={isDark ? 'rgba(127,141,242,0.22)' : 'rgba(255,255,255,0.22)'}
                        strokeWidth="8"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={isDark ? '#7F8DF2' : '#FFFFFF'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={
                          2 * Math.PI * 70 * (1 - launchModal.count / 5)
                        }
                        style={{ transition: 'stroke-dashoffset 0.85s linear' }}
                      />
                    </svg>
                    <motion.span
                      key={launchModal.count}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute text-6xl font-extrabold tabular-nums"
                    >
                      {launchModal.count > 0 ? launchModal.count : '¡YA!'}
                    </motion.span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold opacity-80">
                      {launchModal.subtitle}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                      {launchModal.title}
                    </h2>
                    <p className="text-sm opacity-80 pt-1">
                      Sin pensarlo dos veces. Al llegar a cero, solo empieza.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold tracking-wide border ${
                      isDark
                        ? 'bg-[#5CC48A]/18 text-[#5CC48A] border-[#5CC48A]/35'
                        : 'bg-white/15 text-white border-white/25'
                    }`}
                  >
                    ¡AHORA! ESTÁS EN MARCHA
                  </div>

                  <div className="text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight">
                    {String(Math.floor(launchModal.elapsedSec / 60)).padStart(2, '0')}:
                    {String(launchModal.elapsedSec % 60).padStart(2, '0')}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold opacity-80">
                      {launchModal.subtitle}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                      {launchModal.title}
                    </h2>
                  </div>
                </>
              )}
            </div>

            <footer className="w-full max-w-sm mx-auto space-y-2.5">
              {launchModal.phase === 'countdown' ? (
                <button
                  onClick={() => {
                    if (state.alertsSound !== false) playCountdownTick(true);
                    triggerHaptic(true);
                    setLaunchModal((prev) =>
                      prev ? { ...prev, phase: 'focus', count: 0, elapsedSec: 0 } : null
                    );
                  }}
                  className={`w-full min-h-[54px] rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xl transition ${
                    isDark
                      ? 'bg-[#7F8DF2] text-[#10161B]'
                      : 'bg-white text-[#3B4CCA]'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>¡Empezar ya!</span>
                </button>
              ) : (
                <>
                  {launchModal.target && (
                    <button
                      onClick={completeLaunchTask}
                      className={`w-full min-h-[54px] rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xl transition ${
                        isDark
                          ? 'bg-[#5CC48A] text-[#10161B]'
                          : 'bg-white text-[#3B4CCA]'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>¡Listo, completado!</span>
                    </button>
                  )}
                  <button
                    onClick={() => setLaunchModal(null)}
                    className="w-full min-h-[48px] rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 font-bold text-sm cursor-pointer transition"
                  >
                    Volver a Hoy
                  </button>
                </>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal Formulario de Inscripción ("Hazte socio") */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 sm:p-7 shadow-2xl border border-[var(--line)] space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase text-[var(--acc)] tracking-wider">
                  Membresía HOY
                </span>
                <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
                  Únete a HOY
                </h3>
                <p className="text-xs text-[var(--mute)] mt-1">
                  Completa tus datos para recibir las instrucciones de acceso por WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                aria-label="Cerrar"
                className="min-h-[36px] min-w-[36px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--mute)] mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej: Sofía Valenzuela"
                  className="w-full min-h-[52px] px-4 font-extrabold text-sm sm:text-base bg-[var(--bg)] border-2 border-[var(--line)] focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc)]/25 rounded-2xl shadow-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--mute)] mb-1.5">
                  Número de WhatsApp
                </label>
                <div className="flex gap-2.5">
                  <select
                    value={regCountryCode}
                    onChange={(e) => setRegCountryCode(e.target.value)}
                    className="w-32 min-h-[52px] px-3 text-center font-extrabold text-xs sm:text-sm shrink-0 bg-[var(--bg)] border-2 border-[var(--line)] focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc)]/25 rounded-2xl shadow-sm outline-none cursor-pointer transition"
                  >
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+56">🇨🇱 +56</option>
                  </select>
                  <input
                    type="tel"
                    value={regPhoneNum}
                    onChange={(e) => setRegPhoneNum(e.target.value)}
                    placeholder="999 888 777"
                    className="flex-1 min-h-[52px] px-4 font-extrabold text-sm sm:text-base bg-[var(--bg)] border-2 border-[var(--line)] focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc)]/25 rounded-2xl shadow-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--mute)] mb-1.5">
                  Ciudad y País
                </label>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Ej: Lima, Perú"
                  className="w-full min-h-[52px] px-4 font-extrabold text-sm sm:text-base bg-[var(--bg)] border-2 border-[var(--line)] focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc)]/25 rounded-2xl shadow-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--mute)] mb-1.5">
                  Plan de membresía
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['Vitalicio', 'S/ 75'],
                      ['Trimestral', 'S/ 55'],
                      ['Mensual', 'S/ 25'],
                    ] as const
                  ).map(([planName, priceLabel]) => (
                    <button
                      key={planName}
                      type="button"
                      onClick={() => setRegPlan(planName)}
                      className={`min-h-[48px] px-2 py-2 rounded-2xl border-2 text-center transition cursor-pointer ${
                        regPlan === planName
                          ? 'border-[var(--acc)] bg-[var(--acc)]/12 text-[var(--ink)]'
                          : 'border-[var(--line)] bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{planName}</div>
                      <div className="text-[11px] font-mono font-bold tabular-nums">
                        {priceLabel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                disabled={isRegBusy}
                onClick={async () => {
                  const name = regName.trim();
                  const phoneNumClean = regPhoneNum.trim();
                  const city = regCity.trim();
                  if (!name || !phoneNumClean) {
                    say('Por favor ingresa tu nombre y teléfono.');
                    return;
                  }

                  const planAmount =
                    regPlan === 'Vitalicio' ? 75 : regPlan === 'Trimestral' ? 55 : 25;
                  const phone = `${regCountryCode} ${phoneNumClean}`;

                  setIsRegBusy(true);
                  let createdSub: SubscriberRecord = {
                    id: Date.now(),
                    name,
                    phone,
                    city: city || 'No especificada',
                    status: 'pendiente',
                    plan: regPlan,
                    amount: planAmount,
                    paymentMethod: 'Por definir',
                    paymentStatus: 'pendiente',
                    date: ymd(new Date()),
                    payments: [],
                  };
                  let whatsappSent = false;

                  try {
                    const res = await fetch('/api/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name,
                        countryCode: regCountryCode,
                        phoneNum: phoneNumClean,
                        city: city || 'No especificada',
                        plan: regPlan,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      say(data.error || 'No se pudo completar el registro.');
                      setIsRegBusy(false);
                      return;
                    }
                    if (data.subscriber) {
                      createdSub = data.subscriber;
                    }
                    whatsappSent = Boolean(data.whatsappSent);
                  } catch {
                    // Respaldo local en caso de estar offline
                  } finally {
                    setIsRegBusy(false);
                  }

                  setState((prev: any) => ({
                    ...prev,
                    subscribers: [
                      createdSub,
                      ...(prev.subscribers || []).filter(
                        (s: any) =>
                          s.phone.replace(/\s+/g, '') !==
                          createdSub.phone.replace(/\s+/g, '')
                      ),
                    ],
                  }));

                  setLastRegSummary({
                    plan: regPlan,
                    amount: planAmount,
                    whatsappSent,
                  });
                  setShowRegisterModal(false);
                  setRegName('');
                  setRegCountryCode('+51');
                  setRegPhoneNum('');
                  setRegCity('');
                  setRegPlan('Vitalicio');
                  setShowPaymentModal(true);
                }}
                className="flex-1 min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-extrabold text-sm rounded-xl cursor-pointer hover:opacity-95 disabled:opacity-60 transition"
              >
                {isRegBusy ? 'Registrando...' : 'Enviar y ver pago por WhatsApp'}
              </button>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="min-h-[48px] px-4 border border-[var(--line)] font-bold text-sm rounded-xl hover:border-[var(--acc)] cursor-pointer transition"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Información de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 sm:p-7 shadow-2xl border border-[var(--line)] space-y-5"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--ok)]/15 text-[var(--ok)] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-[var(--ok)] tracking-wider">
                  ¡Registro exitoso!
                </span>
                <h3 className="text-lg font-extrabold tracking-tight mt-0.5">
                  Instrucciones de pago
                </h3>
                <p className="text-xs text-[var(--mute)] mt-1 leading-relaxed">
                  {lastRegSummary.whatsappSent
                    ? 'Te hemos enviado los detalles a tu WhatsApp. Realiza tu pago mediante los siguientes métodos:'
                    : 'Guarda estas instrucciones de pago y envía tu comprobante por WhatsApp:'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 space-y-2 text-xs">
              <p className="font-bold text-[var(--ink)]">💳 Yape / Plin / Transferencia:</p>
              <p className="font-mono font-bold text-[var(--acc)]">+51 999 888 777 (Titular: HOY App)</p>
              <p className="font-bold text-[var(--ink)] pt-1">💵 Monto:</p>
              <p className="font-bold text-[var(--ink)]">
                S/ {lastRegSummary.amount.toFixed(2)} PEN (Plan {lastRegSummary.plan})
              </p>
            </div>

            <p className="text-[11px] text-[var(--mute)] italic">
              * Una vez realizado el pago, envíanos tu comprobante y el administrador activará tu acceso a tu WhatsApp.
            </p>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-bold text-sm rounded-xl cursor-pointer hover:opacity-95 transition"
            >
              Entendido, volver a la app
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal PIN de Admin para CRM */}
      {adminPinModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xs rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 shadow-2xl border border-[var(--line)] space-y-4 text-center"
          >
            <h3 className="text-base font-extrabold tracking-tight">
              Acceso Administrador CRM
            </h3>
            <p className="text-xs text-[var(--mute)]">
              Ingresa tu clave maestra para acceder al panel
            </p>
            <form onSubmit={handleAdminPinSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type={showAdminPin ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="off"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    if (adminPinError) setAdminPinError('');
                  }}
                  placeholder="••••"
                  className="text-center font-extrabold text-xl tracking-widest w-full min-h-[48px] px-10 bg-[var(--bg)] border-2 border-[var(--line)] focus:border-[var(--acc)] rounded-2xl shadow-sm outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPin((v) => !v)}
                  aria-label={showAdminPin ? 'Ocultar clave' : 'Ver clave'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                >
                  {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {adminPinError && (
                <p className="text-xs font-bold text-red-500">{adminPinError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] bg-[var(--acc)] text-[var(--accink)] font-bold text-xs rounded-xl cursor-pointer hover:opacity-95 transition"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPinModal(false);
                    setAdminPinInput('');
                    setAdminPinError('');
                    setShowAdminPin(false);
                  }}
                  className="min-h-[44px] px-4 border border-[var(--line)] text-xs font-bold rounded-xl cursor-pointer hover:border-[var(--acc)] transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CRM Panel Administrativo Interactivo */}
      {showAdminCrmModal && (
        <AdminCrmModal
          subscribers={state.subscribers || []}
          onUpdateSubscribers={(nextSubscribers) =>
            setState((prev: any) => ({ ...prev, subscribers: nextSubscribers }))
          }
          onClose={() => setShowAdminCrmModal(false)}
          onNotify={say}
          todayStr={ymd(new Date())}
          isSyncing={crmSyncing}
          onRefreshCloud={() => fetchAdminSubscribers(adminVerifiedPin || '1982')}
          onCreateSubscriber={async (record) => {
            if (!cloudStatus.supabaseConfigured) return;
            const res = await fetch('/api/admin/subscribers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-pin': adminVerifiedPin || '1982',
              },
              body: JSON.stringify(record),
            });
            const data = await res.json();
            if (!res.ok) {
              say(data.error || 'Error guardando cliente en Supabase.');
              void fetchAdminSubscribers(adminVerifiedPin || '1982');
              return;
            }
            if (data.subscriber) return data.subscriber;
          }}
          onPatchSubscriber={async (sub, patch) => {
            if (!cloudStatus.supabaseConfigured || !sub.dbId) return;
            const res = await fetch('/api/admin/subscribers', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-pin': adminVerifiedPin || '1982',
              },
              body: JSON.stringify({
                dbId: sub.dbId,
                action: 'update',
                patch,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              say(data.error || 'Error actualizando cliente en Supabase.');
              void fetchAdminSubscribers(adminVerifiedPin || '1982');
              return;
            }
            if (data.subscriber) return data.subscriber;
          }}
          onApproveSubscriber={async (sub) => {
            if (!cloudStatus.supabaseConfigured || !sub.dbId) return;
            const res = await fetch('/api/admin/subscribers', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-pin': adminVerifiedPin || '1982',
              },
              body: JSON.stringify({
                dbId: sub.dbId,
                action: 'approve',
                amount: sub.amount,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              say(data.error || 'Error aprobando pago en Supabase.');
              void fetchAdminSubscribers(adminVerifiedPin || '1982');
              return;
            }
            if (data.subscriber) return data.subscriber;
          }}
          onAddPaymentEntry={async (sub, entry: PaymentEntry) => {
            if (!cloudStatus.supabaseConfigured || !sub.dbId) return;
            const res = await fetch('/api/admin/subscribers', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-pin': adminVerifiedPin || '1982',
              },
              body: JSON.stringify({
                dbId: sub.dbId,
                action: 'add_payment',
                payment: entry,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              say(data.error || 'Error registrando cobro en Supabase.');
              void fetchAdminSubscribers(adminVerifiedPin || '1982');
              return;
            }
            if (data.subscriber) return data.subscriber;
          }}
          onDeleteSubscriber={async (sub) => {
            if (!cloudStatus.supabaseConfigured || !sub.dbId) return;
            const res = await fetch(
              `/api/admin/subscribers?id=${encodeURIComponent(sub.dbId)}`,
              {
                method: 'DELETE',
                headers: {
                  'x-admin-pin': adminVerifiedPin || '1982',
                },
              }
            );
            if (!res.ok) {
              say('No se pudo eliminar el cliente en Supabase.');
              void fetchAdminSubscribers(adminVerifiedPin || '1982');
            }
          }}
        />
      )}
      {/* Modal de Inicio de Sesión / OTP por WhatsApp al dar Comenzar */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-[var(--card)] text-[var(--ink)] p-6 sm:p-7 shadow-2xl border border-[var(--line)] space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[var(--acc)]/15 text-[var(--acc)] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {loginStep === 'phone' ? 'Ingresa tu WhatsApp' : 'Verifica tu código'}
                  </h3>
                  <p className="text-xs text-[var(--mute)] mt-0.5">
                    {loginStep === 'phone'
                      ? 'Te enviaremos un código OTP instantáneo por WhatsApp.'
                      : `Código enviado a ${loginCountryCode} ${loginPhoneNum}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginStep('phone');
                  setLoginPhoneNum('');
                  setLoginOtpCode('');
                  setOtpHintMessage('');
                }}
                aria-label="Cerrar"
                className="min-h-[36px] min-w-[36px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loginStep === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--mute)] mb-1.5">
                    Número de teléfono móvil
                  </label>
                  <div className="flex gap-2.5">
                    <select
                      value={loginCountryCode}
                      onChange={(e) => setLoginCountryCode(e.target.value)}
                      className="w-32 min-h-[52px] px-3 text-center font-extrabold text-xs sm:text-sm shrink-0 bg-[var(--bg)] border-2 border-[var(--line)] focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc)]/25 rounded-2xl shadow-sm outline-none cursor-pointer transition"
                    >
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+56">🇨🇱 +56</option>
                    </select>
                    <input
                      type="tel"
                      value={loginPhoneNum}
                      onChange={(e) => setLoginPhoneNum(e.target.value)}
                      placeholder="999 888 777"
                      className="flex-1 min-h-[52px] px-4 font-extrabold text-sm sm:text-base bg-[var(--bg)] border-2 border-[var(--line)] focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc)]/25 rounded-2xl shadow-sm outline-none transition"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  disabled={isAuthBusy}
                  onClick={async () => {
                    const phoneClean = loginPhoneNum.trim();
                    if (!phoneClean || phoneClean.replace(/\D/g, '').length < 6) {
                      say('Ingresa un número de teléfono válido.');
                      return;
                    }

                    setIsAuthBusy(true);
                    try {
                      const res = await fetch('/api/auth/request-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          countryCode: loginCountryCode,
                          phoneNum: phoneClean,
                          sessionToken,
                        }),
                      });
                      const data = await res.json();

                      if (!res.ok) {
                        say(data.error || 'No se pudo iniciar sesión.');
                        return;
                      }

                      if (data.mode === 'supabase') {
                        if (data.skipOtp && data.profile) {
                          applyAuthenticatedProfileState(
                            data.profile,
                            data.progressData,
                            true
                          );
                          setShowLoginModal(false);
                          setLoginStep('phone');
                          setLoginPhoneNum('');
                          setLoginOtpCode('');
                          window.scrollTo(0, 0);
                          say(`¡Bienvenido de nuevo, ${data.profile.name}!`);
                          return;
                        }

                        setSimulatedOtp(data.devOtp || '');
                        setOtpHintMessage(
                          data.devOtp
                            ? `Modo prueba (n8n pendiente): tu código es ${data.devOtp}`
                            : 'Código enviado por WhatsApp. Válido por 10 minutos.'
                        );
                        setLoginStep('otp');
                        say(
                          data.whatsappSent
                            ? 'Código OTP enviado a tu WhatsApp.'
                            : 'Código OTP generado. Revisa el modal.'
                        );
                        return;
                      }

                      // Fallback local cuando Supabase aún no tiene variables configuradas
                      const fullPhone = `${loginCountryCode} ${phoneClean}`;
                      const foundSub = (state.subscribers || []).find(
                        (s: any) =>
                          s.phone.replace(/\s+/g, '') ===
                          fullPhone.replace(/\s+/g, '')
                      );

                      if (foundSub && foundSub.status === 'pendiente') {
                        say('Tu pago está pendiente de aprobación por el administrador.');
                        return;
                      }

                      const generated = String(
                        Math.floor(100000 + Math.random() * 900000)
                      );
                      setSimulatedOtp(generated);
                      setOtpHintMessage(
                        `Modo local: el código temporal es ${generated}`
                      );
                      setLoginStep('otp');
                      say(`Código OTP local: ${generated}`);
                    } catch {
                      const generated = String(
                        Math.floor(100000 + Math.random() * 900000)
                      );
                      setSimulatedOtp(generated);
                      setOtpHintMessage(
                        `Sin conexión al servidor · código local: ${generated}`
                      );
                      setLoginStep('otp');
                    } finally {
                      setIsAuthBusy(false);
                    }
                  }}
                  className="w-full min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-extrabold text-sm rounded-xl cursor-pointer hover:opacity-95 disabled:opacity-60 transition"
                >
                  {isAuthBusy ? 'Verificando...' : 'Enviar código por WhatsApp'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--mute)] mb-1.5">
                    Código de 6 dígitos recibido por WhatsApp
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={loginOtpCode}
                    onChange={(e) => setLoginOtpCode(e.target.value)}
                    placeholder="123456"
                    className="text-center font-bold text-xl tracking-widest tabular-nums"
                    autoFocus
                  />
                  {otpHintMessage && (
                    <p className="text-[11px] text-[var(--mute)] mt-1.5 text-center">
                      {otpHintMessage}
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button
                    disabled={isAuthBusy}
                    onClick={async () => {
                      const codeClean = loginOtpCode.trim();
                      if (!codeClean) {
                        say('Ingresa el código de 6 dígitos.');
                        return;
                      }

                      setIsAuthBusy(true);
                      try {
                        if (cloudStatus.supabaseConfigured) {
                          const res = await fetch('/api/auth/verify-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              countryCode: loginCountryCode,
                              phoneNum: loginPhoneNum.trim(),
                              code: codeClean,
                              deviceLabel: navigator.userAgent.slice(0, 60),
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            say(data.error || 'Código OTP incorrecto.');
                            return;
                          }
                          if (data.sessionToken) {
                            setSessionToken(data.sessionToken);
                            try {
                              localStorage.setItem(
                                SESSION_TOKEN_KEY,
                                data.sessionToken
                              );
                            } catch {
                              // Ignore storage errors
                            }
                          }
                          if (data.profile) {
                            applyAuthenticatedProfileState(
                              data.profile,
                              data.progressData,
                              true
                            );
                          }
                          setShowLoginModal(false);
                          setLoginStep('phone');
                          setLoginPhoneNum('');
                          setLoginOtpCode('');
                          setOtpHintMessage('');
                          window.scrollTo(0, 0);
                          say('¡Bienvenido! Sesión activa por 7 días.');
                          return;
                        }

                        if (codeClean !== simulatedOtp) {
                          say('Código OTP incorrecto.');
                          return;
                        }

                        setShowLoginModal(false);
                        setLoginStep('phone');
                        setLoginPhoneNum('');
                        setLoginOtpCode('');
                        setOtpHintMessage('');
                        setState((prev: any) => ({
                          ...prev,
                          view: 'hoy',
                          hasStarted: true,
                        }));
                        window.scrollTo(0, 0);
                        say('¡Bienvenido! Perfil cargado correctamente.');
                      } catch {
                        say('Error de red al verificar el código.');
                      } finally {
                        setIsAuthBusy(false);
                      }
                    }}
                    className="flex-1 min-h-[48px] bg-[var(--acc)] text-[var(--accink)] font-extrabold text-sm rounded-xl cursor-pointer hover:opacity-95 disabled:opacity-60 transition"
                  >
                    {isAuthBusy ? 'Validando...' : 'Verificar e ingresar'}
                  </button>
                  <button
                    onClick={() => {
                      setLoginStep('phone');
                      setLoginOtpCode('');
                      setOtpHintMessage('');
                    }}
                    className="min-h-[48px] px-4 border border-[var(--line)] font-bold text-xs rounded-xl cursor-pointer hover:border-[var(--acc)] transition"
                  >
                    Reenviar
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
