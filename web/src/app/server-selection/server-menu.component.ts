import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgbDropdownModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { CachedAppService } from '../service/cached-service';
import { LocalService } from '../service/local.service';
import { Guild, UserServer } from '../service/models';

@Component({
  selector: 'server-menu',
  templateUrl: './server-menu.component.html',
  styleUrls: ['./server-menu.component.scss'],
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, NgbDropdownModule, AsyncPipe]
})
export class ServerMenuComponent implements OnInit {

  private canvasService = inject(NgbOffcanvas);

  server$?: Subject<Guild>;
  serverList$?: Subject<UserServer[]> = new Subject();

  dropdownShow = false;

  constructor(
    private local: LocalService,
    private service: CachedAppService,
    private router: Router) {}

  ngOnInit(): void {
    this.server$ = this.local.getServerSubject();
    this.server$.subscribe(() => {
      this.serverList$ = this.service.listServers();
    })
  }

  open(content: TemplateRef<any>) {
		this.canvasService.open(content);
	}

  selectServer(server: Guild) {
    this.local.setServer(server);
    this.dropdownShow = false;
  }

  closeCanvas() {
    this.canvasService.dismiss();
  }

  navigateTo(link: string) {
    this.canvasService.dismiss();
    this.router.navigate([link]);
  }

}
