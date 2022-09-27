import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Alert } from './alert.service';

@Component({
  selector: 'alert-item',
  template: `
    <div *ngIf="alert" class="alert alert-{{alert.type}} show" role="alert" [ngClass]="{'alert-dismissible': alert.config?.dismissible}">
      {{alert.message}}
      <button *ngIf="alert.config?.dismissible" (click)="doClose()" type="button" class="close" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `
})
export class AlertComponent implements OnInit {

  @Input() alert!: Alert;
  @Output() close: EventEmitter<Alert> = new EventEmitter();
  timerId: any = null;

  constructor() {}

  ngOnInit() {
    if (this.alert.config?.timeout! > 0) {
      this.timerId = setTimeout(() => this.doClose(), this.alert.config?.timeout);
    }
  }

  doClose() {
    if (this.timerId != null) {
      clearTimeout(this.timerId);
    }
    this.close.emit(this.alert);
  }

}