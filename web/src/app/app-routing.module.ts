import { Injectable, NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterModule, RouterStateSnapshot, Routes, UrlTree } from '@angular/router';
import { ConfigManComponent } from './config-man/config-man.component';
import { ThreadFollowConfigComponent } from './config-man/threadfollow.component';
import { ThreadPingConfigComponent } from './config-man/threadping.component';
import { TranslatorConfigComponent } from './config-man/translator.component';
import { WelcomeConfigComponent } from './config-man/wlecome.component';
import { AgendaListComponent } from './event-agenda/agenda.component';
import { PlayerListComponent } from './player-list/playerlist.component';
import { MenuComponent } from './server-selection/menu-selection.component';
import { ServerSelectionComponent } from './server-selection/server-selection.component';
import { LocalService } from './service/local.service';

@Injectable({
  providedIn: 'root'
})
class ServerGuard {

  constructor(private router: Router, private local: LocalService) {}

  canActivate(): boolean | UrlTree {
    if (this.local.getServer() == undefined) {
      console.log("return /");
      return this.router.createUrlTree(['/']);
    }
    console.log("return OK");
    return true;
  }

}

const storeGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  return inject(ServerGuard).canActivate();
}

const routes: Routes = [
  {
    path: '',
    component: ServerSelectionComponent
  },
  {
    path: 'server',
    canActivate: [storeGuard],
    component: MenuComponent,
  },  
  {
    path: 'config/guild',
    canActivate: [storeGuard],
    component: ConfigManComponent
  },
  {
    path: 'config/welcome',
    canActivate: [storeGuard],
    component: WelcomeConfigComponent
  },  
  {
    path: 'config/follow',
    canActivate: [storeGuard],
    component: ThreadFollowConfigComponent
  },
  {
    path: 'config/tp',
    canActivate: [storeGuard],
    component: ThreadPingConfigComponent
  },  
  {
    path: 'config/translate',
    canActivate: [storeGuard],
    component: TranslatorConfigComponent
  },    
  {
    path: 'events',
    canActivate: [storeGuard],
    component: AgendaListComponent
  },
  {
    path: 'players',
    component: PlayerListComponent
  }  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
