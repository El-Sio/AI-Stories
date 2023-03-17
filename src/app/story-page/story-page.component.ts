import { Component, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { AppInitService } from '../app-init.service';
import { FineTune, Message } from '../data-model';

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
  public imgsrc = [];
  public ischecked = [];
  public selectedimage = '';
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
  public isSaving = false;
  public allsaved = false;

  //moving to gpt-3.5
  public messages : Message[] = [];
  public summarymessages: Message[] = [];
  
  public Models: string[] = [];

  /*public Models: FineTune[] = [
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
  */
 
  public selectedModel: string;
 public modelsloaded = false;

  constructor(
    public openai: OpenaiService,
    public router: Router,
    public authent: AuthenticationService
  ) {}

  generateStory(): void {
    this.isloading_txt = true;
    this.story = 'Chargement en cours...';
    this.imgsrc = [];
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

    console.log(prompt_txt);
    this.prompt = prompt_txt;

    //moving to gpt3.5
    this.messages.push({role:'user', content:prompt_txt});

    this.openai
    .getChatCompletion(
      this.messages,
      this.temperature / 10,
      this.token,
      'gpt-3.5-turbo'
    )
    .subscribe(
      (x) => {
        this.story = x.choices[0].message.content;
        this.isloading_txt = false;
        this.completed = true;

        if(this.illustrated) {
        this.isloading_img = true;
        //getting a summary for Dall-E
        console.log('fetching summary');
        this.summarymessages.push({role:'user',content:this.story});
        this.openai.getChatCompletion(this.summarymessages,0.8,this.token,'gpt-3.5-turbo').subscribe(
          (summ) => {
            let prompt_img = summ.choices[0].message.content;
            console.log('resumé : ', prompt_img);
            this.openai.getImage(prompt_img, this.token, 4).subscribe(
              (x) => {
                x.data.forEach(item => {
                  this.imgsrc.push(item.b64_json);
                  this.ischecked.push(false);
                });
                this.selectedimage = this.imgsrc[0];
                this.ischecked[0] = true;
                this.isloading_img = false;
                this.completedimg = true;
              },
              (err) => {
                this.isloading_img = false;
                this.imgsrc = err.message;
              }
            );
          },
          (err) => {
            this.isloading_img = false;
            this.imgsrc = err.message;
          }
        );
      }

      },
      (err) => {
        this.isloading_txt = false;
        this.story = err.message;
      }
    );

    /*this.openai
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
        }
      );*/
  }

  logout(): void {
    this.authent.logout();
    this.router.navigate(['']);
    document.location.reload();
  }

  saveStory(): void {
    this.isSaving = true;
    this.openai.saveImage(this.selectedimage).subscribe(
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
            this.message_story = 'Histoire enregistrée.';
            this.allsaved = true;
            this.isSaving = false;
          },
          (err) => {
            this.message_story = 'Error : ' + err.message;
            this.isSaving = false;
          }
        );
      },
      (err) => {
        this.message_img = err.message;
        this.isSaving = false;
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
    this.illustrated = true;
    this.message = '';
    this.saved = false;
    this.imgsaved = false;
    this.completedimg = false;
    this.message_img = '';
   
    //moving to GPT 3.5
    this.messages = [];
    this.messages.push({role:'system',content:"Tu es un auteur d'histoires pour enfants. Tu inventes des histoires avec un vocabulaire simple destiné aux enfants. Toutes les histoires commencent par 'Un jour, Fifi et Rhino'"});

    this.summarymessages = [];
    this.summarymessages.push({role:'system',content:'résume les histoires proposées en une phrase utilisant les mot clés les plus visuels pour décrire le contenu. Les résumés commencent par "illustration de livre pour enfant représentant une girafe et un rhinocéros qui"'});

  }

  gotoAdmin(): void {
    this.router.navigate(['admin']);
  }

  gotoCollection(): void {
    this.router.navigate(['collection']);
  }

  selected(item: string, index: number): void {
    this.selectedimage = item;
    this.ischecked.forEach((i,j) => this.ischecked[j] = false);
    this.ischecked[index] = true;
  }

  ngOnInit() {
    this.token = AppInitService.currentUser.message;
    this.admin = AppInitService.currentUser.isAdmin;
    this.selectedModel = this.Models[0];

    //moving to GPT 3.5
    this.messages.push({role:'system',content:"Tu es un auteur d'histoires pour enfants. Tu inventes des histoires avec un vocabulaire simple destiné aux enfants. Toutes les histoires commencent par 'Un jour, Fifi et Rhino'. ajoute au moins un élément de surprise ou un élément humoristique dans chaque histoire."});

    //trying feeding story summary to dall-E instead of original prompt
    this.summarymessages.push({role:'system',content:'résume les histoires proposées en une phrase utilisant les mot clés les plus visuels pour décrire le contenu. Les résumés commencent par "illustration de livre pour enfant représentant une girafe et un rhinocéros qui"'});

    this.openai.getModelList(this.token).subscribe(
      (res) => {
        this.modelsloaded = true;

        res.data.forEach((m) => {
            this.Models.push(m.id);
          }
        );

        this.selectedModel = 'gpt-3.5-turbo';
      },
      (err) => {
        this.message = 'could not load models : ' + err.message;
      }
    );
  }
}
