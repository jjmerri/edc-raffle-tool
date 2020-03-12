import { Observable } from 'rxjs/Observable';
import { AsyncPipe } from '@angular/common';
import { Pipe, ChangeDetectorRef } from '@angular/core';

// tslint:disable-next-line: use-pipe-transform-interface
@Pipe({
  name: 'timeAgo',
  pure: false,
})
export class TimeAgoPipe extends AsyncPipe {
  value: number;
  ß;
  timer: Observable<string>;

  constructor(ref: ChangeDetectorRef) {
    super(ref);
  }

  transform(obj: any, args?: any[]): any {
    this.value = obj;

    if (!this.timer) {
      this.timer = this.getObservable();
    }

    return super.transform(this.timer);
  }

  private getObservable() {
    return Observable.interval(10000)
      .startWith(0)
      .map(() => {
        let result: string;
        // current time
        const now = new Date().getTime();

        // time since message was sent in seconds
        const delta = (now - this.value) / 1000;

        // format string
        if (delta < 10) {
          result = 'Just now';
        } else if (delta < 60) {
          // sent in last minute
          result = Math.floor(delta) + ' seconds ago';
        } else if (delta < 3600) {
          // sent in last hour
          result = Math.floor(delta / 60) + ' minutes ago';
        } else if (delta < 86400) {
          // sent on last day
          result = Math.floor(delta / 3600) + ' hours ago';
        } else {
          // sent more than one day ago
          result = Math.floor(delta / 86400) + ' days ago';
        }
        return result;
      });
  }
}
