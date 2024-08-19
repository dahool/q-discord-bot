import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AlertService } from '../alerts';
import { APP_SERVICE, IAppService } from '../service';
import { LocalService } from '../service/local.service';
import { Channel, Config, EMPTY_CONFIG, Guild, Role } from '../service/models';

@Component({
  selector: 'app-config-man',
  templateUrl: './config-man.component.html',
})
export class ConfigManComponent implements OnInit {

  public service: IAppService = inject(APP_SERVICE);
  public local: LocalService = inject(LocalService);
  public toast: AlertService = inject(AlertService);

  server?: Guild;
  config!: Config;

  isReady = false;

  @ViewChild("form", { static: true })
  form!: NgForm;

  channels: Channel[] = [];
  roles: Role[] = [];

  constructor() {}

  ngOnInit(): void {
    this.config = EMPTY_CONFIG;
    this.local.getServerSubject().subscribe(server => {
      this.server = server;
      this.loadServerConfig();
    })
  }

  loadServerConfig() {
    if (this.server) {
      this.isReady = false;
      forkJoin({
        channels: this.service.listChannels(this.server.id),
        roles: this.service.listRoles(this.server.id),
        config: this.service.getConfig(this.server.id)
      }).subscribe(result => {
        this.channels = result.channels;
        this.roles = result.roles;
        this.config = Object.assign(EMPTY_CONFIG, result.config) as Config;
        this.postLoadConfig();
        this.isReady = true;
      }, error => {
        console.error(error);
        this.toast.error("Ups, something went wrong. Try reloading");
      });
    }
  }

  postLoadConfig() {
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

      // TODO validations

      this.service.saveConfig(this.server!.id, this.config!).subscribe((s:any) => {
        if (s.status) {
          this.service.getConfig(this.server!.id).subscribe(c => this.config = Object.assign(EMPTY_CONFIG, c) as Config);
          this.toast.success("Saved")
        } else {
          this.toast.error(s.error);
        }
      });

  }


}
