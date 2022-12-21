import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Choice, Completion } from './data-model';

@Injectable()
export class OpenaiService {
  constructor(private http: HttpClient) {}

  private token = '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';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.token,
    }),
  };

  testCall(): Observable<JSON> {
    return this.http.get<JSON>(
      'https://api.openai.com/v1/models',
      this.httpOptions
    );
  }

  getCompletion(prompt: string): Observable<Completion> {
    let body = {
      model: 'text-davinci-002',
      prompt: prompt,
      max_tokens: 20,
      temperature: 0.5,
    };
    return this.http.post<Completion>(
      'https://api.openai.com/v1/completions',
      body,
      this.httpOptions
    );
  }
}
