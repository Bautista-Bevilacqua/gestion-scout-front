import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Familia } from '../../../../models/familia.model';
import { CustomValidators } from '../../../../core/utils/custom-validators';

type TipoProgenitor = 'padre' | 'madre';

@Component({
  selector: 'app-familia-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './familia-form.component.html',
})
export class FamiliaFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() familiaInicial: Familia | null = null;
  @Input() esEdicion: boolean = false;

  @Output() onSubmit = new EventEmitter<Familia>();

  public formEnviado = signal<boolean>(false);

  public familiaForm = this.fb.group({
    apellido_familia: ['', [Validators.required, Validators.minLength(2)]],
    tiene_padre: [true],
    tiene_madre: [true],
    nombre_padre: ['', [Validators.required, Validators.minLength(3), CustomValidators.formatoNombrePropio]],
    telefono_padre: ['', [Validators.required, CustomValidators.telefonoValido]],
    email_padre: ['', [Validators.required, CustomValidators.emailValido]],
    nombre_madre: ['', [Validators.required, Validators.minLength(3), CustomValidators.formatoNombrePropio]],
    telefono_madre: ['', [Validators.required, CustomValidators.telefonoValido]],
    email_madre: ['', [Validators.required, CustomValidators.emailValido]],
    contacto_principal: ['PADRE' as 'PADRE' | 'MADRE'],
    direccion: ['', [Validators.required, Validators.minLength(3)]],
  });

  campoEsInvalido(campo: string): boolean {
    const control = this.familiaForm.get(campo);
    return !!(control && control.invalid && (control.touched || this.formEnviado()));
  }

  get ambosProgenitoresActivos(): boolean {
    return !!this.familiaForm.get('tiene_padre')?.value && !!this.familiaForm.get('tiene_madre')?.value;
  }

  ngOnInit(): void {
    this.familiaForm.get('tiene_padre')!.valueChanges.subscribe((activo) => {
      if (!activo && !this.familiaForm.get('tiene_madre')!.value) {
        this.familiaForm.get('tiene_padre')!.setValue(true, { emitEvent: false });
        return;
      }
      this.actualizarValidadoresProgenitor('padre', !!activo);
    });

    this.familiaForm.get('tiene_madre')!.valueChanges.subscribe((activo) => {
      if (!activo && !this.familiaForm.get('tiene_padre')!.value) {
        this.familiaForm.get('tiene_madre')!.setValue(true, { emitEvent: false });
        return;
      }
      this.actualizarValidadoresProgenitor('madre', !!activo);
    });

    this.actualizarValidadoresProgenitor('padre', true);
    this.actualizarValidadoresProgenitor('madre', true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['familiaInicial'] && this.familiaInicial) {
      this.familiaForm.patchValue(this.familiaInicial);
      this.actualizarValidadoresProgenitor('padre', this.familiaInicial.tiene_padre);
      this.actualizarValidadoresProgenitor('madre', this.familiaInicial.tiene_madre);
    }
  }

  private actualizarValidadoresProgenitor(tipo: TipoProgenitor, activo: boolean) {
    const nombreCtrl = this.familiaForm.get(`nombre_${tipo}`)!;
    const telefonoCtrl = this.familiaForm.get(`telefono_${tipo}`)!;
    const emailCtrl = this.familiaForm.get(`email_${tipo}`)!;

    if (activo) {
      nombreCtrl.enable({ emitEvent: false });
      telefonoCtrl.enable({ emitEvent: false });
      emailCtrl.enable({ emitEvent: false });
      nombreCtrl.setValidators([
        Validators.required,
        Validators.minLength(3),
        CustomValidators.formatoNombrePropio,
      ]);
      telefonoCtrl.setValidators([Validators.required, CustomValidators.telefonoValido]);
      emailCtrl.setValidators([Validators.required, CustomValidators.emailValido]);
    } else {
      nombreCtrl.reset('', { emitEvent: false });
      telefonoCtrl.reset('', { emitEvent: false });
      emailCtrl.reset('', { emitEvent: false });
      nombreCtrl.clearValidators();
      telefonoCtrl.clearValidators();
      emailCtrl.clearValidators();
      nombreCtrl.disable({ emitEvent: false });
      telefonoCtrl.disable({ emitEvent: false });
      emailCtrl.disable({ emitEvent: false });
    }

    nombreCtrl.updateValueAndValidity({ emitEvent: false });
    telefonoCtrl.updateValueAndValidity({ emitEvent: false });
    emailCtrl.updateValueAndValidity({ emitEvent: false });

    this.actualizarContactoPrincipal();
  }

  private actualizarContactoPrincipal() {
    const tienePadre = this.familiaForm.get('tiene_padre')!.value;
    const tieneMadre = this.familiaForm.get('tiene_madre')!.value;
    const contactoCtrl = this.familiaForm.get('contacto_principal')!;

    if (tienePadre && !tieneMadre) {
      contactoCtrl.setValue('PADRE', { emitEvent: false });
    } else if (!tienePadre && tieneMadre) {
      contactoCtrl.setValue('MADRE', { emitEvent: false });
    } else if (!contactoCtrl.value) {
      contactoCtrl.setValue('PADRE', { emitEvent: false });
    }
  }

  guardar() {
    if (this.familiaForm.invalid) {
      this.familiaForm.markAllAsTouched();
      return;
    }
    this.onSubmit.emit(this.familiaForm.getRawValue() as Familia);
  }
}
