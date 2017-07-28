import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  raffleParticipants = [];
  numSlots = 20;
  randomSlot: number;
  commentText: string;
  unpaidUsers: string;
  ngOnInit() {
    this.updateRaffleSpots(this.numSlots);
  }

  public updateRaffleSpots(updatedNumSplots: number) {
    const prevSpots = this.raffleParticipants.length;
    if (updatedNumSplots > prevSpots) {
      for ( let x = prevSpots; x < updatedNumSplots; x++) {
        this.raffleParticipants[x] = {};
      }
    } else if (updatedNumSplots < prevSpots) {
      this.raffleParticipants.splice(updatedNumSplots, prevSpots - updatedNumSplots);
    }

    let commentControl: any = document.getElementById('commentText');
    commentControl.rows = this.numSlots * 2 + 1;

    this.updateCommentText();
  }

  public generateRandom() {
    let openRaffleSpots = [];
    for (let x = 0; x < this.raffleParticipants.length; x++) {
      if (!this.raffleParticipants[x].name) {
        openRaffleSpots.push(x + 1);
      }
    }
    let min = 0;
    let max = openRaffleSpots.length - 1;
    let randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    this.randomSlot = openRaffleSpots[randomNum];

    document.getElementById('raffleParticipant' + (this.randomSlot - 1)).focus();
  }

  public updateCommentText() {
    this.commentText = '';
    this.unpaidUsers = '';

    for (let x = 0; x < this.raffleParticipants.length; x++) {
      let raffler = this.raffleParticipants[x];
      this.commentText += ( x + 1) + ' ' + (raffler.name ? '/u/' + raffler.name + ' ' : '') + (raffler.paid ? ' **PAID**' : '') + '\n\n';
      this.unpaidUsers += !raffler.paid && raffler.name && this.unpaidUsers.indexOf('/u/' + raffler.name + ' ' ) === -1 ? '/u/' + raffler.name + ' ' : '';
    }

  }

  public copyText(elementId: string) {
    let commentControl: any = document.getElementById(elementId);
    commentControl.select();
    document.execCommand('copy');
  }
}
