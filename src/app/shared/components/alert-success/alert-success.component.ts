import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-success.component.html',
})
export class AlertSuccessComponent {
  @Input() mensaje: string | null = null;
  @Output() cerrar = new EventEmitter<void>();
}
