import { Component, Inject, OnInit } from '@angular/core';
import { AppService } from '../service/app-services.service';
import { APP_SERVICE, IAppService } from '../service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {

  user: any = null;
  openMenu = false;

  constructor(@Inject(APP_SERVICE) private service: IAppService) { }

  ngOnInit(): void {
    this.service.getProfile().subscribe(u => {
      this.user = u;
    })
  }

}
