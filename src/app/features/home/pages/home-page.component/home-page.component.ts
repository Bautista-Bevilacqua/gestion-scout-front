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

  public cargando = signal(true);
  public totalBeneficiarios = signal(0);
  public totalFamilias = signal(0);
  public balanceCaja = signal(0);
  public beneficiariosDeMiRama = signal(0);

  public usuarioActual = this.authService.usuarioActual;

  // --- LÓGICA DE ROLES ACTUALIZADA ---
  // Definimos quiénes ven el dashboard "completo"
  public esGestion = computed(() => {
    const rol = this.usuarioActual()?.rol;
    return ['ADMIN', 'JEFE_GRUPO', 'ADMINISTRACION'].includes(rol || '');
  });

  public rolUsuario = computed(() => this.usuarioActual()?.rol || 'Invitado');
  public nombreUsuario = computed(() => this.usuarioActual()?.nombre || 'Dirigente');

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    this.cargando.set(true);

    // 1. Todos cargan beneficiarios (pero el servicio ya los filtra por rol en el backend)
    this.beneficiarioService.getBeneficiarios().subscribe((b) => {
      this.totalBeneficiarios.set(b.length);

      // Si es un dirigente de rama, calculamos el total de su rama específica
      if (!this.esGestion()) {
        const rol = this.rolUsuario();
        const ramaCapitalizada = rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
        const chicosDeRama = b.filter((chico) => chico.rama_actual === ramaCapitalizada);
        this.beneficiariosDeMiRama.set(chicosDeRama.length);
      }
    });

    // 2. Solo los roles de gestión cargan estadísticas de Familias y Caja
    if (this.esGestion()) {
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
      this.cargando.set(false);
    }
  }

  getLinkMiRama(): string {
    const rol = this.rolUsuario();
    // Si es gestión, el link principal es la nómina general
    if (this.esGestion()) return '/beneficiarios';

    // Si es rama, va a su rama específica
    const ramaCapitalizada = rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
    return `/beneficiarios/rama/${ramaCapitalizada}`;
  }
}
