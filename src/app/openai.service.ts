import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ImageAI, Completion } from './data-model';
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
