import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styles: [`
    .sidebar {
        width: 280px;
    }
  `]
})
export class SidebarComponent {
    openBottomMenu = false;
}
