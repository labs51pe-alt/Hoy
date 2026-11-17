import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Download,
  X,
  Check,
  CheckCircle2,
  Clock,
  PauseCircle,
  AlertCircle,
  Copy,
  Trash2,
  CreditCard,
  TrendingUp,
  Users,
  ArrowUpDown,
  Edit3,
  MessageSquare,
  Calendar,
  RefreshCw,
  ArrowLeft,
  Send,
  KeyRound,
  Save,
  LogOut,
} from 'lucide-react';

export type SubscriberStatus = 'pendiente' | 'activo' | 'pausado' | 'vencido';
export type SubscriberPlan = 'Mensual' | 'Trimestral' | 'Vitalicio';
export type PaymentMethod =
  | 'Yape'
  | 'Plin'
  | 'Transferencia'
  | 'Tarjeta'
  | 'Efectivo'
  | 'Prueba 7 días'
  | 'Por definir';
export type PaymentStatus = 'pagado' | 'pendiente' | 'trial' | 'reembolsado';

export interface PaymentEntry {
  id: number;
  date: string;
  amount: number;
  method: PaymentMethod;
  ref?: string;
  note?: string;
}

export interface SubscriberRecord {
  id: number;
  dbId?: string;
  name: string;
  phone: string;
  city: string;
  status: SubscriberStatus;
  plan?: SubscriberPlan;
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentRef?: string;
  notes?: string;
  date: string;
  approvedAt?: string;
  payments?: PaymentEntry[];
}

export interface CloudActionResult {
  subscriber?: SubscriberRecord;
  whatsappSent?: boolean;
  whatsappError?: string;
  devOtp?: string;
}

interface AdminCrmModalProps {
  subscribers: SubscriberRecord[];
  onUpdateSubscribers: (next: SubscriberRecord[]) => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
  todayStr: string;
  isSyncing?: boolean;
  onRefreshCloud?: () => Promise<void>;
  onCreateSubscriber?: (
    record: SubscriberRecord
  ) => Promise<CloudActionResult | SubscriberRecord | void>;
  onPatchSubscriber?: (
    sub: SubscriberRecord,
    patch: Partial<SubscriberRecord>
  ) => Promise<CloudActionResult | SubscriberRecord | void>;
  onApproveSubscriber?: (
    sub: SubscriberRecord
  ) => Promise<CloudActionResult | SubscriberRecord | void>;
  onAddPaymentEntry?: (
    sub: SubscriberRecord,
    entry: PaymentEntry
  ) => Promise<CloudActionResult | SubscriberRecord | void>;
  onDeleteSubscriber?: (sub: SubscriberRecord) => Promise<boolean | void>;
  onSendAccess?: (sub: SubscriberRecord) => Promise<CloudActionResult | void>;
  onSendOtp?: (sub: SubscriberRecord) => Promise<CloudActionResult | void>;
}

const PLAN_PRICES: Record<SubscriberPlan, number> = {
  Mensual: 25,
  Trimestral: 55,
  Vitalicio: 75,
};

const METHODS: PaymentMethod[] = [
  'Yape',
  'Plin',
  'Transferencia',
  'Tarjeta',
  'Efectivo',
  'Por definir',
];

const PLANS: SubscriberPlan[] = ['Vitalicio', 'Trimestral', 'Mensual'];

function normalizeSubscriber(raw: SubscriberRecord): SubscriberRecord {
  const status: SubscriberStatus =
    raw.status === 'activo' ||
    raw.status === 'pausado' ||
    raw.status === 'vencido'
      ? raw.status
      : 'pendiente';
  const plan: SubscriberPlan =
    raw.plan === 'Mensual' ||
    raw.plan === 'Trimestral' ||
    raw.plan === 'Vitalicio'
      ? raw.plan
      : 'Vitalicio';
  const amount =
    typeof raw.amount === 'number' && !Number.isNaN(raw.amount)
      ? raw.amount
      : PLAN_PRICES[plan];
  const paymentStatus: PaymentStatus =
    raw.paymentStatus === 'pagado' || raw.paymentStatus === 'reembolsado'
      ? raw.paymentStatus
      : status === 'activo' || status === 'pausado'
      ? 'pagado'
      : 'pendiente';
  const paymentMethod: PaymentMethod = raw.paymentMethod || 'Por definir';
  const payments: PaymentEntry[] =
    Array.isArray(raw.payments) && raw.payments.length > 0
      ? raw.payments
      : paymentStatus === 'pagado'
      ? [
          {
            id: raw.id * 10 + 1,
            date: raw.approvedAt || raw.date,
            amount,
            method: paymentMethod === 'Por definir' ? 'Yape' : paymentMethod,
            ref: raw.paymentRef || '',
            note: `Membresía ${plan}`,
          },
        ]
      : [];

  return {
    ...raw,
    status,
    plan,
    amount,
    paymentStatus,
    paymentMethod,
    payments,
  };
}

function unwrapSubscriber(
  res: CloudActionResult | SubscriberRecord | void
): { subscriber?: SubscriberRecord; whatsappSent?: boolean; whatsappError?: string } {
  if (!res || typeof res !== 'object') return {};
  if ('subscriber' in res || 'whatsappSent' in res || 'whatsappError' in res) {
    return res as CloudActionResult;
  }
  return { subscriber: res as SubscriberRecord };
}

function getClientPaidTotal(sub: SubscriberRecord): number {
  if (sub.paymentStatus === 'reembolsado') return 0;
  if (Array.isArray(sub.payments) && sub.payments.length > 0) {
    return sub.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }
  return sub.paymentStatus === 'pagado' ? Number(sub.amount) || 0 : 0;
}

function formatMoney(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}

export default function AdminCrmModal({
  subscribers,
  onUpdateSubscribers,
  onClose,
  onNotify,
  todayStr,
  isSyncing,
  onRefreshCloud,
  onCreateSubscriber,
  onPatchSubscriber,
  onApproveSubscriber,
  onAddPaymentEntry,
  onDeleteSubscriber,
  onSendAccess,
  onSendOtp,
}: AdminCrmModalProps) {
  const normalizedList = useMemo(
    () =>
      (Array.isArray(subscribers) ? subscribers : []).map(normalizeSubscriber),
    [subscribers]
  );

  const [activeTab, setActiveTab] = useState<'clients' | 'analytics'>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | SubscriberStatus>(
    'todos'
  );
  const [planFilter, setPlanFilter] = useState<'todos' | SubscriberPlan>('todos');
  const [sortBy, setSortBy] = useState<'recent' | 'amount' | 'name'>('recent');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Estado del formulario "+ Nuevo Cliente"
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('+51');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPlan, setNewPlan] = useState<SubscriberPlan>('Vitalicio');
  const [newAmount, setNewAmount] = useState('75');
  const [newMethod, setNewMethod] = useState<PaymentMethod>('Yape');
  const [newStatus, setNewStatus] = useState<SubscriberStatus>('activo');
  const [newRef, setNewRef] = useState('');

  // Estado del formulario "+ Registrar Cobro" en el inspector
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('75');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Yape');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');

  // Borrador editable del cliente seleccionado
  const [draft, setDraft] = useState<{
    name: string;
    phone: string;
    city: string;
    status: SubscriberStatus;
    paymentStatus: PaymentStatus;
    plan: SubscriberPlan;
    amount: string;
    paymentMethod: PaymentMethod;
    paymentRef: string;
    notes: string;
  } | null>(null);

  const selectedClient = useMemo(
    () => normalizedList.find((s) => s.id === selectedId) || null,
    [normalizedList, selectedId]
  );

  useEffect(() => {
    if (!selectedClient) {
      setDraft(null);
      return;
    }
    setDraft({
      name: selectedClient.name || '',
      phone: selectedClient.phone || '',
      city: selectedClient.city || '',
      status: selectedClient.status,
      paymentStatus: selectedClient.paymentStatus || 'pendiente',
      plan: selectedClient.plan || 'Vitalicio',
      amount: String(
        selectedClient.amount ?? PLAN_PRICES[selectedClient.plan || 'Vitalicio']
      ),
      paymentMethod: selectedClient.paymentMethod || 'Por definir',
      paymentRef: selectedClient.paymentRef || '',
      notes: selectedClient.notes || '',
    });
  }, [selectedClient]);

  // KPIs globales en tiempo real
  const metrics = useMemo(() => {
    const currentMonth = todayStr.slice(0, 7);
    let totalEarnings = 0;
    let monthEarnings = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let activeCount = 0;
    let paidClientsCount = 0;

    const byPlan: Record<SubscriberPlan, { count: number; revenue: number }> = {
      Vitalicio: { count: 0, revenue: 0 },
      Trimestral: { count: 0, revenue: 0 },
      Mensual: { count: 0, revenue: 0 },
    };

    const byMethod: Record<string, { count: number; revenue: number }> = {};
    const byCity: Record<string, { count: number; revenue: number }> = {};
    const byDate: Record<string, number> = {};

    normalizedList.forEach((sub) => {
      if (sub.status === 'activo') activeCount++;
      if (sub.status === 'pendiente') {
        pendingCount++;
        pendingAmount += Number(sub.amount) || 0;
      }

      const paidTotal = getClientPaidTotal(sub);
      if (paidTotal > 0) {
        paidClientsCount++;
        totalEarnings += paidTotal;
      }

      const planKey = sub.plan || 'Vitalicio';
      byPlan[planKey].count += 1;
      byPlan[planKey].revenue += paidTotal;

      const cityKey = (sub.city || 'Sin ciudad').split(',')[0].trim();
      if (!byCity[cityKey]) byCity[cityKey] = { count: 0, revenue: 0 };
      byCity[cityKey].count += 1;
      byCity[cityKey].revenue += paidTotal;

      if (Array.isArray(sub.payments)) {
        sub.payments.forEach((p) => {
          const amt = Number(p.amount) || 0;
          if (sub.paymentStatus === 'reembolsado') return;
          if ((p.date || '').startsWith(currentMonth)) {
            monthEarnings += amt;
          }
          const mKey = p.method || 'Otros';
          if (!byMethod[mKey]) byMethod[mKey] = { count: 0, revenue: 0 };
          byMethod[mKey].count += 1;
          byMethod[mKey].revenue += amt;

          const dKey = p.date || sub.date;
          byDate[dKey] = (byDate[dKey] || 0) + amt;
        });
      }
    });

    const totalClients = normalizedList.length;
    const conversionRate =
      totalClients > 0 ? Math.round((activeCount / totalClients) * 100) : 0;
    const avgTicket =
      paidClientsCount > 0 ? totalEarnings / paidClientsCount : 0;

    const dailySeries: Array<{ date: string; label: string; amount: number }> = [];
    const baseDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const iso =
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0');
      const label = d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      });
      dailySeries.push({
        date: iso,
        label,
        amount: byDate[iso] || 0,
      });
    }

    return {
      totalClients,
      activeCount,
      pendingCount,
      pendingAmount,
      totalEarnings,
      monthEarnings,
      conversionRate,
      avgTicket,
      paidClientsCount,
      byPlan,
      byMethod: Object.entries(byMethod).sort((a, b) => b[1].revenue - a[1].revenue),
      byCity: Object.entries(byCity).sort((a, b) => b[1].revenue - a[1].revenue),
      dailySeries,
    };
  }, [normalizedList, todayStr]);

  const statusCounts = useMemo(() => {
    const counts = {
      todos: normalizedList.length,
      pendiente: 0,
      activo: 0,
      pausado: 0,
      vencido: 0,
    };
    normalizedList.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [normalizedList]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = normalizedList.filter((s) => {
      if (statusFilter !== 'todos' && s.status !== statusFilter) return false;
      if (planFilter !== 'todos' && s.plan !== planFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.paymentRef || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'amount') {
        return (
          (getClientPaidTotal(b) || b.amount || 0) -
          (getClientPaidTotal(a) || a.amount || 0)
        );
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.date.localeCompare(a.date) || b.id - a.id;
    });
  }, [normalizedList, searchQuery, statusFilter, planFilter, sortBy]);

  const openClientEditor = (sub: SubscriberRecord, openPayForm = false) => {
    setSelectedId(sub.id);
    setShowAddPayment(openPayForm);
    setConfirmDeleteId(null);
    setPayAmount(String(sub.amount || PLAN_PRICES[sub.plan || 'Vitalicio']));
    setPayMethod(
      sub.paymentMethod && sub.paymentMethod !== 'Por definir'
        ? sub.paymentMethod
        : 'Yape'
    );
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !draft) return;
    const cleanName = draft.name.trim();
    const cleanPhone = draft.phone.trim();
    if (!cleanName || !cleanPhone) {
      onNotify('Nombre y WhatsApp son obligatorios.');
      return;
    }

    const patch: Partial<SubscriberRecord> = {
      name: cleanName,
      phone: cleanPhone,
      city: draft.city.trim() || 'No especificada',
      status: draft.status,
      paymentStatus: draft.paymentStatus,
      plan: draft.plan,
      amount: Math.max(0, Number(draft.amount) || 0),
      paymentMethod: draft.paymentMethod,
      paymentRef: draft.paymentRef.trim(),
      notes: draft.notes.trim(),
    };

    const next = normalizedList.map((s) =>
      s.id === selectedClient.id ? normalizeSubscriber({ ...s, ...patch }) : s
    );
    onUpdateSubscribers(next);

    if (!onPatchSubscriber) {
      onNotify(`Datos de ${cleanName} actualizados.`);
      return;
    }

    setBusyAction('save');
    try {
      const raw = await onPatchSubscriber(selectedClient, patch);
      const { subscriber: synced, whatsappSent, whatsappError } =
        unwrapSubscriber(raw);
      if (synced) {
        onUpdateSubscribers(
          next.map((s) =>
            s.id === selectedClient.id ? normalizeSubscriber(synced) : s
          )
        );
      }
      if (selectedClient.status !== 'activo' && patch.status === 'activo') {
        if (whatsappSent) {
          onNotify(`Cliente activado y acceso enviado por WhatsApp a ${cleanName}.`);
        } else {
          onNotify(
            `Cliente guardado como Activo, pero n8n no respondió (${whatsappError || 'sin webhook'}).`
          );
        }
      } else {
        onNotify(`Cambios guardados en Supabase para ${cleanName}.`);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const approvePayment = async (sub: SubscriberRecord) => {
    const amount = Number(sub.amount) || PLAN_PRICES[sub.plan || 'Vitalicio'];
    const method: PaymentMethod =
      sub.paymentMethod && sub.paymentMethod !== 'Por definir'
        ? sub.paymentMethod
        : 'Yape';
    const existingPayments = Array.isArray(sub.payments) ? sub.payments : [];
    const nextPayments: PaymentEntry[] =
      existingPayments.length > 0
        ? existingPayments
        : [
            {
              id: Date.now(),
              date: todayStr,
              amount,
              method,
              ref: sub.paymentRef || '',
              note: `Activación ${sub.plan || 'Vitalicio'}`,
            },
          ];

    const optimisticPatch: Partial<SubscriberRecord> = {
      status: 'activo',
      paymentStatus: 'pagado',
      paymentMethod: method,
      amount,
      approvedAt: todayStr,
      payments: nextPayments,
    };
    const next = normalizedList.map((s) =>
      s.id === sub.id ? normalizeSubscriber({ ...s, ...optimisticPatch }) : s
    );
    onUpdateSubscribers(next);

    if (!onApproveSubscriber) {
      onNotify(`Pago aprobado (${formatMoney(amount)}) para ${sub.name}.`);
      return;
    }

    setBusyAction(`approve-${sub.id}`);
    try {
      const raw = await onApproveSubscriber(sub);
      const { subscriber: synced, whatsappSent, whatsappError } =
        unwrapSubscriber(raw);
      if (synced) {
        onUpdateSubscribers(
          next.map((s) => (s.id === sub.id ? normalizeSubscriber(synced) : s))
        );
      }
      if (whatsappSent) {
        onNotify(`¡Aprobado (${formatMoney(amount)}) y acceso enviado por WhatsApp!`);
      } else if (synced) {
        onNotify(
          `Pago aprobado en Supabase, pero n8n no envió WhatsApp (${whatsappError || 'verifica N8N_WEBHOOK_URL'}).`
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    const cleanPhone = newPhone.trim();
    if (!cleanName || !cleanPhone) {
      onNotify('Ingresa el nombre y número de WhatsApp del cliente.');
      return;
    }

    const parsedAmount = Math.max(0, Number(newAmount) || 0);
    const fullPhone = `${newCountryCode} ${cleanPhone}`;
    const isPaid = newStatus === 'activo';
    const newRecord: SubscriberRecord = {
      id: Date.now(),
      name: cleanName,
      phone: fullPhone,
      city: newCity.trim() || 'No especificada',
      status: newStatus,
      plan: newPlan,
      amount: parsedAmount,
      paymentMethod: newMethod,
      paymentStatus: isPaid ? 'pagado' : 'pendiente',
      paymentRef: newRef.trim(),
      date: todayStr,
      approvedAt: isPaid ? todayStr : undefined,
      payments: isPaid
        ? [
            {
              id: Date.now() + 1,
              date: todayStr,
              amount: parsedAmount,
              method: newMethod,
              ref: newRef.trim(),
              note: `Alta directa (${newPlan})`,
            },
          ]
        : [],
    };

    const nextList = [newRecord, ...normalizedList];
    onUpdateSubscribers(nextList);
    setShowNewForm(false);
    setNewName('');
    setNewPhone('');
    setNewCity('');
    setNewRef('');
    setSelectedId(newRecord.id);

    if (!onCreateSubscriber) {
      onNotify(`Cliente ${cleanName} registrado en el CRM.`);
      return;
    }

    setBusyAction('create');
    try {
      const raw = await onCreateSubscriber(newRecord);
      const { subscriber: synced, whatsappSent, whatsappError } =
        unwrapSubscriber(raw);
      if (synced) {
        const normalizedSynced = normalizeSubscriber(synced);
        onUpdateSubscribers(
          nextList.map((s) => (s.id === newRecord.id ? normalizedSynced : s))
        );
        setSelectedId(normalizedSynced.id);
        if (isPaid) {
          onNotify(
            whatsappSent
              ? `Cliente ${cleanName} guardado y acceso enviado por WhatsApp.`
              : `Cliente guardado, pero n8n no envió WhatsApp (${whatsappError || 'verifica N8N_WEBHOOK_URL'}).`
          );
        } else {
          onNotify(`Cliente ${cleanName} registrado en Supabase.`);
        }
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddPaymentEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const amt = Math.max(0, Number(payAmount) || 0);
    if (amt <= 0) {
      onNotify('Ingresa un monto mayor a 0.');
      return;
    }

    const entry: PaymentEntry = {
      id: Date.now(),
      date: todayStr,
      amount: amt,
      method: payMethod,
      ref: payRef.trim(),
      note: payNote.trim() || `Cobro ${selectedClient.plan || 'Membresía'}`,
    };

    const nextPayments = [entry, ...(selectedClient.payments || [])];
    const patch: Partial<SubscriberRecord> = {
      status: 'activo',
      paymentStatus: 'pagado',
      paymentMethod: payMethod,
      paymentRef: payRef.trim() || selectedClient.paymentRef,
      approvedAt: selectedClient.approvedAt || todayStr,
      payments: nextPayments,
    };
    const next = normalizedList.map((s) =>
      s.id === selectedClient.id ? normalizeSubscriber({ ...s, ...patch }) : s
    );
    onUpdateSubscribers(next);
    setShowAddPayment(false);
    setPayRef('');
    setPayNote('');

    if (!onAddPaymentEntry) {
      onNotify(`Cobro de ${formatMoney(amt)} registrado para ${selectedClient.name}.`);
      return;
    }

    setBusyAction('add_payment');
    try {
      const raw = await onAddPaymentEntry(selectedClient, entry);
      const { subscriber: synced, whatsappSent, whatsappError } =
        unwrapSubscriber(raw);
      if (synced) {
        onUpdateSubscribers(
          next.map((s) =>
            s.id === selectedClient.id ? normalizeSubscriber(synced) : s
          )
        );
        onNotify(
          whatsappSent
            ? `Pago (${formatMoney(amt)}) registrado y acceso enviado por WhatsApp.`
            : `Pago guardado y acceso activado, pero n8n no respondió (${whatsappError || 'verifica N8N_WEBHOOK_URL'}).`
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteClient = async (sub: SubscriberRecord) => {
    setBusyAction(`delete-${sub.id}`);
    try {
      if (onDeleteSubscriber) {
        const ok = await onDeleteSubscriber(sub);
        if (ok === false) return;
      }
      onUpdateSubscribers(normalizedList.filter((s) => s.id !== sub.id));
      if (selectedId === sub.id) setSelectedId(null);
      setConfirmDeleteId(null);
      onNotify(`Cliente ${sub.name} eliminado.`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleTriggerSendAccess = async (sub: SubscriberRecord) => {
    if (!onSendAccess) return;
    setBusyAction('send_access');
    try {
      const res = await onSendAccess(sub);
      if (res?.whatsappSent) {
        onNotify(`Mensaje de acceso enviado por WhatsApp a ${sub.name}.`);
      } else {
        onNotify(
          `No se pudo enviar por n8n (${res?.whatsappError || 'verifica N8N_WEBHOOK_URL y que el flujo esté Active'}).`
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleTriggerSendOtp = async (sub: SubscriberRecord) => {
    if (!onSendOtp) return;
    setBusyAction('send_otp');
    try {
      const res = await onSendOtp(sub);
      if (res?.whatsappSent) {
        onNotify(`Código OTP generado y enviado por WhatsApp a ${sub.name}.`);
      } else if (res?.devOtp) {
        onNotify(
          `OTP generado: ${res.devOtp} (n8n no respondió: ${res.whatsappError || 'revisa webhook'}).`
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const exportCsv = () => {
    const headers = [
      'ID',
      'Nombre',
      'WhatsApp',
      'Ciudad',
      'Plan',
      'Estado',
      'Estado Pago',
      'Metodo',
      'Total Cobrado (S/)',
      'Referencia',
      'Fecha Registro',
    ];
    const rows = filteredList.map((s) => [
      s.id,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.city || '').replace(/"/g, '""')}"`,
      s.plan || 'Vitalicio',
      s.status,
      s.paymentStatus || 'pendiente',
      s.paymentMethod || 'Por definir',
      getClientPaidTotal(s).toFixed(2),
      `"${(s.paymentRef || '').replace(/"/g, '""')}"`,
      s.date,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hoy-crm-clientes-${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify(`CSV exportado (${filteredList.length} registros).`);
  };

  const copyToClipboard = async (text: string, feedback: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(feedback);
    } catch {
      onNotify('No se pudo copiar automáticamente.');
    }
  };

  const renderStatusLabel = (status: SubscriberStatus) => {
    if (status === 'activo') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Activo</span>
        </span>
      );
    }
    if (status === 'pendiente') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706]">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
    }
    if (status === 'pausado') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--mute)]">
          <PauseCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Pausado</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626]">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Vencido</span>
      </span>
    );
  };

  const maxDailyRevenue = Math.max(
    1,
    ...metrics.dailySeries.map((d) => d.amount)
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl h-[100dvh] sm:h-[92dvh] rounded-none sm:rounded-3xl bg-[var(--card)] text-[var(--ink)] border-0 sm:border border-[var(--line)] shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Top Console Bar */}
        <header className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-2.5 bg-[var(--card)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--mute)]">
                <span>HOY</span>
                <span aria-hidden="true">/</span>
                <span className="text-[var(--ink)] font-bold">CRM</span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold tracking-tight truncate">
                Clientes y Pagos
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 order-2 sm:order-3">
            {onRefreshCloud && (
              <button
                onClick={() => void onRefreshCloud()}
                disabled={isSyncing}
                aria-label="Sincronizar clientes con Supabase"
                className="min-h-[38px] min-w-[38px] px-2.5 border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-xs rounded-xl hover:border-[var(--acc)] transition cursor-pointer flex items-center justify-center"
                title="Sincronizar con Supabase"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
              </button>
            )}
            <button
              onClick={() => {
                setShowNewForm((v) => !v);
                setActiveTab('clients');
              }}
              className="min-h-[38px] px-3 sm:px-3.5 bg-[var(--acc)] text-[var(--accink)] font-bold text-xs rounded-xl hover:opacity-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Nuevo</span>
              <span className="hidden sm:inline">cliente</span>
            </button>
            <button
              onClick={exportCsv}
              className="min-h-[38px] min-w-[38px] px-2.5 sm:px-3 border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-xs rounded-xl hover:border-[var(--acc)] transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Descargar CSV"
              aria-label="Exportar CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Salir del CRM"
              className="min-h-[38px] px-2.5 sm:px-3 rounded-xl border border-[var(--line)] text-[var(--mute)] hover:text-red-500 hover:border-red-500/50 flex items-center justify-center gap-1.5 cursor-pointer transition text-xs font-bold"
              title="Salir del CRM"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-1 p-1 bg-[var(--bg)] border border-[var(--line)] rounded-xl order-3 sm:order-2">
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'clients'
                  ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clientes ({metrics.totalClients})</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ganancias</span>
            </button>
          </div>
        </header>

        {/* KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 border-b border-[var(--line)] bg-[var(--bg)]/50 shrink-0">
          <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b lg:border-b-0 border-r border-[var(--line)]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[var(--mute)]">
              <span>Cobradas</span>
              <span className="text-[11px] font-extrabold text-[#16A34A]">S/</span>
            </div>
            <p className="text-base sm:text-2xl font-extrabold tracking-tight tabular-nums mt-0.5 sm:mt-1 text-[var(--ink)]">
              {formatMoney(metrics.totalEarnings)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-[var(--mute)] tabular-nums truncate">
              {metrics.paidClientsCount} pagos · Prom. {formatMoney(metrics.avgTicket)}
            </p>
          </div>

          <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b lg:border-b-0 lg:border-r border-[var(--line)]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[var(--mute)]">
              <span>Por aprobar</span>
              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            </div>
            <p className="text-base sm:text-2xl font-extrabold tracking-tight tabular-nums mt-0.5 sm:mt-1 text-[#D97706]">
              {formatMoney(metrics.pendingAmount)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-[var(--mute)] tabular-nums truncate">
              {metrics.pendingCount}{' '}
              {metrics.pendingCount === 1 ? 'pendiente' : 'pendientes'}
            </p>
          </div>

          <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-r border-[var(--line)]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[var(--mute)]">
              <span>Activos</span>
              <Users className="w-3.5 h-3.5 text-[var(--acc)]" />
            </div>
            <p className="text-base sm:text-2xl font-extrabold tracking-tight tabular-nums mt-0.5 sm:mt-1 text-[var(--ink)]">
              {metrics.activeCount}{' '}
              <span className="text-xs sm:text-sm font-semibold text-[var(--mute)]">
                / {metrics.totalClients}
              </span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-[var(--mute)] tabular-nums">
              Conv. {metrics.conversionRate}%
            </p>
          </div>

          <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[var(--mute)]">
              <span>Este mes</span>
              <Calendar className="w-3.5 h-3.5 text-[var(--acc)]" />
            </div>
            <p className="text-base sm:text-2xl font-extrabold tracking-tight tabular-nums mt-0.5 sm:mt-1 text-[var(--ink)]">
              {formatMoney(metrics.monthEarnings)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-[var(--mute)] tabular-nums">
              {todayStr.slice(0, 7)}
            </p>
          </div>
        </section>

        {/* Main Workspace Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {activeTab === 'clients' ? (
            <>
              {/* Left / Primary Data Area */}
              <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                {/* Inline "+ Nuevo Cliente" Form */}
                {showNewForm && (
                  <form
                    onSubmit={handleAddNewClient}
                    className="p-3.5 sm:p-5 border-b border-[var(--line)] bg-[var(--bg)] space-y-2.5 shrink-0 max-h-[55dvh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-extrabold">
                        Registrar nuevo cliente o pago manual
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowNewForm(false)}
                        className="text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        Ocultar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nombre completo *"
                        className="min-h-[42px] px-3 text-xs font-semibold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                      />
                      <div className="flex gap-1.5">
                        <select
                          value={newCountryCode}
                          onChange={(e) => setNewCountryCode(e.target.value)}
                          className="w-24 min-h-[42px] px-2 text-xs font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
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
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="WhatsApp *"
                          className="flex-1 min-w-0 min-h-[42px] px-3 text-xs font-semibold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                        />
                      </div>
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="Ciudad, País"
                        className="min-h-[42px] px-3 text-xs font-semibold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                      />
                      <select
                        value={newPlan}
                        onChange={(e) => {
                          const p = e.target.value as SubscriberPlan;
                          setNewPlan(p);
                          setNewAmount(String(PLAN_PRICES[p]));
                        }}
                        className="min-h-[42px] px-3 text-xs font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                      >
                        <option value="Vitalicio">Plan Vitalicio (S/ 75)</option>
                        <option value="Trimestral">Plan Trimestral (S/ 55)</option>
                        <option value="Mensual">Plan Mensual (S/ 25)</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="Monto en S/"
                        className="min-h-[42px] px-3 text-xs font-mono font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl tabular-nums"
                      />
                      <select
                        value={newMethod}
                        onChange={(e) => setNewMethod(e.target.value as PaymentMethod)}
                        className="min-h-[42px] px-3 text-xs font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                      >
                        {METHODS.map((m) => (
                          <option key={m} value={m}>
                            Método: {m}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newRef}
                        onChange={(e) => setNewRef(e.target.value)}
                        placeholder="N° operación / ref"
                        className="min-h-[42px] px-3 text-xs font-mono bg-[var(--card)] border border-[var(--line)] rounded-xl"
                      />
                      <div className="flex gap-1.5">
                        <select
                          value={newStatus}
                          onChange={(e) =>
                            setNewStatus(e.target.value as SubscriberStatus)
                          }
                          className="flex-1 min-h-[42px] px-3 text-xs font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                        >
                          <option value="activo">Estado: Activo (Envía WhatsApp)</option>
                          <option value="pendiente">Estado: Pendiente</option>
                        </select>
                        <button
                          type="submit"
                          disabled={busyAction === 'create'}
                          className="min-h-[42px] px-4 bg-[var(--acc)] text-[var(--accink)] font-bold text-xs rounded-xl cursor-pointer hover:opacity-95 whitespace-nowrap disabled:opacity-60"
                        >
                          {busyAction === 'create' ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Search & Filters Toolbar */}
                <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-[var(--line)] flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 shrink-0">
                  <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
                    <Search className="w-4 h-4 text-[var(--mute)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar nombre, WhatsApp, ciudad o ref..."
                      className="w-full min-h-[38px] pl-9 pr-3 text-xs font-semibold bg-[var(--bg)] border border-[var(--line)] focus:border-[var(--acc)] rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full sm:w-auto flex items-center gap-1 p-1 bg-[var(--bg)] border border-[var(--line)] rounded-xl overflow-x-auto no-scrollbar">
                      {(
                        [
                          ['todos', 'Todos'],
                          ['pendiente', 'Pendientes'],
                          ['activo', 'Activos'],
                          ['pausado', 'Pausados'],
                          ['vencido', 'Vencidos'],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setStatusFilter(key)}
                          className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer whitespace-nowrap tabular-nums ${
                            statusFilter === key
                              ? 'bg-[var(--card)] text-[var(--ink)] shadow-sm'
                              : 'text-[var(--mute)] hover:text-[var(--ink)]'
                          }`}
                        >
                          {label} ({statusCounts[key]})
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={planFilter}
                        onChange={(e) =>
                          setPlanFilter(e.target.value as 'todos' | SubscriberPlan)
                        }
                        className="flex-1 sm:flex-initial min-h-[36px] px-2.5 text-[11px] font-bold bg-[var(--bg)] border border-[var(--line)] rounded-xl cursor-pointer"
                      >
                        <option value="todos">Todos los planes</option>
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            Plan {p}
                          </option>
                        ))}
                      </select>

                      <div className="flex-1 sm:flex-initial flex items-center gap-1 min-h-[36px] px-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
                        <ArrowUpDown className="w-3.5 h-3.5 text-[var(--mute)] shrink-0" />
                        <select
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(e.target.value as 'recent' | 'amount' | 'name')
                          }
                          className="w-full text-[11px] font-bold bg-transparent outline-none cursor-pointer"
                        >
                          <option value="recent">Más recientes</option>
                          <option value="amount">Mayor monto</option>
                          <option value="name">Nombre A-Z</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Responsive Client List: Mobile Cards (< md) + Desktop Table (md+) */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {filteredList.length > 0 ? (
                    <>
                      {/* Mobile Cards */}
                      <div className="md:hidden divide-y divide-[var(--line)]">
                        {filteredList.map((sub) => {
                          const isSelected = selectedId === sub.id;
                          const paidTotal = getClientPaidTotal(sub);
                          const displayAmt =
                            paidTotal > 0 ? paidTotal : Number(sub.amount) || 0;
                          const isDeleting = confirmDeleteId === sub.id;

                          return (
                            <div
                              key={sub.id}
                              onClick={() => openClientEditor(sub, false)}
                              className={`p-3.5 space-y-2.5 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--acc)]/10'
                                  : 'active:bg-[var(--bg)]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-sm text-[var(--ink)] truncate">
                                      {sub.name}
                                    </span>
                                    {renderStatusLabel(sub.status)}
                                  </div>
                                  <p className="text-[11px] text-[var(--mute)] mt-0.5 truncate">
                                    {sub.plan || 'Vitalicio'} · {sub.paymentMethod || 'Por definir'} ·{' '}
                                    {sub.city || 'Sin ciudad'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p
                                    className={`font-mono text-sm font-extrabold tabular-nums ${
                                      paidTotal > 0
                                        ? 'text-[#16A34A]'
                                        : sub.paymentStatus === 'reembolsado'
                                        ? 'text-[#DC2626] line-through'
                                        : 'text-[var(--ink)]'
                                    }`}
                                  >
                                    {formatMoney(displayAmt)}
                                  </p>
                                  <p className="text-[10px] font-semibold text-[var(--mute)] tabular-nums">
                                    {sub.date}
                                  </p>
                                </div>
                              </div>

                              <div
                                className="flex items-center justify-between gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      sub.phone,
                                      `Número ${sub.phone} copiado.`
                                    )
                                  }
                                  className="font-mono text-xs font-semibold text-[var(--ink)] bg-[var(--bg)] border border-[var(--line)] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>{sub.phone}</span>
                                  <Copy className="w-3 h-3 text-[var(--mute)]" />
                                </button>
                                <span className="text-[10px] font-bold text-[var(--mute)]">
                                  {sub.paymentStatus === 'pagado'
                                    ? 'Cobrado'
                                    : sub.paymentStatus === 'reembolsado'
                                    ? 'Reembolso'
                                    : 'Por cobrar'}
                                </span>
                              </div>

                              {/* Direct Mobile Action Buttons on every client */}
                              <div
                                className="flex flex-wrap items-center gap-1.5 pt-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {sub.status !== 'activo' && (
                                  <button
                                    disabled={busyAction === `approve-${sub.id}`}
                                    onClick={() => void approvePayment(sub)}
                                    className="flex-1 min-h-[38px] px-2.5 bg-[#16A34A] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Aprobar y enviar</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => openClientEditor(sub, true)}
                                  className="min-h-[38px] px-3 bg-[var(--acc)]/12 text-[var(--acc)] font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pago</span>
                                </button>
                                <button
                                  onClick={() => openClientEditor(sub, false)}
                                  className="min-h-[38px] px-3 border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                {isDeleting ? (
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button
                                      disabled={busyAction === `delete-${sub.id}`}
                                      onClick={() => void handleDeleteClient(sub)}
                                      className="min-h-[38px] px-3 bg-[#DC2626] text-white font-bold rounded-xl text-xs cursor-pointer"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="min-h-[38px] px-2.5 border border-[var(--line)] font-bold rounded-xl text-xs cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(sub.id)}
                                    aria-label={`Eliminar ${sub.name}`}
                                    className="min-h-[38px] min-w-[38px] px-2.5 border border-red-500/30 bg-red-500/10 text-[#DC2626] font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table */}
                      <table className="hidden md:table w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-[var(--card)] border-b border-[var(--line)] text-[var(--mute)] z-10">
                          <tr>
                            <th className="py-3 px-4 sm:pl-6 font-bold">Cliente</th>
                            <th className="py-3 px-3 font-bold">WhatsApp</th>
                            <th className="py-3 px-3 font-bold">Plan / Método</th>
                            <th className="py-3 px-3 font-bold text-right">Monto</th>
                            <th className="py-3 px-3 font-bold">Estado</th>
                            <th className="py-3 px-4 sm:pr-6 font-bold text-right">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                          {filteredList.map((sub) => {
                            const isSelected = selectedId === sub.id;
                            const paidTotal = getClientPaidTotal(sub);
                            const displayAmt =
                              paidTotal > 0 ? paidTotal : Number(sub.amount) || 0;
                            const isDeleting = confirmDeleteId === sub.id;

                            return (
                              <tr
                                key={sub.id}
                                onClick={() => openClientEditor(sub, false)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-[var(--acc)]/10'
                                    : 'hover:bg-[var(--bg)]/70'
                                }`}
                              >
                                <td className="py-3 px-4 sm:pl-6">
                                  <div className="font-bold text-[var(--ink)]">
                                    {sub.name}
                                  </div>
                                  <div className="text-[11px] text-[var(--mute)] flex items-center gap-1.5 mt-0.5">
                                    <span>{sub.city || 'Sin ciudad'}</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="tabular-nums">{sub.date}</span>
                                  </div>
                                </td>

                                <td
                                  className="py-3 px-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        sub.phone,
                                        `Número ${sub.phone} copiado.`
                                      )
                                    }
                                    className="font-mono text-[11px] font-semibold text-[var(--ink)] hover:text-[var(--acc)] flex items-center gap-1.5 cursor-pointer"
                                    title="Copiar número"
                                  >
                                    <span>{sub.phone}</span>
                                    <Copy className="w-3 h-3 text-[var(--mute)]" />
                                  </button>
                                </td>

                                <td className="py-3 px-3">
                                  <div className="font-semibold text-[var(--ink)]">
                                    {sub.plan || 'Vitalicio'}
                                  </div>
                                  <div className="text-[11px] text-[var(--mute)]">
                                    {sub.paymentMethod || 'Por definir'}
                                    {sub.paymentRef ? ` · ${sub.paymentRef}` : ''}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                                  <span
                                    className={
                                      paidTotal > 0
                                        ? 'text-[#16A34A]'
                                        : sub.paymentStatus === 'reembolsado'
                                        ? 'text-[#DC2626] line-through'
                                        : 'text-[var(--ink)]'
                                    }
                                  >
                                    {formatMoney(displayAmt)}
                                  </span>
                                  <div className="text-[10px] font-sans font-semibold text-[var(--mute)]">
                                    {sub.paymentStatus === 'pagado'
                                      ? 'Cobrado'
                                      : sub.paymentStatus === 'reembolsado'
                                      ? 'Reembolso'
                                      : 'Por cobrar'}
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  {renderStatusLabel(sub.status)}
                                </td>

                                <td
                                  className="py-3 px-4 sm:pr-6 text-right"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="inline-flex items-center gap-1.5">
                                    {sub.status !== 'activo' && (
                                      <button
                                        disabled={busyAction === `approve-${sub.id}`}
                                        onClick={() => void approvePayment(sub)}
                                        className="px-2.5 py-1.5 bg-[#16A34A] text-white font-bold rounded-lg hover:opacity-95 transition cursor-pointer text-[11px] whitespace-nowrap disabled:opacity-60"
                                      >
                                        Aprobar pago
                                      </button>
                                    )}
                                    <button
                                      onClick={() => openClientEditor(sub, false)}
                                      className="px-2.5 py-1.5 border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold rounded-lg hover:border-[var(--acc)] transition cursor-pointer text-[11px] inline-flex items-center gap-1 whitespace-nowrap"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Editar</span>
                                    </button>
                                    {isDeleting ? (
                                      <>
                                        <button
                                          disabled={busyAction === `delete-${sub.id}`}
                                          onClick={() => void handleDeleteClient(sub)}
                                          className="px-2.5 py-1.5 bg-[#DC2626] text-white font-bold rounded-lg text-[11px] cursor-pointer"
                                        >
                                          Sí
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="px-2 py-1.5 border border-[var(--line)] font-bold rounded-lg text-[11px] cursor-pointer"
                                        >
                                          No
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmDeleteId(sub.id)}
                                        title={`Eliminar ${sub.name}`}
                                        aria-label={`Eliminar ${sub.name}`}
                                        className="p-1.5 border border-red-500/30 bg-red-500/10 text-[#DC2626] rounded-lg hover:bg-red-500/20 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div className="h-full min-h-[240px] flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <p className="text-sm font-bold text-[var(--ink)]">
                        No hay clientes que coincidan con el filtro
                      </p>
                      <p className="text-xs text-[var(--mute)] max-w-xs">
                        Ajusta la búsqueda o registra un nuevo cliente y su pago directamente.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('todos');
                          setPlanFilter('todos');
                        }}
                        className="px-4 py-2 text-xs font-bold border border-[var(--line)] rounded-xl hover:border-[var(--acc)] cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Inspector: Full-screen Sheet on Mobile (< lg), Right Drawer on Desktop (lg+) */}
              {selectedClient && draft && (
                <aside className="fixed inset-0 z-30 lg:static lg:z-auto w-full lg:w-[410px] border-t-0 lg:border-l border-[var(--line)] bg-[var(--card)] lg:bg-[var(--bg)]/60 flex flex-col overflow-y-auto shrink-0">
                  <div className="p-3.5 sm:p-5 border-b border-[var(--line)] flex items-center justify-between gap-2 bg-[var(--card)] sticky top-0 z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => setSelectedId(null)}
                        aria-label="Volver a clientes"
                        className="lg:hidden min-h-[38px] px-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Lista</span>
                      </button>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[var(--mute)]">
                          Cliente #{selectedClient.id}
                        </p>
                        <h3 className="text-base font-extrabold truncate">
                          {selectedClient.name}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      aria-label="Cerrar ficha"
                      className="hidden lg:flex min-h-[34px] min-w-[34px] rounded-xl border border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-5 text-xs pb-10">
                    {/* Quick Payment & WhatsApp Actions */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedClient.status !== 'activo' && (
                          <button
                            disabled={busyAction === `approve-${selectedClient.id}`}
                            onClick={() => void approvePayment(selectedClient)}
                            className="min-h-[42px] px-3 bg-[#16A34A] text-white font-bold rounded-xl hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aprobar y enviar acceso</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowAddPayment((v) => !v);
                            setPayAmount(
                              String(
                                selectedClient.amount ||
                                  PLAN_PRICES[selectedClient.plan || 'Vitalicio']
                              )
                            );
                          }}
                          className="min-h-[42px] px-3 bg-[var(--acc)] text-[var(--accink)] font-bold rounded-xl hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Registrar cobro</span>
                        </button>
                      </div>

                      {selectedClient.dbId && (onSendAccess || onSendOtp) && (
                        <div className="grid grid-cols-2 gap-2">
                          {onSendAccess && (
                            <button
                              disabled={busyAction === 'send_access'}
                              onClick={() => void handleTriggerSendAccess(selectedClient)}
                              className="min-h-[40px] px-3 border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] font-bold rounded-xl hover:border-[var(--acc)] transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              <Send className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                              <span className="truncate">
                                {busyAction === 'send_access'
                                  ? 'Enviando...'
                                  : selectedClient.status === 'activo'
                                  ? 'Reenviar acceso'
                                  : 'Enviar link pago'}
                              </span>
                            </button>
                          )}
                          {onSendOtp && (
                            <button
                              disabled={
                                busyAction === 'send_otp' ||
                                selectedClient.status !== 'activo'
                              }
                              onClick={() => void handleTriggerSendOtp(selectedClient)}
                              title={
                                selectedClient.status !== 'activo'
                                  ? 'Activa al cliente primero para generar OTP'
                                  : 'Genera OTP y lo envía por WhatsApp'
                              }
                              className="min-h-[40px] px-3 border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] font-bold rounded-xl hover:border-[var(--acc)] transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                              <span className="truncate">
                                {busyAction === 'send_otp'
                                  ? 'Generando...'
                                  : 'Enviar OTP'}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline "+ Registrar Cobro" Form */}
                    {showAddPayment && (
                      <form
                        onSubmit={handleAddPaymentEntry}
                        className="p-3.5 rounded-2xl bg-[var(--card)] border-2 border-[var(--acc)] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-[var(--ink)]">
                            Registrar cobro y enviar acceso
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[var(--mute)] mb-1">
                              Monto (S/)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              className="w-full min-h-[40px] px-2.5 text-xs font-mono font-bold bg-[var(--bg)] border border-[var(--line)] rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[var(--mute)] mb-1">
                              Método
                            </label>
                            <select
                              value={payMethod}
                              onChange={(e) =>
                                setPayMethod(e.target.value as PaymentMethod)
                              }
                              className="w-full min-h-[40px] px-2 text-xs font-bold bg-[var(--bg)] border border-[var(--line)] rounded-xl"
                            >
                              {METHODS.filter((m) => m !== 'Por definir').map(
                                (m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          placeholder="Código de operación (opcional)"
                          className="w-full min-h-[40px] px-2.5 text-xs font-mono bg-[var(--bg)] border border-[var(--line)] rounded-xl"
                        />
                        <input
                          type="text"
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          placeholder="Nota (ej. Renovación o pago inicial)"
                          className="w-full min-h-[40px] px-2.5 text-xs bg-[var(--bg)] border border-[var(--line)] rounded-xl"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={busyAction === 'add_payment'}
                            className="flex-1 min-h-[40px] bg-[var(--acc)] text-[var(--accink)] font-bold rounded-xl cursor-pointer disabled:opacity-60"
                          >
                            {busyAction === 'add_payment'
                              ? 'Registrando...'
                              : 'Confirmar cobro y activar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddPayment(false)}
                            className="px-3 min-h-[40px] border border-[var(--line)] font-bold rounded-xl cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Full Editable Client Form */}
                    <form onSubmit={handleSaveDraft} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                          Nombre del cliente
                        </label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) =>
                            setDraft({ ...draft, name: e.target.value })
                          }
                          className="w-full min-h-[42px] px-3 font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            Estado de acceso
                          </label>
                          <select
                            value={draft.status}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                status: e.target.value as SubscriberStatus,
                              })
                            }
                            className="w-full min-h-[42px] px-2.5 font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="activo">Activo</option>
                            <option value="pausado">Pausado</option>
                            <option value="vencido">Vencido</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            Estado de pago
                          </label>
                          <select
                            value={draft.paymentStatus}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                paymentStatus: e.target.value as PaymentStatus,
                              })
                            }
                            className="w-full min-h-[42px] px-2.5 font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                          >
                            <option value="pagado">Pagado</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="reembolsado">Reembolsado</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            Plan
                          </label>
                          <select
                            value={draft.plan}
                            onChange={(e) => {
                              const nextPlan = e.target.value as SubscriberPlan;
                              setDraft({
                                ...draft,
                                plan: nextPlan,
                                amount: String(PLAN_PRICES[nextPlan]),
                              });
                            }}
                            className="w-full min-h-[42px] px-2.5 font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                          >
                            {PLANS.map((p) => (
                              <option key={p} value={p}>
                                {p} (S/ {PLAN_PRICES[p]})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            Monto base (S/)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={draft.amount}
                            onChange={(e) =>
                              setDraft({ ...draft, amount: e.target.value })
                            }
                            className="w-full min-h-[42px] px-2.5 font-mono font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            Método de pago
                          </label>
                          <select
                            value={draft.paymentMethod}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                paymentMethod: e.target.value as PaymentMethod,
                              })
                            }
                            className="w-full min-h-[42px] px-2.5 font-bold bg-[var(--card)] border border-[var(--line)] rounded-xl"
                          >
                            {METHODS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            N° Operación / Ref
                          </label>
                          <input
                            type="text"
                            value={draft.paymentRef}
                            onChange={(e) =>
                              setDraft({ ...draft, paymentRef: e.target.value })
                            }
                            placeholder="Ej. YP-94821"
                            className="w-full min-h-[42px] px-2.5 font-mono bg-[var(--card)] border border-[var(--line)] rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            WhatsApp
                          </label>
                          <input
                            type="text"
                            value={draft.phone}
                            onChange={(e) =>
                              setDraft({ ...draft, phone: e.target.value })
                            }
                            className="w-full min-h-[42px] px-2.5 font-mono bg-[var(--card)] border border-[var(--line)] rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                            Ciudad
                          </label>
                          <input
                            type="text"
                            value={draft.city}
                            onChange={(e) =>
                              setDraft({ ...draft, city: e.target.value })
                            }
                            className="w-full min-h-[42px] px-2.5 bg-[var(--card)] border border-[var(--line)] rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--mute)] mb-1">
                          Notas del administrador
                        </label>
                        <textarea
                          rows={2}
                          value={draft.notes}
                          onChange={(e) =>
                            setDraft({ ...draft, notes: e.target.value })
                          }
                          placeholder="Seguimiento, origen del lead, acuerdos..."
                          className="w-full p-2.5 text-xs bg-[var(--card)] border border-[var(--line)] rounded-xl resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={busyAction === 'save'}
                        className="w-full min-h-[44px] bg-[var(--ink)] text-[var(--card)] font-extrabold text-xs rounded-xl hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {busyAction === 'save'
                            ? 'Guardando cambios...'
                            : 'Guardar cambios del cliente'}
                        </span>
                      </button>
                    </form>

                    {/* WhatsApp Quick Message Template */}
                    <div className="pt-3 border-t border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Mensaje rápido WhatsApp</span>
                        </span>
                        <button
                          onClick={() => {
                            const msg =
                              selectedClient.status === 'activo'
                                ? `¡Hola ${selectedClient.name}! Tu membresía ${selectedClient.plan || 'Vitalicio'} en HOY ya está ACTIVA. Ingresa con tu número ${selectedClient.phone} y recibe tu código OTP aquí.`
                                : `¡Hola ${selectedClient.name}! Recibimos tu solicitud en HOY (${selectedClient.plan || 'Vitalicio'} · ${formatMoney(selectedClient.amount || 75)}). Envíanos tu comprobante por Yape/Plin para activar tu acceso al instante.`;
                            copyToClipboard(
                              msg,
                              'Mensaje listo para pegar en WhatsApp.'
                            );
                          }}
                          className="text-[11px] font-bold text-[var(--acc)] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar texto</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[var(--mute)] leading-relaxed bg-[var(--bg)] lg:bg-[var(--card)] border border-[var(--line)] rounded-xl p-2.5">
                        {selectedClient.status === 'activo'
                          ? `¡Hola ${selectedClient.name}! Tu membresía ${selectedClient.plan || 'Vitalicio'} en HOY ya está ACTIVA. Ingresa con tu número ${selectedClient.phone} y recibe tu código OTP aquí.`
                          : `¡Hola ${selectedClient.name}! Recibimos tu solicitud en HOY (${selectedClient.plan || 'Vitalicio'} · ${formatMoney(selectedClient.amount || 75)}). Envíanos tu comprobante por Yape/Plin para activar tu acceso al instante.`}
                      </p>
                    </div>

                    {/* Payment Ledger History for Client */}
                    <div className="pt-3 border-t border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--ink)]">
                          Historial de pagos ({selectedClient.payments?.length || 0})
                        </span>
                        <span className="font-mono font-extrabold text-[#16A34A] tabular-nums">
                          Total: {formatMoney(getClientPaidTotal(selectedClient))}
                        </span>
                      </div>

                      {selectedClient.payments && selectedClient.payments.length > 0 ? (
                        <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl bg-[var(--bg)] lg:bg-[var(--card)]">
                          {selectedClient.payments.map((p) => (
                            <div
                              key={p.id}
                              className="px-3 py-2 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-[var(--ink)] truncate">
                                  {p.method}
                                  {p.ref ? ` · ${p.ref}` : ''}
                                </p>
                                <p className="text-[10px] text-[var(--mute)] tabular-nums truncate">
                                  {p.date}
                                  {p.note ? ` · ${p.note}` : ''}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-[#16A34A] tabular-nums shrink-0">
                                +{formatMoney(Number(p.amount) || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[var(--mute)]">
                          Sin cobros confirmados aún.
                        </p>
                      )}
                    </div>

                    {/* Delete Client */}
                    <div className="pt-3 border-t border-[var(--line)]">
                      {confirmDeleteId === selectedClient.id ? (
                        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-2 w-full">
                          <span className="text-xs font-bold text-[#DC2626] flex-1">
                            ¿Eliminar definitivamente a {selectedClient.name}?
                          </span>
                          <button
                            disabled={busyAction === `delete-${selectedClient.id}`}
                            onClick={() => void handleDeleteClient(selectedClient)}
                            className="min-h-[36px] px-3 bg-[#DC2626] text-white font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[36px] px-3 border border-[var(--line)] bg-[var(--card)] font-bold rounded-lg text-xs cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(selectedClient.id)}
                          className="w-full min-h-[42px] rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-[#DC2626] hover:bg-red-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar cliente registrado</span>
                        </button>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </>
          ) : (
            /* Analytics & Earnings Tab */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--ink)]">
                      Flujo de ganancias diarias (últimos 7 días)
                    </h3>
                    <p className="text-xs text-[var(--mute)]">
                      Ingresos confirmados según fecha de pago o aprobación
                    </p>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-[#16A34A] tabular-nums">
                    Total acumulado: {formatMoney(metrics.totalEarnings)}
                  </span>
                </div>

                <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-4">
                  {metrics.dailySeries.map((day) => {
                    const heightPct =
                      day.amount > 0
                        ? Math.max(12, Math.round((day.amount / maxDailyRevenue) * 100))
                        : 4;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 h-full flex flex-col items-center justify-end gap-2"
                      >
                        <span className="text-[10px] font-mono font-bold tabular-nums text-[var(--ink)]">
                          {day.amount > 0 ? `S/ ${day.amount.toFixed(0)}` : 'S/ 0'}
                        </span>
                        <div className="w-full max-w-[44px] flex-1 flex items-end justify-center">
                          <div
                            className={`w-full rounded-t-xl transition-all ${
                              day.amount > 0
                                ? 'bg-[var(--acc)]'
                                : 'bg-[var(--line)]'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--mute)] tabular-nums">
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 p-5 space-y-3.5">
                  <h4 className="text-sm font-extrabold">Ganancias por plan</h4>
                  <div className="space-y-3">
                    {PLANS.map((plan) => {
                      const info = metrics.byPlan[plan];
                      const pct =
                        metrics.totalEarnings > 0
                          ? Math.round((info.revenue / metrics.totalEarnings) * 100)
                          : 0;
                      return (
                        <div key={plan} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold">
                              {plan} ({info.count})
                            </span>
                            <span className="font-mono font-bold tabular-nums">
                              {formatMoney(info.revenue)} · {pct}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
                            <div
                              className="h-full bg-[var(--acc)] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 p-5 space-y-3.5">
                  <h4 className="text-sm font-extrabold">Por método de pago</h4>
                  {metrics.byMethod.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.byMethod.map(([method, info]) => {
                        const pct =
                          metrics.totalEarnings > 0
                            ? Math.round(
                                (info.revenue / metrics.totalEarnings) * 100
                              )
                            : 0;
                        return (
                          <div key={method} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold">
                                {method} ({info.count})
                              </span>
                              <span className="font-mono font-bold tabular-nums">
                                {formatMoney(info.revenue)} · {pct}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
                              <div
                                className="h-full bg-[#16A34A] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--mute)]">
                      Aún no hay cobros confirmados.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 p-5 space-y-3.5">
                  <h4 className="text-sm font-extrabold">Clientes por ciudad</h4>
                  <div className="divide-y divide-[var(--line)]">
                    {metrics.byCity.slice(0, 6).map(([city, info]) => (
                      <div
                        key={city}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold truncate pr-2">
                          {city}{' '}
                          <span className="font-normal text-[var(--mute)]">
                            ({info.count})
                          </span>
                        </span>
                        <span className="font-mono font-bold tabular-nums shrink-0">
                          {formatMoney(info.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
