import { Component, OnInit } from '@angular/core';
import { AppService } from '../service/app-services.service';
import { UserServer } from '../service/models';

@Component({
  selector: 'app-server-selection',
  templateUrl: './server-selection.component.html'
})
export class ServerSelectionComponent implements OnInit {

  servers: UserServer[] = [];

  constructor(private service: AppService) { }

  ngOnInit(): void {
    this.service.listServers().subscribe(l => this.servers = l);
  }

}
