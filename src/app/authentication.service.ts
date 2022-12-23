import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OpenaiService } from './openai.service';

import { User, Authent } from './data-model';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<Authent>;
  public currentUser: Observable<Authent>;

  constructor(private http: HttpClient, private openai: OpenaiService) {
    this.currentUserSubject = new BehaviorSubject<Authent>(
      JSON.parse(sessionStorage.getItem('currentFluidUser'))
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): Authent {
    return this.currentUserSubject.value;
  }

  // Login function called from the login form.

  login(creds: User): Observable<Authent> {
    // Use the POST request of appInitService to get credentials
    return this.openai.login(creds).pipe(
      map((res) => {
        const auth: Authent = {
          user: res.user,
          password: '*****',
          isAdmin: res.isAdmin,
          hasViz: res.hasViz,
          access: res.access,
          message: res.message,
        };
        sessionStorage.setItem('currentFluidUser', JSON.stringify(auth));
        this.currentUserSubject.next(auth);
        return auth;
      })
    );
  }

  logout() {
    // remove user from local storage to log user out
    sessionStorage.removeItem('currentFluidUser');
    this.currentUserSubject.next(null);
  }
}
