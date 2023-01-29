import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {
  ImageAI,
  Completion,
  TraningData,
  TrainingFiles,
  FilreResponse,
  FineTuneResponse,
  FineTune,
  ModelList,
  completeStory,
} from './data-model';
import { AppInitService } from './app-init.service';
import { User, Authent } from './data-model';

@Injectable()
export class OpenaiService {
  constructor(private http: HttpClient) {}

  login(creds: User): Observable<Authent> {
    return this.http.post<Authent>(
      AppInitService.settings.Login_URL,
      JSON.stringify(creds)
    );
  }

  getFiles(token: string): Observable<FilreResponse> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.get<FilreResponse>(
      'https://api.openai.com/v1/files',
      httpOptions
    );
  }

  saveAudio(data:any): Observable<any> {

    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'audio/mpeg',
      }),
    };

    let body = new FormData();
    body.append('audioStream', data);

    return this.http.post(
      'https://japansio.info/fifi/saveAudio.php',
      body
    );
  }

  UploadFile(token: string, file: string): Observable<TrainingFiles> {
    let timestamp = new Date().getTime().toString();
    let filename = 'myTrainingFile_' + timestamp + '.jsonl';
    let fileblob = new Blob([file], {
      type: 'text/plain; charset=utf8',
    });

    let body = new FormData();

    body.append('purpose', 'fine-tune');
    body.append('file', fileblob, filename);

    let httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.post<TrainingFiles>(
      'https://api.openai.com/v1/files',
      body,
      httpOptions
    );
  }

  DeleteFile(token: string, id: string): Observable<any> {
    let httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.delete(
      'https://api.openai.com/v1/files/' + id,
      httpOptions
    );
  }

  getCompletion(
    prompt: string,
    temp: number,
    token: string,
    model: string
  ): Observable<Completion> {
    let maxtoken = 0;
    let stop = null;

    switch (model) {
      case 'text-davinci-003':
        maxtoken = 2500;
        break;
      default:
        maxtoken = 1500;
        stop = 'FIN';
        break;
    }

    let body = {
      model: model,
      prompt: prompt,
      max_tokens: maxtoken,
      temperature: temp,
      stop: stop,
    };

    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.post<Completion>(
      'https://api.openai.com/v1/completions',
      body,
      httpOptions
    );
  }

  putTrainingData(data: string): Observable<any> {
    return this.http.post(
      'https://japansio.info/api/putTrainingData.php',
      data
    );
  }

  putCollectionData(data: string): Observable<any> {
    return this.http.post(
      'https://japansio.info/api/putCollectionData.php',
      data
    );
  }

  overwriteTrainingData(data: string): Observable<any> {
    return this.http.post(
      'https://japansio.info/api/overwriteTrainingData.php',
      data
    );
  }

  overwriteCollectionData(data: string): Observable<any> {
    return this.http.post(
      'https://japansio.info/api/overwriteCollectionData.php',
      data
    );
  }

  getTrainingData(): Observable<TraningData[]> {
    return this.http.get<TraningData[]>(
      'https://japansio.info/api/getTrainingData.php'
    );
  }

  getCollectionData(): Observable<completeStory[]> {
    return this.http.get<completeStory[]>(
      'https://japansio.info/api/getCollectionData.php'
    );
  }

  ListFineTunes(token: string): Observable<FineTuneResponse> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.get<FineTuneResponse>(
      'https://api.openai.com/v1/fine-tunes',
      httpOptions
    );
  }

  createFineTUne(token: string, id: string): Observable<FineTune> {
    let body = {
      training_file: id,
      model: 'davinci',
      suffix: 'fifi',
    };

    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.post<FineTune>(
      'https://api.openai.com/v1/fine-tunes',
      body,
      httpOptions
    );
  }

  getFineTune(token: string, ftid: string): Observable<FineTune> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.get<FineTune>(
      'https://api.openai.com/v1/fine-tunes/' + ftid,
      httpOptions
    );
  }

  cancelFineTune(token: string, ftid: string): Observable<FineTune> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.post<FineTune>(
      'https://api.openai.com/v1/fine-tunes/' + ftid + '/cancel',
      '',
      httpOptions
    );
  }

  getModelList(token: string): Observable<ModelList> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.get<ModelList>(
      'https://api.openai.com/v1/models',
      httpOptions
    );
  }

  saveImage(data: string): Observable<any> {
    let body = new FormData();
    body.append('base64Data', data);

    return this.http.post<any>(
      'https://japansio.info/fifi/saveimage.php',
      body
    );
  }

  getImage(prompt: string, token: string): Observable<ImageAI> {
    let body = {
      prompt: prompt,
      n: 2,
      size: '512x512',
      response_format: 'b64_json',
    };

    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      }),
    };

    return this.http.post<ImageAI>(
      'https://api.openai.com/v1/images/generations',
      body,
      httpOptions
    );
  }
}
