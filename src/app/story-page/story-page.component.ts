import { Component, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { AppInitService } from '../app-init.service';

@Component({
  selector: 'app-story-page',
  templateUrl: './story-page.component.html',
  styleUrls: ['./story-page.component.css'],
})
export class StoryPageComponent implements OnInit {
  public storyPlace = '';
  public storyPurpose = '';
  public storyCompanion = '';
  public story = 'Votre histoire ici';
  public imgsrc = '';
  public isloading_img = false;
  public isloading_txt = false;
  public illustrated = false;
  public temperature = 5;
  public login = AppInitService.currentUser.user;
  private token = '';
  public admin: Boolean;
  public prompt = '';
  public message = '';
  public completed = false;
  public saved = false;

  constructor(
    public openai: OpenaiService,
    public router: Router,
    public authent: AuthenticationService
  ) {}

  generateStory(): void {
    this.isloading_txt = true;
    this.story = 'Chargement en cours...';
    this.imgsrc = '';
    let companion = '';
    if (this.storyCompanion) {
      companion = ' avec ' + this.storyCompanion;
    }
    let prompt_txt =
      'raconte moi une histoire pour enfant dont les héros sont fifi la girafe et rhino le rhinocéros et qui vont ' +
      this.storyPlace +
      ' pour ' +
      this.storyPurpose +
      companion;

    let prompt_img =
      'illustration de livre pour enfants avec une girafe et un rhinocéros en train de ' +
      this.storyPurpose +
      ' ' +
      this.storyPlace +
      companion;

    console.log(prompt_txt);
    this.prompt = prompt_txt;

    this.openai
      .getCompletion(prompt_txt, this.temperature / 10, this.token)
      .subscribe(
        (x) => {
          this.story = x.choices[0].text;
          this.isloading_txt = false;
          this.completed = true;
        },
        (err) => {
          this.isloading_txt = false;
          this.story = err.message;
          this.completed = true;
        }
      );

    if (this.illustrated) {
      this.isloading_img = true;
      this.openai.getImage(prompt_img, this.token).subscribe(
        (x) => {
          this.imgsrc = x.data[0].url;
          console.log(this.imgsrc);
          this.isloading_img = false;
        },
        (err) => {
          this.isloading_img = false;
          this.imgsrc = err.message;
        }
      );
    }
  }

  logout(): void {
    this.authent.logout();
    this.router.navigate(['login']);
  }

  sendFeedback(): void {
    let body = {
      prompt: this.prompt,
      completion: this.story,
    };
    this.openai.putTrainingData(JSON.stringify(body)).subscribe(
      (res) => {
        this.message = 'Histoire enregistrée, merci de votre aide !';
        this.saved = true;
      },
      (err) => {
        this.message = 'Error ' + err.message;
      }
    );
  }

  reset(): void {
    this.completed = false;
    this.story = '';
    this.storyPlace = '';
    this.storyPurpose = '';
    this.storyCompanion = '';
    this.prompt = '';
    this.illustrated = false;
    this.message = '';
    this.saved = false;
  }

  gotoAdmin(): void {
    this.router.navigate(['admin']);
  }

  ngOnInit() {
    this.token = AppInitService.currentUser.message;
    this.admin = AppInitService.currentUser.isAdmin;
  }
}
