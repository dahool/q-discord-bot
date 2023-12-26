import { Component } from '@angular/core';
import { ConfigManComponent } from './config-man.component';

@Component({
  selector: 'app-translator-config',
  templateUrl: './translator.component.html',
})
export class TranslatorConfigComponent extends ConfigManComponent {

  addNewChannel() {
    const EMPTY_CHANNEL = {
      channel: '',
      language: ''
    }
    if (this.config!.translateChannels == undefined) {
      this.config!.translateChannels = [EMPTY_CHANNEL];
    } else {
      this.config!.translateChannels.push(EMPTY_CHANNEL)
    }
  }

  removeChannel(index: number) {
    this.config.translateChannels?.splice(index, 1);
  }
  
}