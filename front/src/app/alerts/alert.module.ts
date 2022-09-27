import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AlertComponent } from './alert.component';
import { AlertContainerComponent } from './alertcontainer.component';

@NgModule({
  imports: [CommonModule],
  declarations: [
    AlertComponent,
    AlertContainerComponent
  ],
  exports: [
    AlertContainerComponent
  ]
})
export class AlertModule {}