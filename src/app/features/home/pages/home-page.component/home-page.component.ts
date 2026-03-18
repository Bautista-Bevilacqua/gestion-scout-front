import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';
import { FamiliaService } from '../../../../core/services/familia.service';
import { CajaService } from '../../../../core/services/caja.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent implements OnInit {
  public authService = inject(AuthService);
  private beneficiarioService = inject(BeneficiarioService);
  private familiaService = inject(FamiliaService);
  private cajaService = inject(CajaService);

  // Señales de estado general
  public cargando = signal(true);
  public totalBeneficiarios = signal(0);
  public totalFamilias = signal(0);
  public balanceCaja = signal(0);

  // NUEVO: Señal para los beneficiarios de la rama del dirigente
  public beneficiariosDeMiRama = signal(0);

  // Datos del usuario logueado
  public usuarioActual = this.authService.usuarioActual;

  // Helpers para los roles
  public isAdmin = computed(() => this.usuarioActual()?.rol === 'ADMIN');
  public rolUsuario = computed(() => this.usuarioActual()?.rol || 'Invitado');
  public nombreUsuario = computed(() => this.usuarioActual()?.nombre || 'Dirigente');

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    this.cargando.set(true);

    this.beneficiarioService.getBeneficiarios().subscribe((b) => {
      this.totalBeneficiarios.set(b.length);

      // Si NO es admin, calculamos cuántos chicos hay en su rama específica
      if (!this.isAdmin()) {
        const rol = this.rolUsuario();
        // Capitalizamos el rol (ej: MANADA -> Manada) para que coincida con la BD
        const ramaCapitalizada = rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();

        const chicosDeRama = b.filter((chico) => chico.rama_actual === ramaCapitalizada);
        this.beneficiariosDeMiRama.set(chicosDeRama.length);
      }
    });

    if (this.isAdmin()) {
      // Los admin cargan familias y caja
      this.familiaService.getFamilias().subscribe((f) => {
        this.totalFamilias.set(f.length);
      });

      this.cajaService.getMovimientos().subscribe((movimientos) => {
        const balance = movimientos.reduce((acc, mov) => {
          const monto = Number(mov.monto);
          return mov.tipo === 'INGRESO' ? acc + monto : acc - monto;
        }, 0);
        this.balanceCaja.set(balance);
        this.cargando.set(false);
      });
    } else {
      // Si no es admin, termina más rápido
      this.cargando.set(false);
    }
  }

  // Helper para generar el link a la rama correcta
  getLinkMiRama(): string {
    const rol = this.rolUsuario();
    if (rol === 'ADMIN') return '/beneficiarios';
    const ramaCapitalizada = rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
    return `/beneficiarios/rama/${ramaCapitalizada}`;
  }
}
