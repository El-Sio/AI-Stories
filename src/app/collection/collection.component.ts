import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpenaiService } from '../openai.service';
import { completeStory } from '../data-model';
import { AppInitService } from '../app-init.service';
import { AuthenticationService } from '../authentication.service';
import { elementAt } from 'rxjs';

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
  public bookEnd = true;
  public bookStart = false;
  public isGeneric: boolean[] = [];
  public isModified: boolean[] = [];
  public admin: Boolean = false;
  public token = '';
  public login = '';
  public oldimage = '';
  public imagechanging = false;
  public imagemessage = '';
  public iscurrStorySet = true;
  public popupclass: string[] = [];
  public currentpage: completeStory[];
  public Pages: completeStory[][] = [];
  public STORIES_PER_PAGE = 8;
  public pageIndex = 0;
  public pageNumber = 0;
  public firstPage = true;
  public lastPage = false;

  constructor(
    public openai: OpenaiService,
    public router: Router,
    public authent: AuthenticationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.admin = AppInitService.currentUser?.isAdmin;
    this.token = AppInitService.currentUser?.message;
    this.login = AppInitService.currentUser?.user;

    this.getStories();

    this.route.fragment.subscribe((fragment: string) => {
      this.scrollToAnchor(fragment);
    });
  }

  logout(): void {
    this.authent.logout();
    this.router.navigate(['/']);
  }

  gotoAdmin(): void {
    this.router.navigate(['admin']);
  }

  gotoCollection(): void {
    this.router.navigate(['collection']);
  }

  public scrollToAnchor(location: string, wait = 0): void {
    const element = document.querySelector('#' + location);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }, wait);
    }
  }

  nextPage(): void {
    if(!this.lastPage) {
      this.firstPage = false;
      this.pageIndex +=1;
      if(this.pageIndex === this.pageNumber -1) {
        this.lastPage = true;
      }
      this.currentpage = this.Pages[this.pageIndex];
    }
  }

  previousPage(): void {
    if(!this.firstPage) {
      this.lastPage = false;
      this.pageIndex -=1;
      if(this.pageIndex === 0) {
        this.firstPage = true;
      }
      this.currentpage = this.Pages[this.pageIndex];
  }
  }

  setCurrStory(i: number) {
    this.iscurrStorySet = true;
    this.bookEnd = false;
    this.bookStart = false;
    this.index = i;
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
    this.waitForElm('#fullStory_' + this.index.toString()).then((v) => {
      this.router.navigateByUrl(
        'collection#fullStory_' + this.index.toString()
      );
    });
  }

  waitForElm(selector): Promise<any> {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  getStories(): void {
    this.storyBookLoading = true;
    this.openai.getCollectionData().subscribe(
      (res) => {
        this.storyBookLoading = false;
        this.storyBook = res.slice(0, -1);
        this.booklength = this.storyBook.length;
        this.storyBook.reverse();
        this.storyBook.forEach((s,i) => {
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)] = [];
        });
        this.storyBook.forEach((s,i) => {
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)].push(s)
        });
        this.pageNumber = this.Pages.length;
        this.currentpage = this.Pages[0];
        this.currStory = this.storyBook[0];
        this.index = this.booklength - 1;
        this.bookEnd = true;
        this.storyBookLoaded = true;
        this.message = this.message =
          'Histoire ' +
          (this.index + 1).toString() +
          ' sur ' +
          this.storyBook.length.toString();

        this.storyBook.forEach((s, i) => {
          this.popupclass.push('popupclosed');
          if (s.image === 'https://japansio.info/fifi/uploads/generic.png') {
            this.isGeneric[i] = true;
          }
        });
      },
      (err) => {
        this.storyBookLoading = false;
        this.message = 'Erreur : ' + err.message;
      }
    );
  }

  getStorieswithIndex(i: number): void {
    this.storyBookLoading = true;
    this.openai.getCollectionData().subscribe(
      (res) => {
        this.storyBookLoading = false;
        this.storyBook = res.slice(0, -1);
        this.booklength = this.storyBook.length;
        this.storyBook.reverse();
        this.currStory = this.storyBook[i];
        this.index = i;
        this.bookEnd = this.booklength - 1 === i;
        this.bookStart = i === 0;
        this.storyBookLoaded = true;
        this.message = this.message =
          'Histoire ' +
          (this.index + 1).toString() +
          ' sur ' +
          this.storyBook.length.toString();

        this.storyBook.forEach((s, i) => {
          if (s.image === 'https://japansio.info/fifi/uploads/generic.png') {
            this.isGeneric[i] = true;
          }
        });
      },
      (err) => {
        this.storyBookLoading = false;
        this.message = 'Erreur : ' + err.message;
      }
    );
  }

  arrayToJsonLines(array): string {
    return array.map(JSON.stringify).join('\n');
  }

  saveStories(): void {
    let newCollection = this.arrayToJsonLines(this.storyBook);
    this.openai.overwriteCollectionData(newCollection).subscribe(
      (res) => {
        this.storyBook = [];
        this.isModified = [];
        this.storyBookLoaded = false;
        this.getStorieswithIndex(this.index);
      },
      (err) => {
        this.imagemessage = 'Erreur : ' + err.message;
      }
    );
  }

  cancel(i: number): void {
    this.storyBook[i].image = this.oldimage;
    this.isModified[i] = false;
  }

  changeImage(i: number): void {
    this.imagechanging = true;

    this.oldimage = this.storyBook[i].image;

    let companion = '';

    if (this.storyBook[i].companion) {
      companion = ' avec ' + this.storyBook[i].companion;
    }

    let prompt =
      'illustration de livre pour enfants avec une girafe et un rhinocéros en train de ' +
      this.storyBook[i].purpose +
      ' ' +
      this.storyBook[i].location +
      companion;

    console.log('calling open AI');
    this.openai.getImage(prompt, this.token).subscribe(
      (img) => {
        console.log('got image data, calling php endpoint');
        this.openai.saveImage(img.data[0].b64_json).subscribe(
          (res) => {
            this.imagechanging = false;
            this.imagemessage = 'image modifiée avec succès';
            this.storyBook[i].image = res.url;
            this.isGeneric[i] = false;
            this.isModified[i] = true;
          },
          (err) => {
            this.imagechanging = false;
            this.imagemessage = 'Erreur : ' + err.message;
          }
        );
      },
      (err) => {
        this.imagechanging = false;
        this.imagemessage = 'Erreur : ' + err.message;
      }
    );
  }

  firstStory(): void {
    this.bookEnd = false;
    this.bookStart = true;
    this.index = 0;
    this.currStory = this.storyBook[this.index];
    this.message =
      'Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

  lastStory(): void {
    this.bookEnd = true;
    this.bookStart = false;
    this.index = this.booklength - 1;
    this.currStory = this.storyBook[this.index];
    this.message =
      'Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

  nextStory(): void {
    if (!this.bookEnd) {
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
  }

  previousStory(): void {
    if (!this.bookStart) {
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
