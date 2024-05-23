import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { NgxSpinnerService } from 'ngx-spinner';
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

  constructor(
    private service: AppService,
    protected spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.service.getPlayerInfoVersions().subscribe(v => this.versions = v.values.sort().reverse());
    this.service.getPlayerInfoTags().subscribe(v => this.tags = v.values.sort());
  }

  search() {
    this.service.getPlayerList(this.query).subscribe(l => this.resultList = l);
  }

  exportList() {
    this.spinner.show();
    const header = ['name', 'level', 'tag', 'power', 'pd', 'rss', 'version'];
    let csv = this.resultList.map(o => `${o.name},${o.level},${o.tag},${o.power},${o.pd},${o.rss},${o.version}`);
    let csvArray = [header].concat(csv).join('\r\n');
    var blob = new Blob([csvArray], {type: 'text/csv' })
    saveAs(blob, "playerlist.csv");
    this.spinner.hide();
  }

}