import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { AuthenticationService } from './authentication.service';
import { AppInitService } from './app-init.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.authenticationService.currentUserValue;
    if (currentUser) {
      if (state.url === '/admin') {
        if (currentUser.isAdmin) {
          console.log('trying to go to admin page');
          return true;
        } else {
          console.log('intruder alert');
          return false;
        }
      }

      // logged in so return true
      console.log('logué');
      AppInitService.currentUser = currentUser;
      return true;
    } else {
      // not logged in so redirect to login page with the return url
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      console.log('pas logué');
      return false;
    }
  }
}
