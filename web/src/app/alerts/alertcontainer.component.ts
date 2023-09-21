import { Component, OnInit, Input } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { AlertService, Alert, AlertConfig } from './alert.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'alerts',
  template: `
    <ng-container *ngFor="let alert of alerts">
      <alert-item [alert]="alert" (close)="onClose($event)" @slideAnimation></alert-item>
    </ng-container>
  `,
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({opacity: 0}),
        animate('300ms', style({opacity: 1}))
      ]),
      transition(':leave', [
        animate('300ms', style({opacity: 0}))
      ])
    ])
  ]
})
export class AlertContainerComponent implements OnInit {

  @Input() config: Partial<AlertConfig> = {};

  defaultConfig: AlertConfig = { dismissible: true, timeout: 0, dismissOnNavigate: true};
  alerts: Alert[] = [];

  constructor(private alertService: AlertService, private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.alerts.filter(a => a.config!.dismissOnNavigate).forEach(alert => {
          this.onClose(alert);
        })
      }
    });
    this.alertService.onAlert.subscribe(alert => this.appendAlert(alert));
    this.alertService.onClear.subscribe(() => this.alerts = []);
  }

  onClose(alert: Alert) {
    alert.onClose!.next();
    let ix = this.alerts.indexOf(alert);
    if (ix > -1) {
      this.alerts.splice(ix, 1);
    }
  }

  appendAlert(alert: Alert) {
    alert.config = { ...this.defaultConfig, ...this.config, ...alert.config };
    this.alerts.push(alert);
  }

}

