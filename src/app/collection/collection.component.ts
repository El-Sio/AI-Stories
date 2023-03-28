import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpenaiService } from '../openai.service';
import { completeStory, speechTiming, Message } from '../data-model';
import { AppInitService } from '../app-init.service';
import { AuthenticationService } from '../authentication.service';
//import * as AWS from 'aws-sdk';
import AWS, { Polly, CognitoIdentityCredentials, Config } from 'aws-sdk';

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
  public oldimage = [];
  public imagechanging = false;
  public imagemessage = '';
  public iscurrStorySet = true;
  public popupclass: string[] = [];
  public currentpage: completeStory[];
  public Pages: completeStory[][] = [];
  public STORIES_PER_PAGE = 12;
  public pageIndex = 0;
  public pageNumber = 0;
  public firstPage = true;
  public lastPage = false;
  public isAudioPlaying = false;
  public audioContext: AudioContext = new AudioContext();
  public source: any;
  public yourAudioData: any;
  public isAudioLoading = false;
  public playStatus = 'pause';
  public soundStatus = 'play';
  public isAudioStarted = false;
  public aws = '';
  public hasAudio: boolean[] = [];
  public hasSpeechMarks: boolean[] = [];
  public currWordArray = [];
  public currSentences = [];
  public highlights = [];
  public isHighlighting = false;
  public hightlightindex = 0;
  public speechArray: speechTiming[] = [];
  public currStorySpeechMarks: speechTiming[] = [];
  public hldelta =0;
  public showAbout = false;
  public aboutLabel = 'A propos de ce site...';
  public readingRate = 10;
  public messages: Message[] = [];
  public searchTerm = '';
  public isSearching = false;
  public isSearchResult = false;

  constructor(
    public openai: OpenaiService,
    public router: Router,
    public authent: AuthenticationService,
    private route: ActivatedRoute
  ) {}

  @ViewChild('player') audioPlayerRef: ElementRef;

  ngOnInit() {
    this.admin = AppInitService.currentUser?.isAdmin;
    this.token = AppInitService.currentUser?.message;
    this.login = AppInitService.currentUser?.user;
    this.aws = AppInitService.currentUser?.aws;

    //initiate a new chat to summarize stories to get better images.
    this.messages.push({role:'system',content:'résume les histoires proposées en une phrase utilisant les mot clés les plus visuels pour décrire le contenu. Les résumés commencent par "illustration de livre pour enfant représentant une girafe et un rhinocéros qui"'});

    this.getStories();

    this.route.fragment.subscribe((fragment: string) => {
      this.scrollToAnchor(fragment);
    });
  }

  logout(): void {
    this.authent.logout();
    this.router.navigate(['']);
    document.location.reload();
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
    
    this.isAudioPlaying = false;
    this.yourAudioData = null;
    this.currWordArray = [];
    if(this.source) {
      this.source.stop();
      this.soundStatus = 'play';
    }
    if(this.audioContext.state === 'suspended') {
      this.audioContext.resume().then((r) => {
        console.log('resumed');
        this.playStatus = 'pause';
      });}

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
    this.currSentences = this.currStory.text.split('\n');
    this.currSentences.forEach(s => { if(s.length>0) {
      s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
    }
});
    this.currWordArray.forEach((w,i) => this.highlights[i] = false);

    this.audioPlayerRef.nativeElement.load();
    this.isAudioPlaying = false;
    this.isAudioStarted = false;
    this.soundStatus = 'play';
    this.playStatus = 'pause';

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
    this.searchTerm = "";
    this.storyBookLoading = true;
    this.currWordArray = [];

    this.openai.getCollectionData().subscribe(
      (res) => {
        this.storyBookLoading = false;
        this.storyBook = res.slice(0, -1);
        this.booklength = this.storyBook.length;
        
        //Latest story first
        this.storyBook.reverse();

        this.storyBook.forEach((s,i) => {
          this.oldimage[i] = '';
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)] = [];
        });
        this.storyBook.forEach((s,i) => {
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)].push(s)
        });
        this.pageNumber = this.Pages.length;
        this.currentpage = this.Pages[0];
        this.currStory = this.storyBook[0];
        
        this.currSentences = this.currStory.text.split('\n');
        this.currSentences.forEach(s => { if(s.length>0) {
          s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
        }

    });
        this.currWordArray.forEach((w,i) => this.highlights[i] = false);

        this.index = 0;
        this.bookStart = true;
        this.bookEnd = false;
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
          if (!s.audio) {
            this.hasAudio[i] = false;
          }
          if (s.audio) {
            this.hasAudio[i] = true;
          }
          if(s.speechMarks) {
            this.hasSpeechMarks[i] = true;
          }
          if(!s.speechMarks) {
            this.hasSpeechMarks[i] = false;
          }
        });
      },
      (err) => {
        this.storyBookLoading = false;
        this.message = 'Erreur : ' + err.message;
      }
    );
  }

  searchstories(term: string): void {

    console.log ('searching for : ', term);

    this.isSearchResult = true;

    this.Pages = [];
    this.storyBook = [];
    this.currentpage = [];
    this.isGeneric = [];
    this.hasAudio = [];
    this.hasSpeechMarks = [];
    this.isModified = [];

    if(term==="") {this.getStories(); return}

    term = term.toLowerCase();

    this.storyBookLoading = true;
    this.currWordArray = [];

    //loading book
    this.openai.getCollectionData().subscribe(
      (res) => {
        this.storyBookLoading = false;

        let tempbook =res.slice(0, -1);
        // this might take some time ?
        this.isSearching = true;
        console.log('searching');

        //filter book if term is in title or content.
        tempbook.forEach( s => {
          if(s.location.toLowerCase().includes(term) || s.purpose.toLowerCase().includes(term) ||(s.companion || '').toLowerCase().includes(term)) {
            this.storyBook.push(s);
          } else if(s.text.includes(term)) {
            this.storyBook.push(s);
          }
        });

        // no search results
        if(this.storyBook.length == 0) {

          this.storyBookLoading = false;
          this.isSearching = false;
          this.message = 'Aucune histoire trouvée';
         let dummystory = {
            'text':"votre recherche n'a retourné aucun résultat, essayez avec d'autres termes",
            'image':'https://japansio.info/fifi/uploads/generic.png',
            'audio':'',
            'speechMarks':'',
            'location':'chercher à nouveau',
            'purpose': 'trouver une histoire qui vous convienne',
            'companion':''
          }

          this.storyBook.push(dummystory);
          this.currStory = this.storyBook[0];

        }

        this.storyBook.reverse();

        this.isSearching = false;

        this.booklength = this.storyBook.length;

        this.storyBook.forEach((s,i) => {
          this.oldimage[i] = '';
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)] = [];
        });
        this.storyBook.forEach((s,i) => {
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)].push(s)
        });
        this.pageNumber = this.Pages.length;
        this.currentpage = this.Pages[0];
        this.currStory = this.storyBook[0];
        
        this.currSentences = this.currStory.text.split('\n');
        this.currSentences.forEach(s => { if(s.length>0) {
          s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
        }

    });
        this.currWordArray.forEach((w,i) => this.highlights[i] = false);

        this.index = 0;
        this.bookStart = true;
        this.bookEnd = false;
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
          if (!s.audio) {
            this.hasAudio[i] = false;
          }
          if (s.audio) {
            this.hasAudio[i] = true;
          }
          if(s.speechMarks) {
            this.hasSpeechMarks[i] = true;
          }
          if(!s.speechMarks) {
            this.hasSpeechMarks[i] = false;
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
    this.currWordArray = [];
    this.openai.getCollectionData().subscribe(
      (res) => {
        this.storyBookLoading = false;
        this.storyBook = res.slice(0, -1);
        this.booklength = this.storyBook.length;
        this.storyBook.reverse();

        this.storyBook.forEach((s,i) => {
          this.oldimage[i] = '';
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)] = [];
        });
        this.storyBook.forEach((s,i) => {
          this.Pages[Math.floor(i/this.STORIES_PER_PAGE)].push(s)
        });
        this.pageNumber = this.Pages.length;
        this.currentpage = this.Pages[Math.floor(i/this.STORIES_PER_PAGE)];

        this.currStory = this.storyBook[i];

        this.currSentences = this.currStory.text.split('\n');
        this.currSentences.forEach(s => { if(s.length>0) {
          s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
        }

    });
        this.currWordArray.forEach((w,i) => this.highlights[i] = false);

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
          if (!s.audio) {
            this.hasAudio[i] = false;
          }
          if (s.audio) {
            this.hasAudio[i] = true;
          }
          if(s.speechMarks) {
            this.hasSpeechMarks[i] = true;
          }
          if(!s.speechMarks) {
            this.hasSpeechMarks[i] = false;
          }
        });

      },
      (err) => {
        this.storyBookLoading = false;
        this.isSearching =false;
        this.message = 'Erreur : ' + err.message;
      }
    );
  }

  arrayToJsonLines(array): string {
    return array.map(JSON.stringify).join('\n');
  }

  saveStories(): void {
    if(this.source) {
      this.source.stop();
      this.soundStatus = 'play';
    }
    let newCollection = this.arrayToJsonLines(this.storyBook.reverse());
    this.openai.overwriteCollectionData(newCollection).subscribe(
      (res) => {
        this.storyBook = [];
        this.isModified = [];
        this.oldimage = [];
        this.storyBookLoaded = false;
        this.getStorieswithIndex(this.index);
      },
      (err) => {
        this.imagemessage = 'Erreur : ' + err.message;
      }
    );
  }

  cancel(i: number): void {
    this.storyBook[i].image = this.oldimage[i];
    this.isModified[i] = false;
  }

  changeImage(i: number): void {
    this.imagechanging = true;

    this.oldimage[i] = this.storyBook[i].image;
    this.messages = [];
    this.messages.push({role:'system',content:'résume les histoires proposées en une phrase utilisant les mot clés les plus visuels pour décrire le contenu. Les résumés commencent par "illustration de livre pour enfant représentant une girafe et un rhinocéros qui"'});

    /*let companion = '';

    if (this.storyBook[i].companion) {
      companion = ' avec ' + this.storyBook[i].companion;
    }

    let prompt =
      'illustration de livre pour enfants avec une girafe et un rhinocéros en train de ' +
      this.storyBook[i].purpose +
      ' ' +
      this.storyBook[i].location +
      companion;
 */
      this.messages.push({role:'user', content:this.storyBook[i].text});

    console.log('calling open AI', this.messages);

    //summarize story
    this.openai.getChatCompletion(this.messages,0.8,this.token,'gpt-3.5-turbo').subscribe(
      (x) => {
        let prompt = x.choices[0].message.content;

        console.log('resumé : ', prompt);

        //get image from openaI
        this.openai.getImage(prompt, this.token, 1).subscribe(
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

      },
      (err) => {
        this.imagechanging = false;
        this.imagemessage = 'Erreur : ' + err.message;
      }
    );
  }

  firstStory(): void {

    this.isAudioPlaying = false;
    this.yourAudioData = null;
    this.currWordArray = [];
    if(this.source) {
      this.source.stop();
      this.soundStatus = 'play';
    }
    if(this.audioContext.state === 'suspended') {
      this.audioContext.resume().then((r) => {
        console.log('resumed');
        this.playStatus = 'pause';
      });}

    this.bookEnd = false;
    this.bookStart = true;
    this.index = 0;
    this.currStory = this.storyBook[this.index];

    this.currSentences = this.currStory.text.split('\n');
    this.currSentences.forEach(s => { if(s.length>0) {
      s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
    }

});
    this.currWordArray.forEach((w,i) => this.highlights[i] = false);

    this.audioPlayerRef.nativeElement.load();
    this.isAudioPlaying = false;
    this.isAudioStarted = false;
    this.soundStatus = 'play';
    this.playStatus = 'pause';
    this.message =
      'Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

  lastStory(): void {

    this.isAudioPlaying = false;
    this.yourAudioData = null;
    this.currWordArray = [];
    if(this.source) {
      this.source.stop();
      this.soundStatus = 'play';
    }
    if(this.audioContext.state === 'suspended') {
      this.audioContext.resume().then((r) => {
        console.log('resumed');
        this.playStatus = 'pause';
      });}

    this.bookEnd = true;
    this.bookStart = false;
    this.index = this.booklength - 1;
    this.currStory = this.storyBook[this.index];

    this.currSentences = this.currStory.text.split('\n');
    this.currSentences.forEach(s => { if(s.length>0) {
      s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});;
    }

});
    this.currWordArray.forEach((w,i) => this.highlights[i] = false);

    this.audioPlayerRef.nativeElement.load();
    this.isAudioPlaying = false;
    this.isAudioStarted = false;
    this.soundStatus = 'play';
    this.playStatus = 'pause';
    this.message =
      'Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

  nextStory(): void {

    this.isAudioPlaying = false;
    this.yourAudioData = null;
    this.currWordArray = [];
    if(this.source) {
      this.source.stop();
      this.soundStatus = 'play';
    }
    if(this.audioContext.state === 'suspended') {
      this.audioContext.resume().then((r) => {
        console.log('resumed');
        this.playStatus = 'pause';
      });}

    if (!this.bookEnd) {
      this.bookStart = false;
      this.index += 1;
      if (this.index === this.booklength - 1) {
        this.bookEnd = true;
      }
      this.currStory = this.storyBook[this.index];

      this.currSentences = this.currStory.text.split('\n');
      this.currSentences.forEach(s => { if(s.length>0) {
        s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
      }
  });
      this.currWordArray.forEach((w,i) => this.highlights[i] = false);

      this.audioPlayerRef.nativeElement.load();
      this.isAudioPlaying = false;
      this.isAudioStarted = false;
      this.soundStatus = 'play';
      this.playStatus = 'pause';
      this.message =
        'Histoire ' +
        (this.index + 1).toString() +
        ' sur ' +
        this.storyBook.length.toString();
    }
  }

  previousStory(): void {

    this.isAudioPlaying = false;
    this.yourAudioData = null;
    this.currWordArray = [];
    if(this.source) {
      this.source.stop();
      this.soundStatus = 'play';
    }
    if(this.audioContext.state === 'suspended') {
      this.audioContext.resume().then((r) => {
        console.log('resumed');
        this.playStatus = 'pause';
      });}

    if (!this.bookStart) {
      this.bookEnd = false;
      this.index -= 1;
      if (this.index === 0) {
        this.bookStart = true;
      }
      this.currStory = this.storyBook[this.index];

      this.currSentences = this.currStory.text.split('\n');
      this.currSentences.forEach(s => { if(s.length>0) {
        s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
      }
  });
      this.currWordArray.forEach((w,i) => this.highlights[i] = false);

      this.audioPlayerRef.nativeElement.load();
      this.isAudioPlaying = false;
      this.isAudioStarted = false;
      this.soundStatus = 'play';
      this.playStatus = 'pause';
      this.message =
        ' Histoire ' +
        (this.index + 1).toString() +
        ' sur ' +
        this.storyBook.length.toString();
    }
  }

  randomStory(): void {

    this.isAudioPlaying = false;
    this.yourAudioData = null;
    this.currWordArray = [];
    if(this.source) {
      this.source.stop();
      this.soundStatus = 'play';
    }
    if(this.audioContext.state === 'suspended') {
      this.audioContext.resume().then((r) => {
        console.log('resumed');
        this.playStatus = 'pause';
      });}

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

    this.currSentences = this.currStory.text.split('\n');
    this.currSentences.forEach(s => { if(s.length>0) {
      s.split(" ").forEach(w => {if(w!=="") {this.currWordArray.push(w)}});
    }
});
    this.currWordArray.forEach((w,i) => this.highlights[i] = false);

    this.audioPlayerRef.nativeElement.load();
    this.isAudioPlaying = false;
    this.isAudioStarted = false;
    this.soundStatus = 'play';
    this.playStatus = 'pause';
    this.message =
      'Histoire ' +
      (this.index + 1).toString() +
      ' sur ' +
      this.storyBook.length.toString();
  }

 testSpeech(story: string, i: number): void {

if(!this.yourAudioData) {


  console.log('pas encore de data audio');
  this.isAudioLoading = true;

    let client = new Polly({
      region: 'eu-west-1', // Région
      credentials: new CognitoIdentityCredentials({
        IdentityPoolId: this.aws,
})
    });

AWS.config.credentials = new CognitoIdentityCredentials({
  IdentityPoolId: this.aws,
});

AWS.config.region = 'eu-west-1';

    // Set the parameters
let speechParams = {
  OutputFormat: "mp3", // For example, 'mp3'
  SampleRate: "16000", // For example, '16000
  Text: story, // The 'speakText' function supplies this value
  TextType: "text", // For example, "text"
  VoiceId: "Remi", // For example, "Matthew"
  Engine: "neural"
};

let audioContext = new AudioContext();

let speechParamsJson = {
  OutputFormat: "json", // For example, 'mp3'
  SpeechMarkTypes: ["sentence", "word"],
  SampleRate: "16000", // For example, '16000
  Text: story, // The 'speakText' function supplies this value
  TextType: "text", // For example, "text"
  VoiceId: "Remi", // For example, "Matthew"
  Engine: "neural"
}


//only get speechmarks if audio is already existing
if(!this.hasAudio[i]) {
  let response =  client.synthesizeSpeech(speechParams).send((err, data) => {
  console.log('error',err);
  if(data.AudioStream) {

    this.isAudioLoading = false;
    this.yourAudioData = <Uint8Array>data.AudioStream;
    this.isAudioPlaying = true;
    let arrayBuffer = this.yourAudioData.buffer;

    this.openai.saveAudio(arrayBuffer).subscribe(
      (res) => {
        console.log('getting audio for story'+i, res);
        this.storyBook[i].audio = res.url;
        this.isModified[i] = true;
        this.hasAudio[i] = true;
      },
      (err) => console.log(err)
    );
  

    this.audioContext.decodeAudioData(arrayBuffer.slice(0), (audioBuffer) => {
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.connect(this.audioContext.destination);
      this.source.start();});
  }

  this.soundStatus = 'back';

});
}

// get Speechmarks if none exist 

if(!this.hasSpeechMarks[i]) {
let jsonresponse = client.synthesizeSpeech(speechParamsJson).send((error, json) => {
  console.log('error', error);
  let jsondata = <Uint8Array>json.AudioStream;
  let jsonstring = Buffer.from(jsondata).toString('utf8');
  let objectarray = jsonstring.split("\n").slice(0, -1);
  this.speechArray = [];
  objectarray.forEach(i => 
    {
      this.speechArray.push(JSON.parse(i));
    });

  this.speechArray = this.speechArray.filter(i => i.type === "word");

  this.openai.saveSpeechMarks(JSON.stringify(this.speechArray)).subscribe(
    (res) => {
      console.log('getting spechmarks for story'+i, res);
      this.storyBook[i].speechMarks = res.url;
      this.isModified[i] = true;
      this.hasSpeechMarks[i] = true;
      this.isAudioLoading = false;
    },
    (err) => {console.log(err)}
  );

});
}

}

if(this.yourAudioData) {

  console.log('audio déjà reçu et en cours de lecture');

  this.isAudioPlaying = true;
  let arrayBuffer = this.yourAudioData.buffer;
  
  this.audioContext = new AudioContext();

  this.audioContext.decodeAudioData(arrayBuffer.slice(0), (audioBuffer) => {
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.connect(this.audioContext.destination);
    this.source.start();});
}

this.soundStatus = 'back';

}
audioPause(): void {

  if(this.audioContext.state === 'running') {
    this.audioContext.suspend().then((r) => {
      console.log('paused');
      this.playStatus = 'play';
    });
  } else if(this.audioContext.state === 'suspended') {
    this.audioContext.resume().then((r) => {
      console.log('resumed');
      this.playStatus = 'pause';
    });

}
}

audioStop(): void {
  this.isAudioPlaying = false;
  this.playStatus = 'pause';
  this.soundStatus = 'play';
  this.source.stop();
}

playerPlay(): void {

  this.isAudioLoading = true;
  this.openai.getSpeechMarks(this.currStory.speechMarks).subscribe(
    (res) => {
      this.isAudioLoading = false;
      //console.log(res);
      this.currStorySpeechMarks = res;
      
      this.audioPlayerRef.nativeElement.load();

      //playbackrate test
      this.audioPlayerRef.nativeElement.playbackRate = this.readingRate/10;

      this.audioPlayerRef.nativeElement.play();
      this.isAudioPlaying = true;
      this.isAudioStarted = true;
      this.soundStatus = 'back';
      this.hightlightindex = 0;
      this.isHighlighting = true;
      this.trueHighlightStart();
    },
    (err) => {
      console.log('no speechmark, improvising');
      this.isAudioLoading = false;
      this.audioPlayerRef.nativeElement.load();
      this.audioPlayerRef.nativeElement.play();
      this.isAudioPlaying = true;
      this.isAudioStarted = true;
      this.soundStatus = 'back';
      this.hightlightindex = 0;
      this.isHighlighting = true;
      this.highlightStart();
  }
  );
}

playerPause(): void {
  if(!this.audioPlayerRef.nativeElement.paused) {
    this.audioPlayerRef.nativeElement.pause();
    this.isAudioPlaying = false;
    this.isHighlighting = false;
    this.playStatus = 'play';
  } else if(this.audioPlayerRef.nativeElement.paused) {

      //playbackrate test
      this.audioPlayerRef.nativeElement.playbackRate = this.readingRate/10;
    this.audioPlayerRef.nativeElement.play();
    this.isAudioPlaying = true;
    this.isHighlighting = true;
    if(this.currStorySpeechMarks.length > 0) {
      this.trueHighlightStartFrom(this.hightlightindex);
    } 
    else {
      this.highlightStartFrom(this.hightlightindex);
    }
    this.playStatus = 'pause';
  }
}

playerStop(): void {
  this.audioPlayerRef.nativeElement.pause();
  this.audioPlayerRef.nativeElement.load();
  this.isAudioPlaying = false;
  this.isAudioStarted = false;
  this.isHighlighting = false;
  this.hightlightindex = 0;
  this.highlights.forEach((w,i) => this.highlights[i] = false);
  this.playStatus = 'pause';
  this.soundStatus = 'play';
}

async highlightStart() {

  if(this.highlights) {
    for(let i=0; i < this.highlights.length; i++) {
      if(!this.isHighlighting) { 
        this.hightlightindex = i;
        break }
      if(i >0) {this.highlights[i-1] = false}
      this.highlights[i] = true;
      if(this.currWordArray[i].includes(".")) {
        console.log('point');
        await this.delay(500);
      } else if(this.currWordArray[i].includes(",")) {
        console.log('virgule');
        await this.delay(400);
      } else {
        if(this.currWordArray[i].length < 6) {await this.delay(250);}
        else {await this.delay(300);}
      }
    }
  }
}

async highlightStartFrom(s: number) {
  if(this.highlights) {
    for(let i=s; i < this.highlights.length; i++) {
      if(!this.isHighlighting) { 
        this.hightlightindex = i;
        break }
        if(i >0) {this.highlights[i-1] = false}
        this.highlights[i] = true;
        if(this.currWordArray[i].includes(".")) {
          console.log('point');
          await this.delay(500);
        } else if(this.currWordArray[i].includes(",")) {
          console.log('virgule');
          await this.delay(400);
        } else {
          if(this.currWordArray[i].length < 6) {await this.delay(250);}
          else {await this.delay(300);}
        }
    }
  }
}

async trueHighlightStart() {
  if(this.highlights && this.currStorySpeechMarks) {
    this.hldelta = 0;
    let j = 0;
    for(let i=0; i<this.highlights.length; i++) {
      if(!this.isHighlighting) {
        this.hightlightindex = i;
        break}
      if(j > 0) {this.highlights[j-1] = false}
      //if words match highliht it and wait for next
      if(this.currWordArray[j].includes(this.currStorySpeechMarks[i].value)) {
        this.highlights[j] = true;
        if(i<this.currStorySpeechMarks.length-1) {
        await this.delay((this.currStorySpeechMarks[i+1].time - this.currStorySpeechMarks[i].time)*(1/(this.readingRate/10)));
      } else {
        await this.delay(this.currStorySpeechMarks[i].time*(1/(this.readingRate/10)));
      }
    } else {
      console.log("skipping ", this.currWordArray[j]);
      j +=1;
      this.hldelta +=1;
    }
    j+=1;
    }
  }
}

async trueHighlightStartFrom(s: number) {
  if(this.highlights && this.currStorySpeechMarks) {
    let j= s + this.hldelta;
    console.log('resuming at i = ',s);
    console.log('resuming at j = ',j);
    for(let i=s; i<this.highlights.length; i++) {
      if(!this.isHighlighting) {
        this.hightlightindex = i;
        break}
      if(j > 0) {this.highlights[j-1] = false}
      //if words match highliht it and wait for next
      if(this.currWordArray[j].includes(this.currStorySpeechMarks[i].value)) {
      this.highlights[j] = true;
      if(i < this.currStorySpeechMarks.length-1) {
        await this.delay((this.currStorySpeechMarks[i+1].time - this.currStorySpeechMarks[i].time)*(1/(this.readingRate/10)));
      } else {
        await this.delay(this.currStorySpeechMarks[i].time*(1/(this.readingRate/10)));
      }
    } else {
      console.log("skipping ", this.currWordArray[j]);
      j +=1
      this.hldelta +=1;
    }
    j+=1;
  }
  }
}

changeRate(val: any) {
  this.audioPlayerRef.nativeElement.playbackRate = this.readingRate/10;
}

about():void {
  this.showAbout = !this.showAbout;
  if(this.showAbout) {this.aboutLabel = 'Fermer'} else {this.aboutLabel = 'A propos de ce site...'}
}

delay(ms) {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
}

  gotoStories(): void {
    this.router.navigate(['story']);
  }
}
