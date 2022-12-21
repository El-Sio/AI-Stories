import { Component, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { OpenaiService } from '../openai.service';

@Component({
  selector: 'app-story-page',
  templateUrl: './story-page.component.html',
  styleUrls: ['./story-page.component.css'],
})
export class StoryPageComponent implements OnInit {
  public storyPlace = '';
  public storyPurpose = '';
  public story = '';
  public imgsrc = '';
  public isloading = false;

  constructor(public openai: OpenaiService) {}

  async generateStory() {
    this.isloading = true;
    this.story = 'Chargement en cours...';
    let prompt_txt =
      'raconte moi une histoire pour enfant ou fifi et rhino vont à ' +
      this.storyPlace +
      ' pour faire ' +
      this.storyPurpose;

    let prompt_img =
      'illustration de livre pour enfants avec une giraffe et un rhinoceros qui sont à ' +
      this.storyPlace +
      ' pour faire ' +
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

  ngOnInit() {}
}
