import { Component } from '@angular/core';
import { ConfigManComponent } from './config-man.component';

@Component({
  selector: 'app-welcome-config',
  templateUrl: './welcome.component.html',
})
export class WelcomeConfigComponent extends ConfigManComponent {

  postLoadConfig() {
    if (this.config.welcomeBye.join === undefined) {
      this.config.welcomeBye.join = {
        active: false,
        roles: []
      }
    }
    if (this.config.welcomeBye.leaves === undefined) {
      this.config.welcomeBye.leaves = {
        active: false
      }
    }
  }

}