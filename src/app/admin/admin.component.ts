import { Component, OnInit } from '@angular/core';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { AppInitService } from '../app-init.service';
import {
  TraningData,
  TrainingFiles,
  FineTune,
  completeStory,
} from '../data-model';
import { ThisReceiver } from '@angular/compiler';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  isloading = false;
  complete = false;
  public login = '';
  private token = '';
  public admin: Boolean;
  public editingList: boolean[] = [];
  public trainingDataSet: TraningData[] = [];
  public storybook: completeStory[] = [];
  public message = '';
  public fileMessage = '';
  public changed = false;
  public isloadingfiles = false;
  public completefile = false;
  public completeupload = false;
  public myFiles: TrainingFiles[] = [];
  public isloadingFineTunes = false;
  public myFineTunes: FineTune[] = [];
  public completefinetune = false;
  public finetunemessage = '';
  public jobDetail: FineTune;
  isjobvisible = false;
  testing = false;

  constructor(
    public openai: OpenaiService,
    public router: Router,
    public authent: AuthenticationService
  ) {}

  ngOnInit() {
    this.token = AppInitService.currentUser.message;
    this.admin = AppInitService.currentUser.isAdmin;
    this.login = AppInitService.currentUser.user;
  }

  toggle(i: number): void {
    this.editingList[i] = !this.editingList[i];
    this.changed = true;
    this.message = 'données modifiées';
  }

  arrayToJsonLines(array): string {
    return array.map(JSON.stringify).join('\n');
  }

  logout(): void {
    this.authent.logout();
    this.router.navigate(['']);
    document.location.reload();
  }

  storyToTraining(story: completeStory): TraningData {
    let companion = '';
    if (story.companion) {
      companion = ' avec ' + story.companion;
    }
    let prompt_txt =
      'raconte moi une histoire pour enfant dont les héros sont fifi la girafe et rhino le rhinocéros et qui vont ' +
      story.location +
      ' pour ' +
      story.purpose +
      companion;

    let data = {
      prompt: prompt_txt,
      completion: story.text,
    };

    return data;
  }

  trainingToStory(training: TraningData): completeStory {
    let location = training.prompt.split('vont')[1].split('pour')[0];
    console.log('location ', location);
    let purpose = training.prompt.split('pour')[2].split('avec')[0];
    console.log('purpose ', purpose);
    let companion = training.prompt.split('avec')[1];
    console.log('companion', companion);

    let story = {
      location: location,
      purpose: purpose,
      companion: companion,
      text: training.completion,
      image: 'https://japansio.info/fifi/uploads/generic.png',
      audio: '',
      speechMarks:''
    };
    return story;
  }

  getStories(): void {
    this.isloading = true;
    this.message = '';
    this.openai.getCollectionData().subscribe(
      (res) => {
        this.storybook = res.slice(0, -1);
        this.storybook.reverse();
        this.storybook.forEach((x, i) => (this.editingList[i] = false));
        this.message = 'données reçues';
        this.complete = true;
        this.isloading = false;
      },
      (err) => {
        this.message = err.message;
        this.isloading = false;
      }
    );
  }

  delete(index: number): void {
    let result = confirm("êtes vous sur de vouloir supprimer cette histoire ?");
    if (result) {
    this.storybook.splice(index,1);
    this.changed = true;
    }
  }

  saveStories(): void {
    let newCollection = this.arrayToJsonLines(this.storybook.reverse());
    this.openai.overwriteCollectionData(newCollection).subscribe(
      (res) => {
        this.storybook = [];
        this.editingList = [];
        this.changed = false;
        this.complete = false;
        this.message = 'Données enregistrées !';
      },
      (err) => {
        this.message = 'Erreur : ' + err.message;
      }
    );
  }

  /* saveTrainingData(): void {
    //console.log('input', this.trainingDataSet);
    let newTrainingData = this.arrayToJsonLines(this.trainingDataSet);
    //console.log('output', newTrainingData);
    this.openai.overwriteTrainingData(newTrainingData).subscribe(
      (res) => {
        this.message = 'Données enregistrées, merci de votre aide !';
        this.trainingDataSet = [];
        this.changed = false;
        this.complete = false;
      },
      (err) => {
        this.message = err.message;
      }
    );
    this.changed = false;
  }*/

  getTrainingFiles(): void {
    this.isloadingfiles = true;
    this.fileMessage = '';
    this.openai.getFiles(this.token).subscribe(
      (res) => {
        if (res.data.length) {
          this.myFiles = res.data;
          this.isloadingfiles = false;
          this.completefile = true;
        } else {
          this.fileMessage = 'Aucun fichier disponible...';
          this.isloadingfiles = false;
          this.completefile = false;
        }
      },
      (err) => {
        this.fileMessage = err.message;
        this.isloadingfiles = false;
      }
    );
  }

  testFunctions(i: number): void {
    console.log('original', this.trainingDataSet[i]);
    console.log('transformed', this.trainingToStory(this.trainingDataSet[i]));
    this.openai
      .putCollectionData(
        JSON.stringify(this.trainingToStory(this.trainingDataSet[i]))
      )
      .subscribe(
        (res) => {
          console.log('success');
        },
        (err) => {
          console.log('error', err.message);
        }
      );
  }

  gotoAdmin(): void {
    this.router.navigate(['admin']);
  }

  gotoCollection(): void {
    this.router.navigate(['collection']);
  }

  uploadTrainingFile(): void {
    this.isloadingfiles = true;
    this.fileMessage = '';
    this.completeupload = false;
    this.storybook.forEach((s) => {
      this.trainingDataSet.push(this.storyToTraining(s));
    });
    let newTrainingData = this.arrayToJsonLines(this.trainingDataSet);
    this.openai.UploadFile(this.token, newTrainingData).subscribe(
      (res) => {
        let newfile = {
          id: res.id,
          created_at: res.created_at,
          bytes: res.bytes,
          filename: res.filename,
          purpose: res.purpose,
          object: res.object,
        };
        this.myFiles.push(newfile);
        this.isloadingfiles = false;
        this.completefile = true;
      },
      (err) => {
        this.fileMessage = err.message;
        this.isloadingfiles = false;
        this.completefile = false;
      }
    );
  }

  deleteTrainingFile(idtoremove: string): void {
    this.isloadingfiles = true;
    this.openai.DeleteFile(this.token, idtoremove).subscribe(
      (res) => {
        this.isloadingfiles = false;
        this.completefile = false;
        this.myFiles = this.myFiles.filter((f) => f.id !== idtoremove);
        this.fileMessage =
          'Le fichier suivant : ' + res.id + ' a été supprimé.';
      },
      (err) => {
        this.fileMessage = err.message;
      }
    );
  }

  /* getTrainingData(): void {
    this.message = '';
    this.openai.getTrainingData().subscribe(
      (res) => {
        this.isloading = false;
        this.complete = true;
        this.message = 'données reçues';
        let truncated = res.slice(0, -1);
        this.trainingDataSet = truncated;
        truncated.forEach((x, i) => (this.editingList[i] = false));
      },
      (err) => {
        this.isloading = false;
        this.complete = true;
        this.message = err.message;
      }
    );
  }*/

  listFineTuneJobs(): void {
    this.finetunemessage = '';
    this.isloadingFineTunes = true;
    this.completefinetune = false;

    this.openai.ListFineTunes(this.token).subscribe(
      (res) => {
        if (res.data.length) {
          this.myFineTunes = res.data;
          this.isloadingFineTunes = false;
          this.completefinetune = true;
        } else {
          this.finetunemessage = 'aucun job en cours';
          this.isloadingFineTunes = false;
          this.completefinetune = true;
        }
      },
      (err) => {
        this.isloadingFineTunes = false;
        this.finetunemessage = err.message;
      }
    );
  }

  cancelFineTuneJob(ftid: string) {
    this.isloadingFineTunes = true;
    this.finetunemessage = '';
    this.openai.cancelFineTune(this.token, ftid).subscribe(
      (res) => {
        this.isloadingFineTunes = false;
        this.myFineTunes = this.myFineTunes.filter((f) => f.id !== ftid);
        this.finetunemessage = 'le job ' + res.id + 'a été annulé';
      },
      (err) => {
        this.isloadingFineTunes = false;
        this.finetunemessage = err.message;
      }
    );
  }

  getFineTuneDetails(ftid: string): void {
    this.jobDetail = null;
    this.isloadingFineTunes = true;
    this.finetunemessage = '';
    this.openai.getFineTune(this.token, ftid).subscribe(
      (res) => {
        this.isloadingFineTunes = false;
        this.isjobvisible = true;
        this.jobDetail = res;
      },
      (err) => {
        this.finetunemessage = err.message;
      }
    );
  }

  closeDetail(): void {
    this.isjobvisible = false;
  }

  StartTrainingJob(fid: string): void {
    this.isloadingfiles = true;
    this.openai.createFineTUne(this.token, fid).subscribe(
      (res) => {
        this.isloadingfiles = false;
        this.fileMessage = 'Job démarré avec succès avec l‘id : ' + res.id;
      },
      (err) => {
        this.isloadingfiles = false;
        this.fileMessage = err.message;
      }
    );
  }
}
