import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalService } from '../service/local.service';
import { Guild } from '../service/models';

@Component({
  selector: 'server-menu',
  templateUrl: './server-menu.component.html',
  styleUrls: ['./server-menu.component.scss'],
  standalone: true,
  imports: [RouterLink, NgIf]
})
export class ServerMenuComponent implements OnInit {

  server?: Guild;

  constructor(private local: LocalService) {}
  
  ngOnInit(): void {
    this.server = this.local.getServer();
  }

}
