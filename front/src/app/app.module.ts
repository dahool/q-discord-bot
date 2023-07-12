import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AlertModule } from './alerts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigEditorComponent } from './config-editor/config-editor.component';
import { ConfigFollowEditorComponent } from './config-editor/config-follow-editor.component';
import { ConfigManComponent } from './config-man/config-man.component';
import { ErrorInterceptor } from './interceptor/error.interceptor';
import { ServerSelectionComponent } from './server-selection/server-selection.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

@NgModule({
  declarations: [
    AppComponent,
    ServerSelectionComponent,
    ConfigManComponent,
    ConfigEditorComponent,
    ConfigFollowEditorComponent,
    UserProfileComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    AlertModule,
    NgxSpinnerModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
