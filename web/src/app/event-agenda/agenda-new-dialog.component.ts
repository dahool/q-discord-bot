
import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from '../alerts';
import { AppService } from '../service/app-services.service';
import { Role, Schedule, Territory } from '../service/models';

import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateTime } from 'luxon';
import { LuxonModule } from 'luxon-angular';
import { Observable } from 'rxjs';

export interface AgendaDialog {
    open(editable?: Schedule): void;
}

const WEEK_FORMAT = {...DateTime.TIME_SIMPLE, weekday: 'long' };

interface Event {
  zone: string,
  title: string,
  next: string,
  recurrent: boolean,
  ping: string[]
}

@Component({
  selector: 'dialog-agenda-new',
  templateUrl: './agenda-new-dialog.component.html',
  styleUrls: ['./agenda-new-dialog.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgSelectModule, LuxonModule],
})
export class AgendaNewDialogComponent implements AgendaDialog, OnInit {

  @Input() guildId!: string;
  @Output('save') onSave = new EventEmitter<void>();

  @ViewChild("content", { static: true })
  dialogContent!: TemplateRef<any>;

  roles: Role[] = [];
  zones: Territory[] = [];

  dtFormat = DateTime.DATETIME_MED;

  // @ts-ignore
  event: Event;
  editable?: Schedule;
  
  constructor(
      private router: Router,
      private service: AppService,
      private toast: AlertService,
      private modalService: NgbModal) {}

  ngOnInit(): void {
    this.service.listRoles(this.guildId).subscribe(l => this.roles = l);
    this.service.listZones().subscribe(l => this.zones = l);
  }

  open(editable?: Schedule): void {
    if (editable) {
      this.editable = editable;
      this.event = {
        zone: this.editable.location!,
        title: this.editable.summary!,
        next: this.editable.dtStart.toISO()!,
        recurrent: this.editable.recurrent || false,
        ping: this.editable.pingRoles!
      }
    } else {
      this.editable = undefined;
      // @ts-ignore
      this.event = {recurrent: false};
    }
    this.modalService.open(this.dialogContent);
  }

  modelUpdate(zone: Territory) {
    this.event.next = zone?.next.toISO()!;
    console.log(this.event);
  }
  
  get weekday() {
    // @ts-ignore
    return DateTime.fromISO(this.event.next).toLocaleString(WEEK_FORMAT);
  }
 
  removeEvent() {
    this.service.deleteEvent(this.editable?.id!).subscribe(s => {
      if (s.status) {
        this.toast.success("Removed")
        this.onSave.emit();
        this.modalService.dismissAll();
      } else {
        this.toast.error(s.error);
      }      
    })
  }
  
  saveEvent(form: NgForm) {

    if (form.invalid) {
      console.debug("Invalid");
      return;
    }

    console.debug(this.event);

    let ob: Observable<any>;
    if (this.editable) {
      ob = this.service.updateEvent(this.editable.id, this.event);
    } else {
      ob = this.service.saveNewEvent(this.guildId!, this.event);
    }

    ob.subscribe((s:any) => {
      if (s.status) {
        this.toast.success("Saved")
        this.onSave.emit();
        this.modalService.dismissAll();
      } else {
        this.toast.error(s.error);
      }
    });

  }    
  
}