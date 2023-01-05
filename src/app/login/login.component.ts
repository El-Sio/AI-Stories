import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppInitService } from '../app-init.service';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loading = false;
  returnUrl: string;
  error = '';
  userName = '';
  userPassword = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authent: AuthenticationService
  ) {}

  ngOnInit() {
    console.log('init login');
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/story';
  }

  sendCreds() {
    this.loading = true;
    const creds = {
      user: this.userName,
      password: this.userPassword,
    };
    this.authent.login(creds).subscribe(
      (data) => {
        this.loading = false;
        if (data.access) {
          AppInitService.currentUser = data;
          this.router.navigate([decodeURIComponent(this.returnUrl)]);
        } else {
          this.error = data.message;
        }
      },
      (error) => {
        this.loading = false;
        this.error = error.message;
      }
    );
  }
}
