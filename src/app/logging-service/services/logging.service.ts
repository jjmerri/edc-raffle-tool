import { Injectable } from '@angular/core';
import { LogglyService } from 'ngx-loggly-logger';

@Injectable()
export class LoggingService {
  public currentRaffle = null;
  public userName = null;
  public sessionId: string;

  constructor(private logglyService: LogglyService) {
    this.sessionId = logglyService.uuid();
    this.logglyService.push({
      logglyKey: 'c533a0e8-2a33-4aeb-8a76-fbf26387621e',
      sendConsoleErrors: true, // Optional set true to send uncaught console errors
      tag: 'raffletool',
    });
    this.logglyService.push({
      session_id: this.sessionId,
    });
  }

  public logMessage(message: string, loggingLevel: string) {
    let name = null;
    let subreddit = null;
    if (this.currentRaffle) {
      name = this.currentRaffle.name;
      subreddit = this.currentRaffle.subreddit;
    }

    const loggingInfo = {
      message: message,
      raffleId: name,
      subreddit: subreddit,
      userName: this.userName,
      loggingLevel: loggingLevel,
    };

    this.logglyService.push(loggingInfo);
  }

  public setCurrentRaffle(currentRaffle: any) {
    this.currentRaffle = currentRaffle;
  }

  public setUserName(userName: string) {
    this.userName = userName;
  }
}
