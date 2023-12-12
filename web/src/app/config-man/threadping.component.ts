import { Component } from '@angular/core';
import { ConfigManComponent } from './config-man.component';

@Component({
  selector: 'app-threadping-config',
  templateUrl: './threadping.component.html',
})
export class ThreadPingConfigComponent extends ConfigManComponent {

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
  
}