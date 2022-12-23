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

  private token = AppInitService.settings.secret;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.token,
    }),
  };

  getToken(): Observable<JSON> {
    return this.http.get<JSON>('https://japansio.info/api/secret.json');
  }

  testCall(): Observable<JSON> {
    return this.http.get<JSON>(
      'https://api.openai.com/v1/models',
      this.httpOptions
    );
  }

  login(creds: User): Observable<Authent> {
    return this.http.post<Authent>(
      'https://japansio.info/api/access.php',
      JSON.stringify(creds)
    );
  }

  getCompletion(prompt: string): Observable<Completion> {
    let body = {
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1500,
      temperature: 0.5,
    };
    return this.http.post<Completion>(
      'https://api.openai.com/v1/completions',
      body,
      this.httpOptions
    );
  }

  getImage(prompt: string): Observable<ImageAI> {
    let body = {
      prompt: prompt,
      n: 2,
      size: '512x512',
    };
    return this.http.post<ImageAI>(
      'https://api.openai.com/v1/images/generations',
      body,
      this.httpOptions
    );
  }
}
