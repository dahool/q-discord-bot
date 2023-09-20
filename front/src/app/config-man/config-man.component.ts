import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AlertService } from '../alerts';
import { AppService } from '../service/app-services.service';
import { Server } from '../service/models';
import { GroupBy } from '../utils';

@Component({
  selector: 'app-config-man',
  templateUrl: './config-man.component.html',
})
export class ConfigManComponent implements OnInit {

  guildId?: string | null;
  server?: Server;
  config?: any;

  @ViewChild("form", { static: true })
  form!: NgForm;

  channels$: BehaviorSubject<any> = new BehaviorSubject([]);
  roles$: BehaviorSubject<any> = new BehaviorSubject([]);

  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private service: AppService,
      private toast: AlertService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.guildId = params.get('id');
      if (!this.guildId) {
        this.router.navigateByUrl('/');
      } else {
        this.service.getServer(this.guildId).subscribe(s => this.server = s);
        this.service.listChannels(this.guildId).subscribe(l => {
          this.channels$.next(GroupBy(l, "parent"))
        });
        this.service.listRoles(this.guildId).subscribe(l => this.roles$.next(l));
        this.service.getConfig(this.guildId).subscribe(c => this.config = c);
      }
    })
  }

  addNewThreadAnnouncer() {
    if (this.config.newThreadAnnouncer == undefined) {
      this.config.newThreadAnnouncer = [{}];
    } else {
      this.config.newThreadAnnouncer.push({})
    }
  }

  printChange(e: any) {
    console.log(e);
  }

  trySave() {

      if (this.form.invalid) {
        console.debug("Invalid");
        return;
      }

      console.debug(this.config);

      this.service.saveConfig(this.guildId!, this.config).subscribe((s:any) => {
        if (s.status) {
          this.toast.success("Saved")
        } else {
          this.toast.error(s.error);
        }
      });

  }


}
