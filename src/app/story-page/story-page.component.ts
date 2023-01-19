import { Component, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { AppInitService } from '../app-init.service';
import { FineTune } from '../data-model';

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
  public illustrated = true;
  public temperature = 5;
  public login = AppInitService.currentUser.user;
  private token = '';
  public admin: Boolean;
  public prompt = '';
  public message = '';
  public message_img = '';
  public completed = false;
  public imgsaved = false;
  public completedimg = false;
  public saved = false;
  public message_story = '';
  public allsaved = false;
  public Models: FineTune[] = [
    {
      id: 'text-davinci-003',
      object: 'fine-tune',
      model: 'text-davinci-003',
      created_at: 0,
      fine_tuned_model: 'text-davinci-003',
      hyperparams: null,
      organization_id: 'openai',
      result_files: null,
      status: 'ok',
      validation_files: null,
      training_files: null,
      updated_at: null,
      events: null,
    },
  ];
  public selectedModel: FineTune;
  public modelsloaded = false;

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
      .getCompletion(
        prompt_txt,
        this.temperature / 10,
        this.token,
        this.selectedModel.fine_tuned_model
      )
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
          this.imgsrc = x.data[0].b64_json;
          this.isloading_img = false;
          this.completedimg = true;
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
    this.router.navigate(['collection']);
  }

  saveStory(): void {
    this.openai.saveImage(this.imgsrc).subscribe(
      (res) => {
        this.message_img = res.url;
        this.imgsaved = true;
        let body = {
          location: this.storyPlace,
          purpose: this.storyPurpose,
          companion: this.storyCompanion,
          text: this.story,
          image: this.message_img,
        };
        this.openai.putCollectionData(JSON.stringify(body)).subscribe(
          (res) => {
            this.message_story = 'Histoire enregistrée, merci de votre aide !';
            this.allsaved = true;
          },
          (err) => {
            this.message_story = 'Error : ' + err.message;
          }
        );
      },
      (err) => {
        this.message_img = err.message;
      }
    );
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
        this.message = 'Error : ' + err.message;
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
    this.imgsaved = false;
    this.completedimg = false;
    this.message_img = '';
  }

  gotoAdmin(): void {
    this.router.navigate(['admin']);
  }

  gotoCollection(): void {
    this.router.navigate(['collection']);
  }

  ngOnInit() {
    this.token = AppInitService.currentUser.message;
    this.admin = AppInitService.currentUser.isAdmin;
    this.selectedModel = this.Models[0];
    this.openai.ListFineTunes(this.token).subscribe(
      (res) => {
        this.modelsloaded = true;

        res.data.forEach((m) => {
          if (m.fine_tuned_model) {
            this.Models.push(m);
          }
        });

        this.selectedModel = this.Models[0];
        console.log(this.Models);
      },
      (err) => {
        this.message = 'could not load models : ' + err.message;
      }
    );
  }
}
