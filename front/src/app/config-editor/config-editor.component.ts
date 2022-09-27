import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AlertService } from '../alerts';
import { ConfigOption } from '../config-man/configs';
import { AppService } from '../service/app-services.service';

@Component({
  selector: 'app-config-editor',
  templateUrl: './config-editor.component.html'
})
export class ConfigEditorComponent implements OnInit, OnChanges {

  @Input("id") serverId?: any;

  @Input("config") config?: any;

  @ViewChild("form", { static: true })
  form!: NgForm;
  
  editables: any[] = [];

  channels$: BehaviorSubject<any> = new BehaviorSubject([]);
  roles$: BehaviorSubject<any> = new BehaviorSubject([]);

  constructor(private service: AppService, private toast: AlertService) { }

  ngOnInit(): void {
    this.service.listChannels(this.serverId).subscribe(l => {
      this.channels$.next(GroupBy(l, "parent"))
    });
    this.service.listRoles(this.serverId).subscribe(l => this.roles$.next(l));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // retrieve options
    this.toast.clear();
    this.loadConfig();
  }

  private loadConfig() {
    this.service.loadConfig(this.serverId, this.config.id).subscribe(resp => {
      this.editables = [];
      if (resp.length > 0) {
        resp.forEach(this.processItem, this)
      } else {
        this.processItem({});
      }
    });
  }

  private processItem(c: any) {
    let item: any = {valueid: c['_id']};
    let values: any[] = []
    for (let op of this.config.options) {
      let nop = Object.assign({}, op);
      if (c && c[op.name]) {
          if (this.isChoice(op.type) && !op.list) {
            nop['value'] = [c[op.name]];
          } else {
            nop['value'] = c[op.name];
          }
      } else {
        nop['value'] = null;
      }
      if (op.type == 4) {
        nop['options'] = this.channels$;
      } else if (op.type == 5) {
        nop['options'] = this.roles$;
      }
      values.push(nop);
    }
    item['values'] = values;
    console.log(item);
    this.editables.push(item);
  }
/*
  private invokeCached(prefix: string, obs: Observable<any>) {
    const key = prefix + '-' + this.serverId;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      return of(JSON.parse(stored))
    }
    return obs.pipe(tap(r => {
      if (r && r.length > 0) sessionStorage.setItem(key, JSON.stringify(r));
    }));
  }

  private listChannels(): Observable<any> {
    return this.invokeCached('CHANNELS', this.service.listChannels(this.serverId));
  } 

  private listRoles(): Observable<any> {
    return this.invokeCached('ROLES', this.service.listRoles(this.serverId));
  } 
*/
  addNew() {
    this.processItem({});
  }

  delete(index: number, id: string) {
    if (!id) {
      this.editables.splice(index, 1);
      if (this.editables.length == 0) this.addNew();
    } else {
      this.callRemove(id);
    }
  }

  private isChoice(type: number) {
    return type == 4 || type == 5;
  }


  optionComparator(item1: any, item2: any) {
    return item1 == item2;
  }

  callRemove(id: string) {
    this.service.deleteConfig(this.serverId, this.config.id, id).subscribe((s: any) => {
      if (s.status) {
        this.loadConfig();
        this.toast.success("Saved")
      } else {
        this.toast.error(s.error);
      }
    });
  }

  trySave() {

    if (this.form.invalid) {
      console.debug("Invalid");
      return;
    }

    const toSave = this.editables.map(element => {
      let ob: any = {'id': element.valueid};
      element.values.forEach((el: ConfigOption) => {
        if (this.isChoice(el.type) && !el.list) {
          ob[el.name] = el.value[0];
        } else {
          ob[el.name] = el.value;
        }
      })
      return ob;
    });

    console.debug(toSave);
    this.service.saveConfig(this.serverId, this.config.id, toSave).subscribe((s:any) => {
      if (s.status) {
        this.loadConfig();
        this.toast.success("Saved")
      } else {
        this.toast.error(s.error);
      }
    });

  }

}

export function GroupBy<T, K extends keyof T>(array: T[], key: K) {
	let map = new Map<T[K], T[]>();
	array.forEach(item => {
		let itemKey = item[key];
		if (!map.has(itemKey)) {
			map.set(itemKey, array.filter(i => i[key] === item[key]));
		}
	});
	return map;
}