import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { AlertService } from '../alerts';
import { AppService } from '../service/app-services.service';
import { GroupBy } from './config-editor.component';

const CONFIG_ID = "threadFollower";

@Component({
  selector: 'app-config-follow-editor',
  templateUrl: './config-follow-editor.component.html'
})
export class ConfigFollowEditorComponent implements OnInit, OnChanges {

  @Input("id") serverId?: any;

  @ViewChild("form", { static: true })
  form!: NgForm;

  configs: any = [];

  channels$: BehaviorSubject<any> = new BehaviorSubject([]);
  roles$: BehaviorSubject<any> = new BehaviorSubject([]);

  constructor(private service: AppService, private toast: AlertService) { }

  ngOnInit(): void {
    this.service.listChannels(this.serverId).subscribe(l => {
      this.channels$.next(GroupBy(l, "parent"))
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // retrieve options
    this.toast.clear();
    this.loadConfig();
  }

  addNew() {
    this.configs.push({ channel: "" })
  }

  private loadConfig() {
    this.service.loadConfig(this.serverId, CONFIG_ID).subscribe(resp => {
      this.configs = resp.map((e: any) => { 
        return {id: e._id, channel: e.channel}
      });
    });
  }

  callRemove(id: string, index: number) {
    this.service.deleteConfig(this.serverId, CONFIG_ID, id).subscribe((s: any) => {
      if (s.status) {
        this.configs.splice(index, 1);
        this.toast.success("Saved")
      } else {
        this.toast.error(s.error);
      }
    });
  }


  delete(index: number, id: string) {
    if (!id) {
      this.configs.splice(index, 1);
    } else {
      this.callRemove(id, index);
    }
  }

  trySave() {

    if (this.form.invalid) {
      console.debug("Invalid");
      return;
    }

    console.debug(this.configs);
    
    let obs: Observable<any>[] = this.configs.map((c: any) => this.service.saveConfig(this.serverId, CONFIG_ID, [c]))

    forkJoin(obs)
    .subscribe(() => {
      this.loadConfig();
    })

  }
  
}