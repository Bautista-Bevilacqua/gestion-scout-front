import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static emailValido(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email);
    return isValid ? null : { emailInvalido: true };
  }

  // 👇 NUEVO VALIDADOR ESTRICTO DE PASSWORD
  static passwordFuerte(control: AbstractControl): ValidationErrors | null {
    const pass = control.value;
    if (!pass) return null;

    // Regla:
    // (?=.*[a-z]) -> Al menos una minúscula
    // (?=.*[A-Z]) -> Al menos una mayúscula
    // (?=.*\d)    -> Al menos un número
    // (?=.*[@$!%*?&]) -> Al menos un carácter especial
    // [A-Za-z\d@$!%*?&]{8,} -> Mínimo 8 caracteres en total
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const isValid = regex.test(pass);
    return isValid ? null : { passwordDebil: true };
  }

  // 👇 VALIDADOR CRUZADO PARA "REPETIR CONTRASEÑA"
  static passwordsIguales(passwordControlName: string, confirmControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const pass = formGroup.get(passwordControlName)?.value;
      const confirm = formGroup.get(confirmControlName)?.value;

      if (!pass || !confirm) return null; // Si están vacíos, no validamos esto aún

      if (pass !== confirm) {
        // Le inyectamos el error al campo de confirmación para poder pintarlo de rojo
        formGroup.get(confirmControlName)?.setErrors({ passwordsNoCoinciden: true });
        return { passwordsNoCoinciden: true };
      } else {
        // Si coinciden, limpiamos el error manual
        const currentErrors = formGroup.get(confirmControlName)?.errors;
        if (currentErrors) {
          delete currentErrors['passwordsNoCoinciden'];
          if (Object.keys(currentErrors).length === 0) {
            formGroup.get(confirmControlName)?.setErrors(null);
          }
        }
        return null;
      }
    };
  }

  static soloLetras(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const isValid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(control.value);
    return isValid ? null : { numerosNoPermitidos: true };
  }

  static dniValido(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const isValid = /^\d{7,8}$/.test(value);
    return isValid ? null : { dniInvalido: true };
  }

  static telefonoValido(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Regex: Permite un "+" al principio (opcional), y luego entre 8 y 15 caracteres
    // que pueden ser números, espacios o guiones medios.
    const isValid = /^[\+]?[0-9\s\-]{8,15}$/.test(value);
    return isValid ? null : { telefonoInvalido: true };
  }

  static formatoNombrePropio(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    // Regex: Empieza con Mayúscula, sigue con minúsculas.
    // Puede repetirse si hay un espacio en el medio.
    const isValid = /^([A-ZÁÉÍÓÚÑ][a-záéíóúñü]+)(\s[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+)*$/.test(control.value);

    return isValid ? null : { formatoNombreInvalido: true };
  }
}
