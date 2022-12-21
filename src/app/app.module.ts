import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';
import { OpenaiService } from './openai.service';
import { AppComponent } from './app.component';
import { StoryPageComponent } from './story-page/story-page.component';

@NgModule({
  imports: [BrowserModule, FormsModule, HttpClientModule],
  declarations: [AppComponent, StoryPageComponent],
  bootstrap: [AppComponent],
  providers: [OpenaiService],
})
export class AppModule {}
