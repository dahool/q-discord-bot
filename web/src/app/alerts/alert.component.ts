import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Alert } from './alert.service';

@Component({
  selector: 'alert-item',
  templateUrl: 'alert.component.html'
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