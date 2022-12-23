import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User, Authent } from './data-model';

export interface IAppConfig {
  secret: string;
}

@Injectable()
export class AppInitService {
  static currentUser: Authent;
  static settings: IAppConfig;

  constructor(private http: HttpClient) {}

  load() {
    return new Promise<void>((res, rej) => {
      this.http
        .get<IAppConfig>('https://japansio.info/api/secret.json')
        .subscribe((x) => {
          AppInitService.settings = <IAppConfig>x;
          console.log('Config Loaded');
          res();
        }),
        (err) => {
          console.log('could not load the config file');
        };
    });
  }
}
