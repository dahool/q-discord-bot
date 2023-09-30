import { Component } from '@angular/core';
import { LocalService } from '../service/local.service';

@Component({
  selector: 'app-menu',
  styles: [`
    button:hover {
      transform: scale(1.05);
    }
  `],
  templateUrl: './menu-selection.component.html'
})
export class MenuComponent {

  constructor(private local: LocalService) {}

}
