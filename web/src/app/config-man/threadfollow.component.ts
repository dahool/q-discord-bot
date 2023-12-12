import { Component } from '@angular/core';
import { ConfigManComponent } from './config-man.component';

@Component({
  selector: 'app-threadfollow-config',
  templateUrl: './threadfollow.component.html',
})
export class ThreadFollowConfigComponent extends ConfigManComponent {

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
  
}