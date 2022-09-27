import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppService } from '../service/app-services.service';
import { Server } from '../service/models';
import { ConfigOption, CONFIGS } from './configs';

@Component({
  selector: 'app-config-man',
  templateUrl: './config-man.component.html'
})
export class ConfigManComponent implements OnInit {

  configTypes;

  currentId: any;

  server: Server = {};

  currentType: any = null;

  constructor(private router: Router, private route: ActivatedRoute, private service: AppService) {
    this.configTypes = CONFIGS;
   }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.currentId = params.get('id');
      this.service.getServer(this.currentId).subscribe(s => this.server = s);
      this.currentType = null;
      if (!this.currentId) {
        this.router.navigateByUrl('/');
      }
    })
  }

  select(cfg: any) {
    this.currentType = cfg;
    //console.log(cfg);
  }

}
