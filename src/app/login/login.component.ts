import { Component, OnInit } from '@angular/core';
import { GoogleLoginProvider, SocialAuthService } from 'angularx-social-login';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  constructor(
    private router: Router,
    private socialAuthService: SocialAuthService
  ) {}

  loginWithGoogle(): void {
    console.log('attempting login');
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then(
      () => {
        alert('coucou');
        this.router.navigate(['story']);
      },
      () => console.log('rejected')
    );
  }

  ngOnInit() {}
}
