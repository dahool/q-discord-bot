import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AlertService } from '../alerts';
import { AppService } from '../service/app-services.service';
import { Channel, Config, EMPTY_CONFIG, Role, Server } from '../service/models';

@Component({
  selector: 'app-config-man',
  templateUrl: './config-man.component.html',
})
export class ConfigManComponent implements OnInit {

  guildId?: string | null;
  server?: Server;
  config!: Config;
  
  isReady = false;

  @ViewChild("form", { static: true })
  form!: NgForm;

  //channels: Map<string | undefined, Channel[]> = new Map();
  channels: Channel[] = [];
  roles: Role[] = [];

  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private service: AppService,
      private toast: AlertService) {}

  ngOnInit(): void {
    this.config = EMPTY_CONFIG;
    this.route.paramMap.subscribe(params => {
      this.guildId = params.get('id');
      if (!this.guildId) {
        this.router.navigateByUrl('/');
      } else {
        forkJoin({
          server: this.service.getServer(this.guildId),
          channels: this.service.listChannels(this.guildId),
          roles: this.service.listRoles(this.guildId),
          config: this.service.getConfig(this.guildId)  
        }).subscribe(result => {
          this.server = result.server;
          //this.channels = GroupBy(result.channels, "parent");
          this.channels = result.channels;
          this.roles = result.roles;
          this.config = Object.assign(EMPTY_CONFIG, result.config) as Config;
          this.isReady = true;
        }, error => {
          console.error(error);
          this.toast.error("Ups, something went wrong. Try reloading");
        });
      }
    })
  }

  addNewThreadFollow() {
    const EMPTY_FOLLOW = {
      channel: '',
      silent: false
    }
    if (this.config!.autoFollowThreadChannels == undefined) {
      this.config!.autoFollowThreadChannels = [EMPTY_FOLLOW];
    } else {
      this.config!.autoFollowThreadChannels.push(EMPTY_FOLLOW)
    }
  }

  removeThreadFollow(index: number) {
    this.config.autoFollowThreadChannels?.splice(index, 1);
  }

  addNewThreadAnnouncer() {
    const EMPTY_ANNOUNCER = {
      channels: [],
      announceChannel: '',
      message: ''   
    }
    if (this.config!.newThreadAnnouncer == undefined) {
      this.config!.newThreadAnnouncer = [EMPTY_ANNOUNCER];
    } else {
      this.config!.newThreadAnnouncer.push(EMPTY_ANNOUNCER)
    }
  }

  removeThreadAnnouncer(index: number) {
    this.config.newThreadAnnouncer?.splice(index, 1);
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

      this.service.saveConfig(this.guildId!, this.config!).subscribe((s:any) => {
        if (s.status) {
          this.toast.success("Saved")
        } else {
          this.toast.error(s.error);
        }
      });

  }


}