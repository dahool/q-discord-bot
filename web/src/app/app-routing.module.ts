import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigManComponent } from './config-man/config-man.component';
import { ServerSelectionComponent } from './server-selection/server-selection.component';

const routes: Routes = [
  {
    path: '',
    component: ServerSelectionComponent
  },
  {
    path: 'config',
    component: ConfigManComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
