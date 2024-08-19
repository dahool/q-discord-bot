import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DateTime } from 'luxon';
import { Subject } from 'rxjs';
import { AlertService } from '../alerts';
import { AppService } from '../service/app-services.service';
import { LocalService } from '../service/local.service';
import { Guild, Schedule } from '../service/models';
import { GroupBy } from '../utils';
import { AgendaDialog } from './agenda-new-dialog.component';
import { APP_SERVICE, IAppService } from '../service';

@Component({
  selector: 'app-agenda-list',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaListComponent implements OnInit {

  server$?: Subject<Guild>;
  server?: Guild;

  schedule?: Map<any, Schedule[]>;

  @ViewChild("dialog")
  dialog?: AgendaDialog;

  timeFormat = DateTime.TIME_24_SIMPLE;

  constructor(
      private router: Router,
      @Inject(APP_SERVICE)
      private service: IAppService,
      private local: LocalService,
      private toast: AlertService) {}

  ngOnInit(): void {
    this.server$ = this.local.getServerSubject();
    this.server$.subscribe(s => {
      if (s) {
        this.server = s;
        this.service.getEvents(s.id).subscribe(ev => {
          this.schedule = this._groupEvents(ev);
        })
      }
    })

  }

  _groupEvents(agenda: Schedule[]) {
    return GroupBy(agenda,
      (item: Schedule) => item.dtStart.startOf('day'),
      (a: DateTime, b: DateTime) => a.equals(b));
  }

  loadEvents() {
    this.service.getEvents(this.server!.id).subscribe(agenda => {
      this.schedule = this._groupEvents(agenda);
    })
  }

  isCurrent(dt: DateTime) {
    return DateTime.local().startOf('day').equals(dt.startOf('day'));
  }

  createNew(): void {
    this.dialog?.open();
  }

  edit(item: Schedule) {
    this.dialog?.open(item);
  }

  isEditable(item: Schedule): boolean {
    return !item.src;
  }

}
