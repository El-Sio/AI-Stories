import { Component, OnInit } from '@angular/core';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { AppInitService } from '../app-init.service';
import { ImageAI, Completion, TraningData, TrainingFiles } from '../data-model';

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
        console.log(res);
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

  StartTrainingJob(file: string): void {}
}
