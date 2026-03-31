import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventoService } from '../../../../core/services/evento.service';
import { Evento } from '../../../../models/evento.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import timeGridPlugin from '@fullcalendar/timegrid';

@Component({
  selector: 'app-calendario-page',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, ReactiveFormsModule, ],
  templateUrl: './calendario-page.component.html',
  styleUrl: './calendario-page.component.css',
})
export class CalendarioPageComponent implements OnInit {
  private eventoService = inject(EventoService);
  private fb = inject(FormBuilder);

  public eventos = signal<Evento[]>([]);
  public guardando = signal(false);
  public eventoSeleccionado = signal<Evento | null>(null);

  public proximosEventos = computed(() => {
    const hoyStr = new Date().toISOString().split('T')[0]; // "2026-03-20"

    return this.eventos()
      .filter((e) => {
        const fechaInicioLimpia = e.fecha_inicio.split('T')[0];
        return fechaInicioLimpia >= hoyStr;
      })
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
      .slice(0, 5);
  });

  public eventoForm = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    fecha_inicio: ['', Validators.required],
    hora_inicio: ['00:00'],
    fecha_fin: [''],
    hora_fin: ['00:00'],
    todo_el_dia: [true],
    alcance: ['GRUPO', Validators.required],
    color: ['#3b82f6', Validators.required],
  });

  public calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    editable: true,
    selectable: true,
    eventDurationEditable: true, // <--- FUERZA a que se pueda estirar siempre
    eventResizableFromStart: true, // <--- PERMITE estirar desde el lado izquierdo
    eventStartEditable: true, // <--- PERMITE mover el inicio

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },

    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
    },

    allDaySlot: true,

    dateClick: (arg) => this.abrirModalNuevo(arg.dateStr),
    eventClick: (arg) => this.verDetalleEvento(arg.event.id),
    eventDrop: (info) => this.actualizarFechaEvento(info),
    eventResize: (info) => this.actualizarFechaEvento(info),

    events: [],
  };

  ngOnInit() {
    this.cargarEventos();
  }

  cargarEventos() {
    this.eventoService.getEventos().subscribe((data) => {
      this.eventos.set(data);

      const eventosFC: EventInput[] = data.map((e) => {
        const inicioTieneHora = e.fecha_inicio.includes('T');
        const finTieneHora = e.fecha_fin?.includes('T');

        return {
          id: e.id_evento.toString(),
          title: e.titulo,
          start: e.fecha_inicio,
          // Si el FIN tiene hora, lo mandamos directo. Si no tiene, es todo el día y ajustamos.
          end: e.fecha_fin
            ? finTieneHora
              ? e.fecha_fin
              : this.ajustarFechaFin(e.fecha_fin)
            : undefined,

          allDay: !inicioTieneHora,
          backgroundColor: e.color,
          borderColor: e.color,
          display: 'block',
        };
      });

      this.calendarOptions = { ...this.calendarOptions, events: eventosFC };
    });
  }

  private ajustarFechaFin(fechaStr: string): string {
    // Creamos la fecha al mediodía para evitar problemas de zona horaria
    const fecha = new Date(fechaStr + 'T12:00:00');
    // Le sumamos el día extra que pide FullCalendar para mostrar el bloque completo
    fecha.setDate(fecha.getDate() + 1);

    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  actualizarFechaEvento(info: any) {
    const eventoId = Number(info.event.id);
    const eventoOriginal = this.eventos().find((e) => e.id_evento === eventoId);

    if (!eventoOriginal) return;

    // Función de formateo mejorada
    const formatParaDB = (date: Date | null, esTodoElDia: boolean, esFechaFin: boolean = false) => {
      if (!date) return undefined;

      const d = new Date(date.getTime());

      // SIEMPRE que sea la fecha de FIN de un evento de todo el día,
      // restamos 1 día porque FullCalendar lo entrega "exclusivo" (un día después).
      if (esTodoElDia && esFechaFin) {
        d.setDate(d.getDate() - 1);
      }

      const anio = d.getFullYear();
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const dia = d.getDate().toString().padStart(2, '0');
      const fechaBase = `${anio}-${mes}-${dia}`;

      if (esTodoElDia) {
        return fechaBase;
      } else {
        const horas = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        return `${fechaBase}T${horas}:${mins}`;
      }
    };

    const datosActualizados: Partial<Evento> = {
      ...eventoOriginal,
      // Para el inicio NO restamos nada
      fecha_inicio: formatParaDB(info.event.start, info.event.allDay, false)!,
      // Para el fin SI restamos si es todo el día
      fecha_fin: info.event.end ? formatParaDB(info.event.end, info.event.allDay, true) : undefined,
    };

    this.eventoService.updateEvento(eventoId, datosActualizados).subscribe({
      next: () => {
        this.cargarEventos();
        console.log('Evento actualizado correctamente');
      },
      error: () => {
        alert('Error al actualizar');
        info.revert();
      },
    });
  }

  abrirModalNuevo(fechaSeleccionada?: string) {
    this.eventoSeleccionado.set(null);
    this.eventoForm.reset({
      alcance: 'GRUPO',
      color: '#3b82f6',
      todo_el_dia: true,
      fecha_inicio: fechaSeleccionada || '',
      fecha_fin: fechaSeleccionada || '',
      hora_inicio: '15:00',
      hora_fin: '18:00',
    });
    (document.getElementById('modal_nuevo_evento') as HTMLDialogElement)?.showModal();
  }

  verDetalleEvento(idEventoStr: string) {
    const evento = this.eventos().find((e) => e.id_evento.toString() === idEventoStr);
    if (evento) {
      this.eventoSeleccionado.set(evento);
      (document.getElementById('modal_detalle_evento') as HTMLDialogElement)?.showModal();
    }
  }

  cerrarDetalle() {
    (document.getElementById('modal_detalle_evento') as HTMLDialogElement)?.close();
  }

  prepararBorrado() {
    this.cerrarDetalle();
    (document.getElementById('modal_borrar_evento') as HTMLDialogElement)?.showModal();
  }

  prepararEdicion() {
    const ev = this.eventoSeleccionado();
    if (!ev) return;

    const tieneHora = ev.fecha_inicio.includes('T');

    // Separamos y limpiamos las horas (HH:mm)
    const [fInicio, hInicioFull] = tieneHora
      ? ev.fecha_inicio.split('T')
      : [ev.fecha_inicio, '15:00'];
    const hInicio = hInicioFull?.slice(0, 5); // Cortamos a 5 caracteres

    let fFin = '';
    let hFin = '18:30';

    if (ev.fecha_fin) {
      if (ev.fecha_fin.includes('T')) {
        const parts = ev.fecha_fin.split('T');
        fFin = parts[0];
        hFin = parts[1].slice(0, 5); // Cortamos a 5 caracteres
      } else {
        fFin = ev.fecha_fin;
      }
    }

    this.eventoForm.patchValue({
      titulo: ev.titulo,
      descripcion: ev.descripcion,
      todo_el_dia: !tieneHora,
      fecha_inicio: fInicio,
      hora_inicio: hInicio,
      fecha_fin: fFin,
      hora_fin: hFin,
      alcance: ev.alcance,
      color: ev.color,
    });

    this.cerrarDetalle();
    (document.getElementById('modal_nuevo_evento') as HTMLDialogElement)?.showModal();
  }

  guardar() {
    if (this.eventoForm.invalid) return;
    this.guardando.set(true);

    const f = this.eventoForm.getRawValue();

    // 1. Construimos fecha_inicio
    let inicio = f.fecha_inicio!;
    if (!f.todo_el_dia && f.hora_inicio) {
      inicio = `${f.fecha_inicio}T${f.hora_inicio}`;
    }

    // 2. Construimos fecha_fin (Súper robusto)
    let fin = undefined;
    if (f.todo_el_dia) {
      fin = f.fecha_fin || undefined;
    } else {
      // Si no puso fecha de fin, usamos la de inicio para que no sea null
      const fechaBaseFin = f.fecha_fin || f.fecha_inicio;
      fin = `${fechaBaseFin}T${f.hora_fin}`;
    }

    const datosEvento: Partial<Evento> = {
      titulo: f.titulo!,
      descripcion: f.descripcion || undefined,
      fecha_inicio: inicio,
      fecha_fin: fin,
      alcance: f.alcance!,
      color: f.color!,
    };

    const idEdicion = this.eventoSeleccionado()?.id_evento;

    if (idEdicion) {
      this.eventoService.updateEvento(idEdicion, datosEvento).subscribe({
        next: () => this.finalizarGuardado(),
        error: () => this.errorGuardado(),
      });
    } else {
      this.eventoService.crearEvento(datosEvento).subscribe({
        next: () => this.finalizarGuardado(),
        error: () => this.errorGuardado(),
      });
    }
  }

  private finalizarGuardado() {
    this.guardando.set(false);
    this.eventoSeleccionado.set(null);
    this.cerrarModal();
    this.cargarEventos();
  }

  private errorGuardado() {
    alert('Hubo un error al procesar la actividad');
    this.guardando.set(false);
  }

  confirmarBorrado() {
    const evento = this.eventoSeleccionado();
    if (!evento) return;

    this.eventoService.eliminarEvento(evento.id_evento).subscribe({
      next: () => {
        this.cargarEventos();
        this.eventoSeleccionado.set(null);
      },
      error: () => alert('No se pudo borrar el evento'),
    });
  }

  cambiarRama(event: any) {
    const colores: any = {
      GRUPO: '#3b82f6',
      MANADA: '#eab308',
      UNIDAD: '#22c55e',
      CAMINANTES: '#0ea5e9',
      ROVERS: '#ef4444',
    };
    this.eventoForm.patchValue({ color: colores[event.target.value] });
  }

  cerrarModal() {
    (document.getElementById('modal_nuevo_evento') as HTMLDialogElement)?.close();
  }
}
