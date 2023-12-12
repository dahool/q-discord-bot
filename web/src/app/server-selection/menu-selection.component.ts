import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalService } from '../service/local.service';
import { Guild } from '../service/models';

@Component({
  selector: 'app-menu',
  templateUrl: './menu-selection.component.html'
})
export class MenuComponent implements OnInit {

  server$?: BehaviorSubject<Guild>;

  constructor(private local: LocalService) {}

  ngOnInit(): void {
    this.server$ = this.local.getServerSubject();
  }

}
