import { Component } from '@angular/core';
import { ConfigManComponent } from './config-man.component';
import { SelectChannelInputComponent } from '../inputs/select-channel-input';
import { FormsModule } from '@angular/forms';
import { Channel } from '../service/models';

@Component({
  selector: 'app-threadopener-config',
  templateUrl: './threadopener.component.html',
  standalone: true,
  imports: [SelectChannelInputComponent, FormsModule]
})
export class ThreadOpenerConfigComponent extends ConfigManComponent {

  filteredChannelList: Channel[] = [];

  addNewThreadFollow() {
    if (this.config!.threadArchiverWatcher == undefined) {
      this.config!.threadArchiverWatcher = { channels: [''] };
    } else {
      this.config!.threadArchiverWatcher.channels.push('');
    }
  }

  removeThreadFollow(index: number) {
    this.config.threadArchiverWatcher?.channels?.splice(index, 1);
  }

  postLoadConfig(): void {
    this.filteredChannelList = this.channels.filter(c => c.type == "15");
  }

}
