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

  // Señales de estado
  public cargando = signal(true);
  public totalBeneficiarios = signal(0);
  public totalFamilias = signal(0);
  public balanceCaja = signal(0);

  // Datos del usuario logueado
  public usuarioActual = this.authService.usuarioActual;
  public isAdmin = computed(() => this.usuarioActual()?.rol === 'ADMIN');
  public nombreUsuario = computed(() => this.usuarioActual()?.nombre || 'Dirigente');

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    this.cargando.set(true);

    // 1. Cargar Beneficiarios (para saber cuántos chicos hay)
    this.beneficiarioService.getBeneficiarios().subscribe((b) => {
      this.totalBeneficiarios.set(b.length);
    });

    // 2. Cargar Familias
    this.familiaService.getFamilias().subscribe((f) => {
      this.totalFamilias.set(f.length);
    });

    // 3. Si es ADMIN, calculamos el balance de la caja (Traemos todo el historial)
    if (this.isAdmin()) {
      this.cajaService.getMovimientos().subscribe((movimientos) => {
        const balance = movimientos.reduce((acc, mov) => {
          const monto = Number(mov.monto);
          return mov.tipo === 'INGRESO' ? acc + monto : acc - monto;
        }, 0);
        this.balanceCaja.set(balance);
        this.cargando.set(false);
      });
    } else {
      this.cargando.set(false); // Si no es admin, termina de cargar antes
    }
  }
}
