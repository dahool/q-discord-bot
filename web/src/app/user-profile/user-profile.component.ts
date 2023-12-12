import { Component, OnInit } from '@angular/core';
import { AppService } from '../service/app-services.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {

  user: any = null;
  openMenu = false;

  constructor(private service: AppService) { }

  ngOnInit(): void {
    this.service.getProfile().subscribe(u => {
      this.user = u;
    })
  }

}
