import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CachedAppService } from '../service/cached-service';
import { LocalService } from '../service/local.service';
import { Guild, UserServer } from '../service/models';

@Component({
  selector: 'app-server-selection',
  templateUrl: './server-selection.component.html'
})
export class ServerSelectionComponent implements OnInit {

  serverList$: Subject<UserServer[]> = new Subject();

  constructor(
    private service: CachedAppService,
    private router: Router,
    private local: LocalService) { }

  ngOnInit(): void {
    this.local.setServer(null);
    this.serverList$ = this.service.listServers();
  }

  navigateTo(server: Guild) {
    this.local.setServer(server);
    this.router.navigate(['/server']);
  }

}
