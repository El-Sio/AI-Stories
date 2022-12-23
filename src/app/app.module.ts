import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppInitService } from './app-init.service';
import { HttpClientModule } from '@angular/common/http';
import { OpenaiService } from './openai.service';
import { AppComponent } from './app.component';
import { StoryPageComponent } from './story-page/story-page.component';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthGuard } from './auth-guard.service';

export function initializeApp(appInitService: AppInitService) {
  return (): Promise<any> => {
    return appInitService.load();
  };
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot([
      { path: 'login', component: LoginComponent },
      {
        path: 'story',
        component: StoryPageComponent,
        canActivate: [AuthGuard],
      },
      { path: '**', component: LoginComponent },
    ]),
    BrowserAnimationsModule,
  ],
  declarations: [AppComponent, StoryPageComponent],
  bootstrap: [AppComponent],
  providers: [
    AppInitService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitService],
      multi: true,
    },
    // makes sure to load config before the app initializes
    OpenaiService,
    AuthGuard,
  ],
})
export class AppModule {}
