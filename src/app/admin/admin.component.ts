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
  }

  saveTrainingData(): void {}

  getTrainingData(): void {
    this.openai.getTrainingData().subscribe(
      (res) => {
        this.isloading = false;
        this.complete = true;
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
