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
  }

  toggle(i: number): void {
    this.editingList[i] = !this.editingList[i];
    this.changed = true;
    this.message = 'données modifiées';
  }

  arrayToJsonLines(array): string {
    return array.map(JSON.stringify).join('\n');
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
    this.openai.getFiles(this.token).subscribe(
      (res) => {
        console.log(res);
        if (res.length) {
          this.myFiles = res;
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
    this.openai.UploadFile(this.token).subscribe(
      (res) => {
        console.log(res);
        this.myFiles.push(res);
        this.isloadingfiles = false;
        this.completefile = true;
      },
      (err) => {
        this.fileMessage = err.message;
        this.isloadingfiles = false;
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
}
