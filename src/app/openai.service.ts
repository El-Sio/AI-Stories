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

  UploadFile(token: string, file: string): Observable<TrainingFiles> {
    let fileblob = new Blob([file], {
      type: 'text/plain; charset=utf8',
    });

    let body = new FormData();

    body.append('purpose', 'fine-tune');
    body.append('file', fileblob, 'myTrainingFile.jsonl');

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
    token: string
  ): Observable<Completion> {
    let body = {
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 2500,
      temperature: temp,
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

  overwriteTrainingData(data: string): Observable<any> {
    return this.http.post(
      'https://japansio.info/api/overwriteTrainingData.php',
      data
    );
  }

  getTrainingData(): Observable<TraningData[]> {
    return this.http.get<TraningData[]>(
      'https://japansio.info/api/getTrainingData.php'
    );
  }

  getImage(prompt: string, token: string): Observable<ImageAI> {
    let body = {
      prompt: prompt,
      n: 2,
      size: '512x512',
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
