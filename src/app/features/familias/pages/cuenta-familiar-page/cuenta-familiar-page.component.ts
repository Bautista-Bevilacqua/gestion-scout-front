import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';

@Component({
  selector: 'app-cuenta-familiar-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cuenta-familiar-page.component.html',
})
export class CuentaFamiliarPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private beneficiarioService = inject(BeneficiarioService);

  public hijos = signal<any[]>([]);
  public cargando = signal(true);
  public nombreFamilia = signal('');

  public totalFamiliar = computed(() => {
    return this.hijos().reduce((acc, hijo) => acc + Number(hijo.deuda_total), 0);
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarHijos(id);
  }

  cargarHijos(id: number) {
    this.beneficiarioService.getPorFamilia(id).subscribe((data) => {
      this.hijos.set(data);

      if (data.length > 0) {
        // 2. Corregimos el nombre: usamos el apellido de familia o el apellido del primer hijo
        this.nombreFamilia.set(data[0].apellido_familia || data[0].apellido);
      }
      this.cargando.set(false);
    });
  }

  getRamaClass(rama: string): string {
    const ramaNormalized = rama.toUpperCase();

    switch (ramaNormalized) {
      case 'MANADA':
        return 'badge-warning'; // Amarillo
      case 'UNIDAD':
        return 'badge-success '; // Verde
      case 'CAMINANTES':
        return 'badge-info '; // Azul
      case 'ROVERS':
        return 'badge-error '; // Rojo
      default:
        return 'badge-ghost'; // Gris si no coincide
    }
  }
}
