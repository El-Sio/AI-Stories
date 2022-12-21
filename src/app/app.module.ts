import { NgModule,  APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppInitService } from './app-init.service';
import { HttpClientModule } from '@angular/common/http';
import { OpenaiService } from './openai.service';
import { AppComponent } from './app.component';
import { StoryPageComponent } from './story-page/story-page.component';

export function initializeApp(appInitService: AppInitService) {
  return (): Promise<any> => {
    return appInitService.load();
  };
}

@NgModule({
  imports: [BrowserModule, FormsModule, HttpClientModule],
  declarations: [AppComponent, StoryPageComponent],
  bootstrap: [AppComponent],
  providers: [AppInitService,
    { provide: APP_INITIALIZER, useFactory: initializeApp, deps: [AppInitService], multi: true},
    // makes sure to load config before the app initializes
    OpenaiService],
})
export class AppModule {}
