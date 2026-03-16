import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LegajoService } from '../../../../core/services/legajo.service';
import { DocumentoLegajo } from '../../../../models/legajo.model';
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';

@Component({
  selector: 'app-legajo-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legajo-page.component.html',
})
export class LegajoPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private legajoService = inject(LegajoService);
  private beneficiarioService = inject(BeneficiarioService);

  public idBeneficiario = 0;
  public documentos = signal<DocumentoLegajo[]>([]);
  public beneficiario = signal<any>(null);
  public cargando = signal(true);
  public subiendo = signal(false);
  public archivoSeleccionado: File | null = null;

  public urlBackend = 'http://localhost:3000';

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.idBeneficiario = Number(params['id']);
      this.cargarDatosBeneficiario();
      this.cargarDocumentos();
    });
  }

  cargarDatosBeneficiario() {
    this.beneficiarioService.getBeneficiarioById(this.idBeneficiario).subscribe({
      next: (data) => this.beneficiario.set(data),
      error: (err) => console.error('Error al cargar el beneficiario', err),
    });
  }

  cargarDocumentos() {
    this.cargando.set(true);
    this.legajoService.getDocumentos(this.idBeneficiario).subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
      },
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
    }
  }

  subirArchivo() {
    if (!this.archivoSeleccionado) return;

    this.subiendo.set(true);
    this.legajoService.subirDocumento(this.idBeneficiario, this.archivoSeleccionado).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.archivoSeleccionado = null;

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.cargarDocumentos();
      },
      error: (err) => {
        console.error(err);
        this.subiendo.set(false);
        alert('Error al subir el archivo.');
      },
    });
  }

  eliminarDoc(idDocumento: number) {
    if (confirm('¿Estás seguro de que querés borrar este documento?')) {
      this.legajoService.eliminarDocumento(idDocumento).subscribe({
        next: () => this.cargarDocumentos(),
        error: (err) => {
          console.error(err);
          alert('Error al eliminar el documento.');
        },
      });
    }
  }

  getIcono(tipo: string): string {
    if (tipo.includes('pdf')) return '📄';
    if (tipo.includes('image')) return '🖼️';
    return '📁';
  }
}
