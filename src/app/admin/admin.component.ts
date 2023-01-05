import { Component, OnInit } from '@angular/core';
import { OpenaiService } from '../openai.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { AppInitService } from '../app-init.service';
import { ImageAI, Completion, TraningData } from '../data-model';

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
  public changed = false;

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
