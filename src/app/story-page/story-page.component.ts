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

  constructor(public openai: OpenaiService) {}

  async generateStory() {
    this.story = 'Chargement en cours...';
    let prompt =
      'raconte moi une histoire pour enfant ou fifi et rhino vont à ' +
      this.storyPlace +
      ' pour faire ' +
      this.storyPurpose;
    this.openai.getCompletion(prompt).subscribe((x) => {
      this.story = x.choices[0].text;
      console.log(this.story);
    });
  }

  ngOnInit() {}
}
