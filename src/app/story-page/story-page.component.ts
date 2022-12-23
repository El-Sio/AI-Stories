import { Component, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-story-page',
  templateUrl: './story-page.component.html',
  styleUrls: ['./story-page.component.css'],
})
export class StoryPageComponent implements OnInit {
  public storyPlace = '';
  public storyPurpose = '';
  public story = 'Votre histoire ici';
  public imgsrc = '';
  public isloading = false;
  public illustrated = false;

  constructor(
    public openai: OpenaiService,
    public router: Router,
    public authent: AuthenticationService
  ) {}

  generateStory(): void {
    this.isloading = true;
    this.story = 'Chargement en cours...';
    this.imgsrc = '';
    let prompt_txt =
      'raconte moi une histoire pour enfant ou fifi et rhino vont ' +
      this.storyPlace +
      ' pour ' +
      this.storyPurpose;

    let prompt_img =
      'illustration de livre pour enfants avec une giraffe et un rhinoceros qui ' +
      this.storyPlace +
      ' pour ' +
      this.storyPurpose;

    this.openai.getCompletion(prompt_txt).subscribe(
      (x) => {
        this.story = x.choices[0].text;
        console.log(this.story);
        this.isloading = false;
      },
      (err) => {
        this.isloading = false;
        this.story = err.message;
      }
    );

    console.log('illustrated :', this.illustrated);

    if (this.illustrated) {
      this.openai.getImage(prompt_img).subscribe(
        (x) => {
          this.imgsrc = x.data[0].url;
          console.log(this.imgsrc);
          this.isloading = false;
        },
        (err) => {
          this.isloading = false;
          this.imgsrc = err.message;
        }
      );
    }
  }

  logout(): void {
    this.authent.logout();
    this.router.navigate(['login']);
  }

  ngOnInit() {}
}
