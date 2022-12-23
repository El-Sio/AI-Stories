import { Component, OnInit } from '@angular/core';
import { OpenaiService } from '../openai.service';
import { AppInitService } from '../app-init.service';
import { Authent } from '../data-model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  admin: Boolean;
  Users: Authent[];
  displayUser: Authent[];
  globalLoading = false;
  error = false;
  errortext = '';
  toaster_img = 'loss';
  toaster_message = '';
  admin_password = '';
  admin_user = '';
  private adminUser: Authent = {
    user: '',
    password: '',
    message: '',
    access: true,
    hasViz: true,
    isAdmin: true,
  };

  constructor(public openai: OpenaiService) {}

  ngOnInit() {
    // are we admin ?
    this.admin = AppInitService.currentUser.isAdmin;
    this.displayUser = [];
  }

  getUserList(): void {
    this.globalLoading = true;
    this.error = false;
    // Get password from the form
    this.adminUser.password = this.admin_password;
    this.adminUser.user = this.admin_user;

    // get users from the API
    this.openai.getUsers(this.adminUser).subscribe(
      (u) => {
        this.Users = u;
        this.displayUser = JSON.parse(JSON.stringify(this.Users));
        this.globalLoading = false;
        if (u.length === 1) {
          // got only 1 user : this is an error
          this.error = true;
          this.errortext = u[0].user;
          this.displayUser = [];
        }
      },
      (err) => {
        this.globalLoading = false;
        this.error = true;
        this.errortext = err.message;
      }
    );
  }

  hash(user: Authent) {
    console.log('input', user.password);
    this.openai.hashPass(user).subscribe((p) => {
      user.password = p;
      console.log('output', user.password);
    });
  }
  validate(): void {}

  userDelete(user: Authent): void {
    this.displayUser = this.displayUser.filter((u) => u.user !== user.user);
  }

  adduser(): void {
    this.displayUser.push({
      user: 'name',
      password: 'change me',
      hasViz: false,
      isAdmin: false,
      message: 'new',
      access: true,
    });
  }

  launch_toast(): void {
    const x = document.getElementById('toast');
    x.className = 'show';
    setTimeout(function () {
      x.className = x.className.replace('show', '');
    }, 5000);
  }

  cancel(): void {
    // reset everything by getting data from the server again.
    this.displayUser = [];
    this.Users = [];
    this.getUserList();
  }

  save(): void {
    this.openai.writeUsers(this.displayUser).subscribe(
      (r) => {
        this.toaster_img = 'win';
        this.toaster_message = 'Changes successfully saved !';
        this.launch_toast();
      },
      (err) => {
        this.toaster_img = 'loss';
        this.toaster_message = 'Something went wrong...';
        this.launch_toast();
      }
    );
  }
}
