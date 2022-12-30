import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User, Authent } from './data-model';

export interface IAppConfig {
  Login_URL: string;
}

@Injectable()
export class AppInitService {
  static currentUser: Authent;
  static settings: IAppConfig;

  constructor(private http: HttpClient) {}

  load() {
    return new Promise<void>((res, rej) => {
      AppInitService.settings = <IAppConfig>{
        Login_URL: 'https://japansio.info/api/access.php',
      };
      console.log('Config Loaded');
      res();
    });
  }
}
