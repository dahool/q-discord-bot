import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppService } from '../service/app-services.service';

interface Query {
  version?: string,
  tag?: string,
  name?: string
}

@Component({
  selector: 'app-playerlist-list',
  templateUrl: './playerlist.component.html',
  styleUrls: ['./playerlist.component.scss'],
  standalone: true,
  imports: [ScrollingModule, FormsModule]
})
export class PlayerListComponent implements OnInit {

  versions: string[] = [];
  tags: string[] = [];
  query: Query = {};

  resultList: any[] = [];

  constructor(private service: AppService) {}

  ngOnInit(): void {
    this.service.getPlayerInfoVersions().subscribe(v => this.versions = v.values.sort().reverse());
    this.service.getPlayerInfoTags().subscribe(v => this.tags = v.values.sort());
  }

  search() {
    this.service.getPlayerList(this.query).subscribe(l => this.resultList = l);
  }

}