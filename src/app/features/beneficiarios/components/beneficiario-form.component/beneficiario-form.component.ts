import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Beneficiario } from '../../../../models/beneficiario.model';
import { Familia } from '../../../../models/familia.model';
import { BuscadorFamiliaComponent } from '../../../../shared/components/buscador-familia/buscador-familia.component';
import { SelectorRamaComponent } from '../../../../shared/components/selector-rama/selector-rama.component';
import { CustomValidators } from '../../../../core/utils/custom-validators';

@Component({
  selector: 'app-formulario-beneficiario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BuscadorFamiliaComponent, SelectorRamaComponent],
  templateUrl: './beneficiario-form.component.html',
})
export class FormularioBeneficiarioComponent implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() beneficiarioInicial: Beneficiario | null = null;
  @Input() familiaPrecargada: Familia | null = null;
  @Input() esEdicion: boolean = false;

  @Output() onSubmit = new EventEmitter<Beneficiario>();

  public formEnviado = signal<boolean>(false);

  public beneficiarioForm = this.fb.group({
    id_familia: [null as number | null, Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(2), CustomValidators.soloLetras]],
    apellido: ['', [Validators.required, Validators.minLength(2), CustomValidators.soloLetras]],
    dni: ['', [Validators.required, CustomValidators.dniValido]],
    fecha_nacimiento: ['', Validators.required],
    rama_actual: ['Manada', Validators.required],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['beneficiarioInicial'] && this.beneficiarioInicial) {
      this.beneficiarioForm.patchValue(this.beneficiarioInicial);
    }
  }

  campoEsInvalido(campo: string): boolean {
    const control = this.beneficiarioForm.get(campo);
    return !!(control && control.invalid && (control.touched || this.formEnviado()));
  }

  actualizarFamilia(id: number | null) {
    this.beneficiarioForm.patchValue({ id_familia: id });
  }

  actualizarRama(nuevaRama: string) {
    this.beneficiarioForm.patchValue({ rama_actual: nuevaRama });
  }

  guardar() {
    if (this.beneficiarioForm.invalid) {
      this.beneficiarioForm.markAllAsTouched();
      return;
    }
    this.onSubmit.emit(this.beneficiarioForm.getRawValue() as Beneficiario);
  }
}
