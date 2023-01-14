import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OpenaiService } from '../openai.service';
import { completeStory } from '../data-model';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css'],
})
export class CollectionComponent implements OnInit {
  public storyBook: completeStory[] = [];
  public storyBookLoaded = false;
  public storyBookLoading = false;
  public message = '';
  public currStory: completeStory;
  public index = 0;
  public booklength = 0;
  public bookEnd = false;
  public bookStart = true;

  constructor(public openai: OpenaiService, public router: Router) {}

  ngOnInit() {}

  getStories(): void {
    this.storyBookLoading = true;
    this.openai.getCollectionData().subscribe(
      (res) => {
        this.storyBookLoading = false;
        this.storyBook = res.slice(0, -1);
        this.booklength = this.storyBook.length;
        this.currStory = this.storyBook[0];
        this.storyBookLoaded = true;
        this.message = this.message =
          'Histoire ' +
          (this.index + 1).toString() +
          ' sur ' +
          this.storyBook.length.toString();
      },
      (err) => {
        this.storyBookLoading = false;
        this.message = 'Erreur : ' + err.message;
      }
    );
  }

  nextStory(): void {
    this.bookStart = false;
    this.index += 1;
    if (this.index === this.booklength - 1) {
      this.bookEnd = true;
    }
    this.currStory = this.storyBook[this.index];
    this.message =
      'Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

  previousStory(): void {
    this.bookEnd = false;
    this.index -= 1;
    if (this.index === 0) {
      this.bookStart = true;
    }
    this.currStory = this.storyBook[this.index];
    this.message =
      ' Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

  randomStory(): void {
    this.bookEnd = false;
    this.bookStart = false;
    this.index = Math.floor(Math.random() * this.storyBook.length);
    if (this.index === this.booklength - 1) {
      this.bookEnd = true;
    }
    if (this.index === 0) {
      this.bookStart = true;
    }
    this.currStory = this.storyBook[this.index];
    this.message =
      'Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

  gotoStories(): void {
    this.router.navigate(['story']);
  }
}
