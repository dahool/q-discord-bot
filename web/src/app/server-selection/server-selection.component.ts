import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../service/app-services.service';
import { LocalService } from '../service/local.service';
import { Guild, UserServer } from '../service/models';

@Component({
  selector: 'app-server-selection',
  templateUrl: './server-selection.component.html'
})
export class ServerSelectionComponent implements OnInit {

  servers: UserServer[] = [];

  constructor(
    private service: AppService,
    private router: Router,
    private local: LocalService) { }

  ngOnInit(): void {
    this.local.setServer(null);
    this.service.listServers().subscribe(l => {
      if (l && Array.isArray(l)) {
        this.servers = l
      } else {
        this.servers = [];
      }
    });
  }

  navigateTo(server: Guild) {
    this.local.setServer(server);
    this.router.navigate(['/server']);
  }

}
