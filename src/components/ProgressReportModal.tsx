import React, { useState } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import {
  Check,
  Download,
  FileText,
  Flame,
  Calendar,
  FolderKanban,
  Clock,
  Printer,
  Sparkles,
  User,
  X,
} from 'lucide-react';

export interface ReportProject {
  id: number;
  name: string;
  step?: string;
  st: string;
  tasks?: Array<{ t: string; d: boolean; time?: string }>;
}

export interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userPhone?: string;
  userPlan?: string;
  avatarEmoji: string;
  avatarLabel: string;
  accentHex: string;
  streakCount: number;
  daysCompletedCount: number;
  last7Days: Array<{ date: string; letter: string; done: boolean }>;
  todayDone: number;
  todayTotal: number;
  todayDateLabel: string;
  todayYmd: string;
  todayPlan?: {
    priorityTask?: string;
    priorityTime?: string;
    routineType?: string;
  } | null;
  projects: ReportProject[];
  routines: {
    semana: [string, string][];
    domingo: [string, string][];
  };
  onExportSuccess: (message: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  ideas: 'Ideas',
  haciendo: 'Haciendo',
  esperando: 'Esperando',
  terminado: 'Terminado',
};

function cleanPdfText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .replace(/[•·]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return [59, 76, 202];
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return [59, 76, 202];
  }
  return [r, g, b];
}

export default function ProgressReportModal({
  isOpen,
  onClose,
  userName,
  userPhone,
  userPlan,
  avatarEmoji,
  avatarLabel,
  accentHex,
  streakCount,
  daysCompletedCount,
  last7Days,
  todayDone,
  todayTotal,
  todayDateLabel,
  todayYmd,
  todayPlan,
  projects,
  routines,
  onExportSuccess,
}: ProgressReportModalProps) {
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const todayPct =
    todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  const weekDoneCount = last7Days.filter((d) => d.done).length;
  const weekPct = Math.round((weekDoneCount / Math.max(1, last7Days.length)) * 100);
  const safeName = cleanPdfText(userName || 'Usuario HOY') || 'Usuario HOY';
  const firstName = safeName.split(' ')[0] || safeName;
  const safeAvatarLabel = cleanPdfText(avatarLabel || 'Impulso') || 'Impulso';

  const positiveTitle = `Mensaje para ti, ${firstName}`;
  const positiveBody =
    streakCount >= 7
      ? `${firstName}, llevas ${streakCount} días seguidos demostrando que tu palabra vale. Tu emblema de ${safeAvatarLabel} se construye con cada decisión diaria: sigue cuidando este ritmo imparable.`
      : streakCount >= 2
      ? `¡Vas con muy buen impulso, ${firstName}! Ya sumas ${streakCount} días consecutivos y ${daysCompletedCount} días cumplidos en tu camino. Un paso firme cada día vale más que mil planes perfectos.`
      : todayDone > 0
      ? `¡Excelente avance hoy, ${firstName}! Ya completaste ${todayDone} de ${todayTotal} hábitos de tu jornada. Recuerda que la constancia nace de empezar hoy, con ${safeAvatarLabel.toLowerCase()} y calma.`
      : `${firstName}, cada gran cambio empieza con una acción pequeña hecha hoy. Respira hondo, elige tu siguiente paso con ${safeAvatarLabel.toLowerCase()} y recuérdate: 5, 4, 3, 2, 1... y hazlo.`;

  const handleDownloadPdf = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      const [accR, accG, accB] = hexToRgb(accentHex);

      let y = 0;

      const drawHoyVectorLogo = (lx: number, ly: number, sizeMm: number) => {
        const s = sizeMm / 128;
        // Fondo blanco redondeado del tile HOY
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(lx, ly, sizeMm, sizeMm, 30 * s, 30 * s, 'F');
        // Pilares, puente cinetico y nodo solar en color del perfil
        doc.setFillColor(accR, accG, accB);
        doc.roundedRect(lx + 33 * s, ly + 32 * s, 14 * s, 64 * s, 7 * s, 7 * s, 'F');
        doc.roundedRect(lx + 81 * s, ly + 32 * s, 14 * s, 64 * s, 7 * s, 7 * s, 'F');
        doc.roundedRect(lx + 47 * s, ly + 58 * s, 34 * s, 12 * s, 4 * s, 4 * s, 'F');
        doc.circle(lx + 64 * s, ly + 39 * s, 6.5 * s, 'F');
      };

      const drawHeaderBanner = () => {
        doc.setFillColor(accR, accG, accB);
        doc.rect(0, 0, pageW, 41, 'F');

        // Logo arquitectonico HOY
        drawHoyVectorLogo(margin, 9.5, 16.5);

        const textX = margin + 21;
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(
          `HOY  |  EDICION PERSONAL DE ${firstName.toUpperCase()}`,
          textX,
          13.5
        );

        doc.setFontSize(18);
        doc.text(safeName, textX, 22.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const subMeta = [
          `Emblema: ${safeAvatarLabel}`,
          `Plan ${cleanPdfText(userPlan || 'Personal')}`,
          userPhone ? cleanPdfText(userPhone) : '',
          `Fecha: ${cleanPdfText(todayDateLabel)}`,
        ]
          .filter(Boolean)
          .join('   -   ');
        doc.text(subMeta, textX, 30.5);

        // Sello decorativo sutil derecha
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.35);
        doc.roundedRect(pageW - margin - 24, 11, 24, 14, 2.5, 2.5, 'D');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('EMBLEMA', pageW - margin - 12, 16, { align: 'center' });
        doc.setFontSize(8.5);
        doc.text(safeAvatarLabel.toUpperCase(), pageW - margin - 12, 21.5, {
          align: 'center',
        });

        y = 50;
      };

      const ensureSpace = (neededMm: number) => {
        if (y + neededMm <= pageH - 16) return;
        doc.addPage();
        y = 18;
      };

      const drawSectionTitle = (title: string) => {
        ensureSpace(14);
        doc.setFillColor(accR, accG, accB);
        doc.rect(margin, y - 3.5, 2.5, 5.5, 'F');
        doc.setTextColor(27, 42, 51);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.text(title, margin + 5.5, y + 0.5);
        y += 6.5;
        doc.setDrawColor(221, 228, 233);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 5.5;
      };

      drawHeaderBanner();

      // 1. DATOS PERSONALES
      drawSectionTitle('1. DATOS PERSONALES');

      const personalCardH = 26;
      ensureSpace(personalCardH + 6);
      doc.setFillColor(248, 250, 251);
      doc.setDrawColor(221, 228, 233);
      doc.roundedRect(margin, y, contentW, personalCardH, 3, 3, 'FD');

      const col1X = margin + 4;
      const col2X = margin + contentW / 2 + 2;

      const drawMetaField = (
        fx: number,
        fy: number,
        label: string,
        val: string
      ) => {
        doc.setTextColor(98, 114, 125);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.text(label.toUpperCase(), fx, fy);

        doc.setTextColor(27, 42, 51);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(cleanPdfText(val), fx, fy + 4.3);
      };

      drawMetaField(col1X, y + 6.5, 'Nombre completo', safeName);
      drawMetaField(
        col2X,
        y + 6.5,
        'WhatsApp / Cuenta',
        userPhone || 'Uso local en dispositivo'
      );
      drawMetaField(
        col1X,
        y + 17.5,
        'Plan / Membresia',
        `Plan ${cleanPdfText(userPlan || 'Personal')}`
      );
      drawMetaField(
        col2X,
        y + 17.5,
        'Emblema y Fecha',
        `${safeAvatarLabel}  -  ${cleanPdfText(todayDateLabel)}`
      );

      y += personalCardH + 7;

      // 2. RESUMEN DE CONSTANCIA
      drawSectionTitle('2. RESUMEN DE CONSTANCIA');

      const boxGap = 4;
      const boxW = (contentW - boxGap * 2) / 3;
      const boxH = 20;
      const metrics = [
        { label: 'RACHA ACTUAL', value: `${streakCount} ${streakCount === 1 ? 'dia' : 'dias'}` },
        { label: 'DIAS CUMPLIDOS', value: `${daysCompletedCount} en total` },
        { label: 'AVANCE DE HOY', value: `${todayDone}/${todayTotal} (${todayPct}%)` },
      ];

      metrics.forEach((m, idx) => {
        const bx = margin + idx * (boxW + boxGap);
        doc.setFillColor(246, 248, 250);
        doc.setDrawColor(221, 228, 233);
        doc.roundedRect(bx, y, boxW, boxH, 3, 3, 'FD');

        doc.setTextColor(98, 114, 125);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(m.label, bx + 4, y + 6.5);

        doc.setTextColor(27, 42, 51);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(m.value, bx + 4, y + 14.5);
      });
      y += boxH + 6;

      // Ultimos 7 dias
      ensureSpace(18);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(221, 228, 233);
      doc.roundedRect(margin, y, contentW, 17, 3, 3, 'FD');

      doc.setTextColor(27, 42, 51);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Ultimos 7 dias (${weekDoneCount}/7 - ${weekPct}%)`, margin + 4, y + 6);

      const pillStartX = margin + 4;
      const pillGap = (contentW - 8) / 7;
      last7Days.forEach((d, idx) => {
        const cx = pillStartX + idx * pillGap + 8;
        const cy = y + 12;
        if (d.done) {
          doc.setFillColor(accR, accG, accB);
          doc.circle(cx, cy, 3.2, 'F');
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setFillColor(242, 245, 247);
          doc.setDrawColor(200, 210, 218);
          doc.circle(cx, cy, 3.2, 'FD');
          doc.setTextColor(98, 114, 125);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(cleanPdfText(d.letter), cx, cy + 1, { align: 'center' });
      });
      y += 22;

      if (todayPlan?.priorityTask) {
        const prioText = cleanPdfText(
          `${todayPlan.priorityTime ? `[${todayPlan.priorityTime}] ` : ''}${todayPlan.priorityTask}`
        );
        const lines = doc.splitTextToSize(prioText, contentW - 10);
        const pH = 9 + lines.length * 4.5;
        ensureSpace(pH + 4);
        doc.setFillColor(246, 248, 250);
        doc.setDrawColor(accR, accG, accB);
        doc.roundedRect(margin, y, contentW, pH, 2.5, 2.5, 'FD');
        doc.setTextColor(accR, accG, accB);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('PRIORIDAD PLANIFICADA DE HOY', margin + 4, y + 5.5);
        doc.setTextColor(27, 42, 51);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(lines, margin + 4, y + 10.5);
        y += pH + 6;
      }

      // 3. PROYECTOS Y METAS
      drawSectionTitle(`3. PROYECTOS Y METAS (${projects.length})`);

      if (projects.length === 0) {
        ensureSpace(10);
        doc.setTextColor(98, 114, 125);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.text('Sin proyectos registrados todavia.', margin, y);
        y += 8;
      } else {
        projects.forEach((proj) => {
          const tasks = Array.isArray(proj.tasks) ? proj.tasks : [];
          const doneTasks = tasks.filter((t) => t.d).length;
          const statusStr = STATUS_LABEL[proj.st] || proj.st || 'Ideas';
          const projTitle = cleanPdfText(proj.name || 'Proyecto');

          ensureSpace(16);
          doc.setFillColor(246, 248, 250);
          doc.setDrawColor(221, 228, 233);
          doc.roundedRect(margin, y - 3.5, contentW, 9, 2, 2, 'FD');

          doc.setTextColor(27, 42, 51);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(projTitle, margin + 3.5, y + 2);

          doc.setTextColor(accR, accG, accB);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text(
            `${statusStr}  (${doneTasks}/${tasks.length})`,
            pageW - margin - 3.5,
            y + 2,
            { align: 'right' }
          );
          y += 9;

          if (proj.step?.trim()) {
            const stepLines = doc.splitTextToSize(
              `Siguiente paso: ${cleanPdfText(proj.step)}`,
              contentW - 8
            );
            ensureSpace(stepLines.length * 4.5 + 2);
            doc.setTextColor(98, 114, 125);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8.5);
            doc.text(stepLines, margin + 4, y);
            y += stepLines.length * 4.5 + 1.5;
          }

          tasks.forEach((task) => {
            const label = cleanPdfText(
              `${task.time ? `[${task.time}] ` : ''}${task.t}`
            );
            const taskLines = doc.splitTextToSize(label, contentW - 14);
            ensureSpace(taskLines.length * 4.5 + 2);

            if (task.d) {
              doc.setFillColor(46, 139, 87);
              doc.circle(margin + 6, y - 1, 1.5, 'F');
              doc.setTextColor(98, 114, 125);
            } else {
              doc.setDrawColor(160, 174, 184);
              doc.circle(margin + 6, y - 1, 1.5, 'D');
              doc.setTextColor(27, 42, 51);
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(taskLines, margin + 10, y);
            y += taskLines.length * 4.5 + 1.5;
          });

          y += 3.5;
        });
      }

      // 4. MIS RUTINAS DIARIAS
      drawSectionTitle('4. MIS RUTINAS DIARIAS');

      const renderRoutineBlock = (heading: string, list: [string, string][]) => {
        ensureSpace(12);
        doc.setTextColor(accR, accG, accB);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(heading, margin, y);
        y += 5.5;

        if (!list || list.length === 0) {
          ensureSpace(7);
          doc.setTextColor(98, 114, 125);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.text('Sin actividades configuradas.', margin + 3, y);
          y += 6;
          return;
        }

        list.forEach(([title, time], i) => {
          const timeText = cleanPdfText(time || '--:--');
          const itemLines = doc.splitTextToSize(cleanPdfText(title), contentW - 24);
          ensureSpace(itemLines.length * 4.5 + 2);

          doc.setTextColor(98, 114, 125);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text(`${i + 1}.`, margin + 2, y);
          doc.text(timeText, margin + 8, y);

          doc.setTextColor(27, 42, 51);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(itemLines, margin + 22, y);
          y += itemLines.length * 4.5 + 1.5;
        });
        y += 4;
      };

      renderRoutineBlock('Rutina de Semana (Lunes a Sabado)', routines.semana);
      renderRoutineBlock('Rutina de Domingo', routines.domingo);

      // 5. MENSAJE POSITIVO DE CIERRE PERSONALIZADO AL FINAL DE LA PAGINA
      const cleanPositiveBody = cleanPdfText(positiveBody);
      const positiveLines = doc.splitTextToSize(cleanPositiveBody, contentW - 14);
      const positiveBoxH = 19 + positiveLines.length * 4.8;
      ensureSpace(positiveBoxH + 8);

      // Anclar el mensaje motivacional al final de la pagina (encima del pie de pagina)
      y = Math.max(y + 4, pageH - 16 - positiveBoxH);
      const tintR = Math.round(accR * 0.08 + 255 * 0.92);
      const tintG = Math.round(accG * 0.08 + 255 * 0.92);
      const tintB = Math.round(accB * 0.08 + 255 * 0.92);
      doc.setFillColor(tintR, tintG, tintB);
      doc.setDrawColor(accR, accG, accB);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, contentW, positiveBoxH, 3, 3, 'FD');

      // Barra lateral acento
      doc.setFillColor(accR, accG, accB);
      doc.rect(margin, y, 2.5, positiveBoxH, 'F');

      doc.setTextColor(accR, accG, accB);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(cleanPdfText(positiveTitle).toUpperCase(), margin + 7, y + 6.5);

      doc.setTextColor(27, 42, 51);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(positiveLines, margin + 7, y + 12.5);

      doc.setTextColor(98, 114, 125);
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(8);
      doc.text(
        `- Con impulso diario, tu espacio HOY (${safeAvatarLabel})`,
        margin + 7,
        y + positiveBoxH - 4
      );
      y += positiveBoxH + 4;

      // Pie de pagina en todas las paginas
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(221, 228, 233);
        doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
        doc.setTextColor(120, 134, 145);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('HOY - Sistema de Ejecucion Diaria', margin, pageH - 7.5);
        doc.text(`Pagina ${p} de ${totalPages}`, pageW - margin, pageH - 7.5, {
          align: 'right',
        });
      }

      const slug = safeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'usuario';
      doc.save(`hoy-resumen-${slug}-${todayYmd}.pdf`);
      onExportSuccess('Resumen PDF descargado.');
    } catch {
      onExportSuccess('No se pudo generar el PDF. Usa Imprimir para guardarlo.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-sm sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-3xl bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Barra de acciones superior (oculta al imprimir) */}
        <div className="no-print px-4 sm:px-6 py-3.5 border-b border-[var(--line)] flex items-center justify-between gap-2 shrink-0 bg-[var(--card)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--acc)]/12 text-[var(--acc)] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                Resumen de Progreso (PDF)
              </h3>
              <p className="text-[11px] text-[var(--mute)] truncate">
                Vista previa lista para descargar o imprimir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[38px] px-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs font-bold hover:border-[var(--acc)] flex items-center gap-1.5 cursor-pointer transition"
              title="Imprimir o guardar PDF desde el navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={generating}
              className="min-h-[38px] px-3.5 rounded-xl bg-[var(--acc)] text-[var(--accink)] text-xs font-bold hover:opacity-95 disabled:opacity-60 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{generating ? 'Generando...' : 'Descargar PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="min-h-[38px] min-w-[38px] rounded-xl text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vista previa tipo hoja A4 */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-3 sm:p-6">
          <div
            id="hoy-pdf-sheet"
            className="bg-white text-[#1B2A33] rounded-2xl border border-[#DDE4E9] shadow-sm overflow-hidden max-w-xl mx-auto"
          >
            {/* Cabecera personalizada con Logo HOY */}
            <div
              className="px-5 py-5 sm:px-7 sm:py-6 text-white"
              style={{ backgroundColor: accentHex }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Logotipo Arquitectónico HOY sobre fondo blanco */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 p-1.5">
                    <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
                      <rect x="33" y="32" width="14" height="64" rx="7" fill={accentHex} />
                      <rect x="81" y="32" width="14" height="64" rx="7" fill={accentHex} />
                      <rect x="47" y="58" width="34" height="12" rx="4" fill={accentHex} fillOpacity="0.9" />
                      <circle cx="64" cy="39" r="6.5" fill={accentHex} />
                    </svg>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/85">
                      HOY · Edición personal de {firstName}
                    </p>
                    <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight truncate">
                      {userName || 'Mi Perfil HOY'}
                    </h4>
                    <p className="text-xs text-white/90 capitalize">
                      {avatarEmoji} {avatarLabel} · Plan {userPlan || 'Personal'} · {todayDateLabel}
                    </p>
                  </div>
                </div>

                <div className="w-11 h-11 rounded-2xl bg-white/18 border border-white/25 flex items-center justify-center text-2xl shrink-0">
                  {avatarEmoji}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* 1. Datos Personales */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E5ECF0] pb-1.5">
                  <User className="w-4 h-4" style={{ color: accentHex }} />
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#1B2A33]">
                    1. Datos Personales
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-[#E5ECF0] bg-[#F8FAFB] p-3.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#62727D]">
                      Nombre completo
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-[#1B2A33] mt-0.5">
                      {userName || 'Mi Perfil HOY'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#62727D]">
                      WhatsApp / Cuenta
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-[#1B2A33] font-mono mt-0.5">
                      {userPhone || 'Uso local en dispositivo'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#62727D]">
                      Plan / Membresía
                    </p>
                    <p className="text-xs font-bold text-[#1B2A33] mt-0.5">
                      Plan {userPlan || 'Personal'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#62727D]">
                      Emblema y Fecha
                    </p>
                    <p className="text-xs font-bold text-[#1B2A33] capitalize mt-0.5">
                      {avatarEmoji} {avatarLabel} · {todayDateLabel}
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Resumen de Constancia */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E5ECF0] pb-1.5">
                  <Flame className="w-4 h-4" style={{ color: accentHex }} />
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#1B2A33]">
                    2. Resumen de Constancia
                  </h5>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl border border-[#E5ECF0] bg-[#F8FAFB] p-3">
                    <p className="text-[10px] font-bold uppercase text-[#62727D]">
                      Racha actual
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-[#1B2A33] tabular-nums mt-0.5">
                      {streakCount} {streakCount === 1 ? 'día' : 'días'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5ECF0] bg-[#F8FAFB] p-3">
                    <p className="text-[10px] font-bold uppercase text-[#62727D]">
                      Días cumplidos
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-[#1B2A33] tabular-nums mt-0.5">
                      {daysCompletedCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5ECF0] bg-[#F8FAFB] p-3">
                    <p className="text-[10px] font-bold uppercase text-[#62727D]">
                      Avance de hoy
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-[#1B2A33] tabular-nums mt-0.5">
                      {todayDone}/{todayTotal} ({todayPct}%)
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E5ECF0] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#1B2A33] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#62727D]" />
                      Últimos 7 días ({weekDoneCount}/7 · {weekPct}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {last7Days.map((d) => (
                      <div key={d.date} className="flex flex-col items-center gap-1">
                        <span
                          className="w-7 h-7 rounded-full text-[11px] font-extrabold flex items-center justify-center border"
                          style={
                            d.done
                              ? {
                                  backgroundColor: accentHex,
                                  borderColor: accentHex,
                                  color: '#FFFFFF',
                                }
                              : {
                                  backgroundColor: '#F2F5F7',
                                  borderColor: '#DDE4E9',
                                  color: '#62727D',
                                }
                          }
                        >
                          {d.done ? '✓' : d.letter}
                        </span>
                        <span className="text-[9px] font-bold text-[#62727D]">
                          {d.letter}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {todayPlan?.priorityTask && (
                  <div
                    className="rounded-xl border p-3 bg-[#F8FAFB]"
                    style={{ borderColor: `${accentHex}55` }}
                  >
                    <p
                      className="text-[10px] font-extrabold uppercase tracking-wider"
                      style={{ color: accentHex }}
                    >
                      Prioridad planificada de hoy
                    </p>
                    <p className="text-xs font-bold text-[#1B2A33] mt-0.5">
                      {todayPlan.priorityTime ? `${todayPlan.priorityTime} · ` : ''}
                      {todayPlan.priorityTask}
                    </p>
                  </div>
                )}
              </section>

              {/* 3. Proyectos y Metas */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E5ECF0] pb-1.5">
                  <FolderKanban className="w-4 h-4" style={{ color: accentHex }} />
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#1B2A33]">
                    3. Proyectos y Metas ({projects.length})
                  </h5>
                </div>

                {projects.length === 0 ? (
                  <p className="text-xs text-[#62727D] italic">
                    Aún no tienes proyectos registrados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {projects.map((proj) => {
                      const tasks = Array.isArray(proj.tasks) ? proj.tasks : [];
                      const doneTasks = tasks.filter((t) => t.d).length;
                      return (
                        <div
                          key={proj.id}
                          className="rounded-xl border border-[#E5ECF0] p-3.5 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-[#1B2A33] leading-snug">
                                {proj.name}
                              </p>
                              {proj.step?.trim() && (
                                <p className="text-[11px] text-[#62727D] mt-0.5">
                                  Siguiente paso: {proj.step}
                                </p>
                              )}
                            </div>
                            <span
                              className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#F2F5F7] text-[#1B2A33] border border-[#DDE4E9]"
                            >
                              {STATUS_LABEL[proj.st] || proj.st} · {doneTasks}/{tasks.length}
                            </span>
                          </div>

                          {tasks.length > 0 && (
                            <ul className="space-y-1 pt-1 border-t border-[#F0F4F7]">
                              {tasks.map((task, idx) => (
                                <li
                                  key={idx}
                                  className={`text-xs flex items-start gap-2 ${
                                    task.d ? 'text-[#62727D] line-through' : 'text-[#1B2A33]'
                                  }`}
                                >
                                  <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] ${
                                      task.d
                                        ? 'bg-[#2E8B57] text-white'
                                        : 'border border-[#CBD5DC] text-transparent'
                                    }`}
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                  <span>
                                    {task.time ? (
                                      <span className="font-mono text-[11px] font-bold mr-1.5 text-[#62727D]">
                                        {task.time}
                                      </span>
                                    ) : null}
                                    {task.t}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 4. Mis Rutinas Diarias */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E5ECF0] pb-1.5">
                  <Clock className="w-4 h-4" style={{ color: accentHex }} />
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#1B2A33]">
                    4. Mis Rutinas Diarias
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#E5ECF0] p-3.5 space-y-2">
                    <p
                      className="text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: accentHex }}
                    >
                      Semana (Lun–Sáb)
                    </p>
                    {routines.semana.length === 0 ? (
                      <p className="text-xs text-[#62727D]">Sin hábitos</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {routines.semana.map(([title, time], idx) => (
                          <li
                            key={idx}
                            className="text-xs flex items-baseline gap-2 text-[#1B2A33]"
                          >
                            <span className="font-mono text-[11px] font-bold text-[#62727D] shrink-0 w-11 tabular-nums">
                              {time || '--:--'}
                            </span>
                            <span>{title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#E5ECF0] p-3.5 space-y-2">
                    <p
                      className="text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: accentHex }}
                    >
                      Domingo
                    </p>
                    {routines.domingo.length === 0 ? (
                      <p className="text-xs text-[#62727D]">Sin hábitos</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {routines.domingo.map(([title, time], idx) => (
                          <li
                            key={idx}
                            className="text-xs flex items-baseline gap-2 text-[#1B2A33]"
                          >
                            <span className="font-mono text-[11px] font-bold text-[#62727D] shrink-0 w-11 tabular-nums">
                              {time || '--:--'}
                            </span>
                            <span>{title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              {/* Mensaje positivo de cierre personalizado */}
              <section
                className="rounded-2xl border p-4 sm:p-5 space-y-2"
                style={{
                  borderColor: `${accentHex}55`,
                  backgroundColor: `${accentHex}0D`,
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
                  <h5
                    className="text-xs font-extrabold uppercase tracking-wider"
                    style={{ color: accentHex }}
                  >
                    {positiveTitle}
                  </h5>
                </div>
                <p className="text-xs sm:text-[13px] text-[#1B2A33] leading-relaxed font-medium">
                  {positiveBody}
                </p>
                <p className="text-[11px] font-bold text-[#62727D] pt-1">
                  {avatarEmoji} Con impulso diario · Tu espacio HOY
                </p>
              </section>

              <div className="pt-2 border-t border-[#E5ECF0] flex items-center justify-between text-[10px] text-[#62727D]">
                <span>HOY · Sistema de Ejecución Diaria</span>
                <span>Personalizado para {firstName}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
