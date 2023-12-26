import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { LuxonModule } from 'luxon-angular';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AlertModule } from './alerts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigManComponent } from './config-man/config-man.component';
import { ThreadFollowConfigComponent } from './config-man/threadfollow.component';
import { ThreadPingConfigComponent } from './config-man/threadping.component';
import { TranslatorConfigComponent } from './config-man/translator.component';
import { WelcomeConfigComponent } from './config-man/wlecome.component';
import { AgendaNewDialogComponent } from './event-agenda/agenda-new-dialog.component';
import { AgendaListComponent } from './event-agenda/agenda.component';
import { SelectChannelInputComponent } from './inputs/select-channel-input';
import { SelectRoleInputComponent } from './inputs/select-role-input';
import { ToggleSwitchInputComponent } from './inputs/toggle-switch-input';
import { ErrorInterceptor } from './interceptor/error.interceptor';
import { MenuComponent } from './server-selection/menu-selection.component';
import { ServerMenuComponent } from './server-selection/server-menu.component';
import { ServerSelectionComponent } from './server-selection/server-selection.component';
import { UserProfileComponent } from './user-profile/user-profile.component';


@NgModule({
  declarations: [
    AppComponent,
    ServerSelectionComponent,
    ConfigManComponent,
    UserProfileComponent,
    MenuComponent,
    AgendaListComponent,
    WelcomeConfigComponent,
    ThreadFollowConfigComponent,
    ThreadPingConfigComponent,
    TranslatorConfigComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    AlertModule,
    NgxSpinnerModule,
    LuxonModule,
    SelectChannelInputComponent,
    ToggleSwitchInputComponent,
    NgSelectModule,
    NgbModule,
    AgendaNewDialogComponent,
    ServerMenuComponent,
    SelectRoleInputComponent
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
