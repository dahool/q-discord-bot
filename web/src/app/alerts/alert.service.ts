import { Injectable, EventEmitter, Output, Directive } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable, Subject } from 'rxjs';

export class Alert {
  type!: string;
  message!: string;
  config?: Partial<AlertConfig>;
  onClose?: Subject<any>;
}

export class AlertConfig {
  dismissible!: boolean;
  timeout!: number;
  dismissOnNavigate!: boolean;
}

@Directive()
@Injectable({
  providedIn: 'root'
})
export class AlertService {

  @Output() onAlert = new EventEmitter<Alert>();
  @Output() onClear = new EventEmitter();

  alert(alert: Alert): Alert {
    alert.onClose = new Subject<any>();
    this.onAlert.emit(alert);
    return alert;
  }

  success(message: string, config?: Partial<AlertConfig>): Alert {
    return this.alert({message, type: 'success', config: config});
  }

  error(message: string, config?: Partial<AlertConfig>): Alert {
    return this.alert({message, type: 'danger', config: config});
  }
  
  info(message: string, config?: Partial<AlertConfig>): Alert {
    return this.alert({message, type: 'info', config: config});
  }
  
  warn(message: string, config?: Partial<AlertConfig>): Alert {
    return this.alert({message, type: 'warning', config: config});
  }

  clear() {
    this.onClear.emit();
  }

}