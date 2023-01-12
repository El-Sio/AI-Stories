import { Component, OnInit } from '@angular/core';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { AppInitService } from '../app-init.service';
import {
  ImageAI,
  Completion,
  TraningData,
  TrainingFiles,
  FineTune,
} from '../data-model';

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
    this.router.navigate(['login']);
  }

  saveTrainingData(): void {
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
  }

  getTrainingFiles(): void {
    this.isloadingfiles = true;
    this.fileMessage = '';
    this.openai.getFiles(this.token).subscribe(
      (res) => {
        if (res.data.length) {
          this.myFiles = res.data;
          this.myFiles.forEach(
            (f) => (f.created_date = new Date(f.created_at * 1000))
          );
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

  uploadTrainingFile(): void {
    this.isloadingfiles = true;
    this.fileMessage = '';
    this.completeupload = false;
    let newTrainingData = this.arrayToJsonLines(this.trainingDataSet);
    this.openai.UploadFile(this.token, newTrainingData).subscribe(
      (res) => {
        let newfile = {
          id: res.id,
          created_at: res.created_at,
          created_date: new Date(res.created_at * 1000),
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

  getTrainingData(): void {
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
  }

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
