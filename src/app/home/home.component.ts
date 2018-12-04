import {LoggingLevel} from '../shared/logging-level';

declare var fuckAdBlock: FuckAdBlock;

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {Modal, BSModalContext} from 'ngx-modialog/plugins/bootstrap';
import {overlayConfigFactory} from 'ngx-modialog';
import {Observable} from 'rxjs/Observable';
import {environment} from '../../environments/environment';
import {FuckAdBlock} from 'fuckadblock';
import {Md5} from 'ts-md5/dist/md5';
import { AngularFireStorage } from '@angular/fire/storage';

import 'rxjs/Rx';
import swal2 from 'sweetalert2';
import * as he from 'he';

// fix for payment helper issue sweetalert_1.default not a function in reddit service
// https://github.com/t4t5/sweetalert/issues/799
import * as _swal from 'sweetalert';
import { SweetAlert } from 'sweetalert/typings/core';
const swal: SweetAlert = _swal as any;

import {OauthService} from '../oauth/services/oauth.service';
import {RedditService} from '../reddit/services/reddit.service';
import {DatabaseService} from '../database/services/database.service';
import {SlotConfirmationModalComponent} from './slot-confirmation.modal.component';
import {RafflePickerModalComponent} from './raffle-picker.modal.component';
import {TermsOfServiceModalComponent} from './terms-of-service.modal.component';
import {LogglyService} from 'ngx-loggly-logger';
import {NotificationService} from '../notification/services/notification.service';
import {LoggingService} from '../logging-service/services/logging.service';
import {RaffleProperties} from './RaffleProperties';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    private readonly MAX_SUBMISSION_LENGTH = 40000;

    private raffleParticipants = [{name: '', paid: false, requester: ''}];
    private numSlots = 1;
    private randomSlot: number;
    private commentText: string;
    private unpaidUsers: string;
    private unpaidUsersArray = [];
    private userName: string;
    private userId: string;
    private currentRaffle;
    private raffleImported = false;
    private calledSpotMessageShown = false;
    private payPalMessageShown = false;
    private paidPopoverProperties = {};
    private closePopOver = false;
    private numOpenSlots = this.numSlots;
    private payPalInfo: string;
    private payPalPmMessage = 'Thank you for participating in the raffle.\n\n' +
        '**Please reply to this message in this format:**\n\n' +
        '*Raffle:*\n\n' +
        '*Spot Numbers:*\n\n' +
        '*PayPal Name:*\n\n' +
        '*PayPal Email:*\n\n' +
        '**Please submit your payment using Friends and Family and leave nothing in the notes or comments.**\n\n' +
        '**Please find my PayPal info below:**\n\n';
    private popUpTimer: any;
    private confirmedComments = [];
    private shownNewFeatureMessageSlotAssignmentHelper = false;
    private hasNewFeature = false;
    private isModtober = false;
    private raffleToolUri = environment.redirectUri;
    private tosKey = 'showTermsOfService_09182017';
    private numPayPmsProcessed = 0;
    private botUsername = 'callthebot';
    private inOrderMode = false;
    private autoUpdateFlair = false;
    private raffleProperties: RaffleProperties = new RaffleProperties();

    private collectingPaymentsFlairId: string;
    private customRainbowFlairId: string;
    private completeFlairId: string;
    private canEditFlair = false;

    private readonly permalinkPlaceholder = '{announcementPermalink}';
    private botCalled = false;
    private paypalPmRecipients = [];
    private showAdBlockerMessage = true;
    private hasSeenTermsOfService = false;
    private modToolsId = '';
    private chatMessages: any[];
    private isSlotAssignmentHelperRunning = false;
    private interuptSlotAssignmentHelper = false;
    private haveShownModChatMessage = false;
    private redirectUrl = environment.baseUri + '/redirect?redirectUrl=';
    private modToolsDiscordUrl = null;
    private notificationSettings = null;
    private publicRedditUrl = 'https://www.reddit.com';

    private mods = {
        lego_raffles: ['viljedi', 'legorafflemod', 'Zunger', 'Nathan_Lego_Raffles'],
        WatchURaffle: ['WatchRaffleAdmin', 'wurMod', 'WatchRaffleMod', 'WatchRaffleMod2', 'WatchRaffleMod3'],
        testingground4bots: ['raffleTestMod1', 'raffleTestMod2', 'raffleTestMod3', 'raffleTestMod4'],
        KnifeRaffle: ['Plazzed', 'accidentlyporn', 'theoddjosh', 'Fbolanos', 'Zangadia', 'TheVector', 'NoProfile7',
            'Walt_the_White', 'slumblor'],
        SSBM: ['UNKNOWN'],
        RocketLeagueExchange: ['UNKNOWN'],
        raffleTest: ['BoyAndHisBlob']
    };

    constructor(private activatedRoute: ActivatedRoute, private oauthSerice: OauthService,
                private redditService: RedditService, private modal: Modal, private databaseService: DatabaseService,
                private loggingService: LoggingService, private notificationService: NotificationService,
                private angularFireStorage: AngularFireStorage, private http: HttpClient) {
    }

    ngOnInit() {
        this.loadStorage();
        if (!this.hasSeenTermsOfService) {
            this.showTermsOfService();
        }
        this.configureAdblockerCheck();

        this.activatedRoute.queryParams.subscribe((params: Params) => {
            if (params['code']) {
                this.oauthSerice.requestAccessToken(params['code'], params['state']).subscribe(res => {
                    if (res.success === true) {
                        this.loadRaffle();
                    } else {
                        this.loggingService.logMessage('error retrieving access token', LoggingLevel.ERROR);
                        console.error('error retrieving access token', res);
                    }

                });
            }

            if (params['modtober_subreddit']) {
                this.showModtoberModMessage(params['modtober_subreddit']);
            }
        });
        this.updateRaffleSlots(this.numSlots);
    }

    private updateRaffleSlots(updatedNumSlots: number) {
        const prevSpots = this.raffleParticipants.length;
        let lossOfData = false;
        for (let i = updatedNumSlots; i < prevSpots; i++) {
            if (this.raffleParticipants[i].name) {
                lossOfData = true;
                break;
            }
        }

        if (lossOfData && updatedNumSlots < prevSpots) {
            swal2({
                title: 'Are You Sure You Want To Reduce The Number Of Slots?',
                text: 'Reducing the number of slots right now will cause you to lose slots that have already been assigned. ' +
                'To continue click "Reduce Slots" below, otherwise click "Cancel".',
                type: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Reduce Slots'
            }).then((result) => {
                if (result.value) {
                    this.updateNumberOfSlots(updatedNumSlots);
                } else if (result.dismiss) {
                    this.numSlots = prevSpots;
                }
            });
        } else {
            this.updateNumberOfSlots(updatedNumSlots);
        }
    }

    private updateNumberOfSlots(updatedNumSlots: number) {
        const prevSpots = this.raffleParticipants.length;

        if (updatedNumSlots > prevSpots) {
            for (let x = prevSpots; x < updatedNumSlots; x++) {
                this.raffleParticipants[x] = {name: '', paid: false, requester: ''};
            }
        } else if (updatedNumSlots < prevSpots) {
            this.raffleParticipants.splice(updatedNumSlots, prevSpots - updatedNumSlots);
        }

        const commentControl: any = document.getElementById('commentText');
        commentControl.rows = this.numSlots * 2 + 1;

        this.updateCommentText();
    }

    private generateRandom() {
        this.getRandomUnclaimedSlotNumber().subscribe(randomSlot => {
            if (randomSlot) {
                this.randomSlot = randomSlot;
                document.getElementById('raffleParticipant' + (randomSlot - 1)).focus();
            }
        });
    }

    private getRandomUnclaimedSlotNumber(): Observable<any> {
        return Observable.create(observer => {
            const openRaffleSlots = [];
            for (let x = 0; x < this.raffleParticipants.length; x++) {
                if (!this.raffleParticipants[x].name) {
                    openRaffleSlots.push(x + 1);
                }
            }
            if (openRaffleSlots.length > 0) {
                const min = 0;
                const max = openRaffleSlots.length - 1;
                const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
                observer.next(openRaffleSlots[randomNum]);
                observer.complete();
            } else {
                observer.next(0);
                observer.complete();
            }
        });
    }

    private getNextUnclaimedSlotNumbers(numRequestedSlots: number): Observable<any> {
        return Observable.create(observer => {
            const openRaffleSlots = [];
            let numFoundSlots = 0;
            for (let x = 0; x < this.raffleParticipants.length; x++) {
                if (!this.raffleParticipants[x].name) {
                    openRaffleSlots.push(x + 1);
                    numFoundSlots++;
                    if (numFoundSlots === numRequestedSlots) {
                        break;
                    }
                }
            }

            // add remaining slots
            for (let i = numFoundSlots; i < numRequestedSlots; i++) {
                this.numSlots++;
                openRaffleSlots.push(this.numSlots);
                numFoundSlots++;
            }

            this.updateRaffleSlots(this.numSlots);

            observer.next(openRaffleSlots);
            observer.complete();
        });
    }

    public updateCommentText() {
        let numSlotsTaken = 0;
        let numUnpaidUsers = 0;
        this.commentText = '';
        this.unpaidUsers = '';
        this.unpaidUsersArray = [];

        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name) {
                raffler.name = raffler.name.replace(new RegExp(' ', 'g'), '');
                raffler.name = raffler.name.replace(new RegExp('/[uU]/', 'g'), '');

                numSlotsTaken++;
            }
            this.commentText += ( x + 1) + ' ' + (raffler.name ? '/u/' + raffler.name + ' ' : '') +
                (raffler.paid ? '**PAID**' : '') + '\n\n';

            if (!raffler.paid && raffler.name && this.unpaidUsers.indexOf('/u/' + raffler.name + ' ') === -1) {
                numUnpaidUsers++;
                this.unpaidUsers += '/u/' + raffler.name + ' ';
                this.unpaidUsersArray.push(raffler.name);
            }
        }

        this.numOpenSlots = this.numSlots - numSlotsTaken;


        if (this.currentRaffle) {
            this.redditService.getSubmission(this.currentRaffle.permalink + '.json').subscribe(getSubmissionResponse => {
                    this.currentRaffle = getSubmissionResponse[0].data.children[0].data;
                    const re = /<raffle-tool>[\s\S]*<\/raffle-tool>/;
                    const escapedRe = /\\<raffle\\-tool\\>[\s\S]*\\<\/raffle\\-tool\\>/;


                    let txt: any;
                    let flairText = '';
                    let flairId = '';
                    txt = document.createElement('textareatmp');
                    txt.innerHTML = this.currentRaffle.selftext;
                    let postText = txt.innerText;

                    let slotText = this.getSlotListText(this.numOpenSlots, numUnpaidUsers, this.commentText);

                    if (postText.indexOf('<raffle-tool>') !== -1 && postText.indexOf('</raffle-tool>') !== -1) {
                        postText = postText.replace(re, slotText);
                    } else if (postText.indexOf('\\<raffle\\-tool\\>') !== -1 && postText.indexOf('\\</raffle\\-tool\\>') !== -1) {
                        postText = postText.replace(escapedRe, slotText);
                    } else {
                        postText += '\n\n' + slotText + '\n\n';
                    }

                    if (postText.length > this.MAX_SUBMISSION_LENGTH) {
                        const ref = this.angularFireStorage.ref('slot_lists/' + this.currentRaffle.name);
                        ref.putString(slotText, 'raw', {contentType: 'text/plain'}).then( snapshot => {
                            ref.getDownloadURL().subscribe(url => {
                                this.raffleProperties.slotListFileDownloadUrl = url;
                                this.updateRaffleProperties();
                                slotText = this.getSlotListText(this.numOpenSlots, numUnpaidUsers,
                                    'The slot list contains ' + this.numSlots + ' slots ' +
                                    'and is too large to post. The current slot list can be found [here.](' + url + ')');
                                postText = postText.replace(re, slotText);
                                this.redditService.updatePostText(postText, this.currentRaffle.name)
                                    .subscribe(postResponse => {
                                        },
                                        err => {
                                            this.loggingService.logMessage('updatePostText over MAX:' +
                                                JSON.stringify(err), LoggingLevel.ERROR);
                                            console.error(err);
                                        }
                                    );
                            });
                        });
                    } else {
                        this.redditService.updatePostText(postText, this.currentRaffle.name)
                            .subscribe(postResponse => {
                                },
                                err => {
                                    this.loggingService.logMessage('updatePostText:' + JSON.stringify(err), LoggingLevel.ERROR);
                                    console.error(err);
                                }
                            );
                    }

                    if (this.inOrderMode) {
                        flairText = 'In Progress';
                        flairId = this.customRainbowFlairId;
                    } else if (this.numOpenSlots === 0 && numUnpaidUsers === 0) {
                        flairText = 'Ready To Summon RNGesus!';
                        flairId = this.customRainbowFlairId;
                    } else if (this.numOpenSlots === 0 && numUnpaidUsers !== 0) {
                        flairText = 'Collecting Payments';
                        flairId = this.collectingPaymentsFlairId;
                    } else {
                        flairText = (this.raffleProperties.customFlair ? this.raffleProperties.customFlair + ' - ' : '') + this.numOpenSlots + ' Slots Left';
                        flairId = this.customRainbowFlairId;
                    }

                    this.updateFlair(flairId, flairText);

                    this.loggingService.logMessage(this.commentText, LoggingLevel.SLOT_LIST)

                    // prevents overwriting the saved participant list when it hasn't been fully loaded from an import yet
                    if (this.hasRequesters(this.raffleParticipants)) {
                        this.databaseService.storeRaffleParticipants(this.userId, this.currentRaffle.name, this.raffleParticipants).subscribe();
                    }

                },
                err => {
                    this.loggingService.logMessage('getSubmission:' + JSON.stringify(err), LoggingLevel.ERROR);
                    console.error(err);
                }
            );
        }

    }

    public copyText(elementId: string) {
        const commentControl: any = document.getElementById(elementId);
        commentControl.select();
        document.execCommand('copy');
    }

    public linkWithReddit() {
        this.oauthSerice.requestPermission();
    }

    public importRaffleSlots(raffle: any) {
        const postSlotListRe = /<raffle-tool>[\s\S]*<\/raffle-tool>/;
        // const externalSlotListRe = /<raffle-tool>[\s\S]*The current slot list can be found[\s\S]*<\/raffle-tool>/;
        const externalSlotListRe = /<raffle-tool>[\s\S]*\[here.\]\(([^)]+)\)[\s\S]*<\/raffle-tool>/;
        let txt: any;
        txt = document.createElement('textareatmp');
        let postMatches: any;
        let externalMatches: any;
        if (raffle.selftext_html) {
            txt.innerHTML = he.decode(raffle.selftext_html);
            const markup = he.decode(raffle.selftext);
            const postText = txt.innerText;
            postMatches = postText.match(postSlotListRe);
            externalMatches = markup.match(externalSlotListRe);
        }

        if (externalMatches) {
            const headers = new HttpHeaders({});
            headers.append('Accept', 'text/plain');
            return this.http.get(externalMatches[1], {headers: headers, responseType: 'text'}).subscribe(slotList => {
                this.loadSlotList(slotList.toString());
            }, err => {
                console.error(err);
            });
        } else if (postMatches) {
            this.loadSlotList(postMatches[0]);
        }
    }

    private loadSlotList(slotList: string) {
        this.raffleParticipants = [];
        const slots = slotList.split('\n');
        let numSlots = 0;

        for (let i = 0; i < slots.length; i++) {
            if (slots[i].match(/^[\d]+ ?/)) {
                numSlots++;
                const slotParts = slots[i].split(' ');

                if (slotParts[1]) {
                    let paidString = '';
                    if (slotParts[2]) {
                        paidString = slotParts[2];
                    }

                    const usernameRegexp = /\/?[uU]\/([^ ]*)/g;
                    const matchedUsername = usernameRegexp.exec(slotParts[1]);

                    this.raffleParticipants.push({name: matchedUsername[1], paid: paidString.toLowerCase().indexOf('paid') !== -1,  requester: ''});
                } else {
                    this.raffleParticipants.push({name: '', paid: false, requester: ''});
                }
            }
        }

        if (numSlots <= 1) {
            swal2('Raffle failed to import!',
                'The raffle importer detected < 2 slots which is not a valid raffle! ' +
                'This could be due to browser compatibility issues. ' +
                'Please try to link again and if you get the same error try a different browser. ' +
                'DO NOT UPDATE YOUR RAFFLE BEFORE RELINKING! You could delete your slot list!',
                'error'
            );
        } else {
            this.numSlots = numSlots;

            this.updateRaffleSlots(numSlots);
            this.raffleImported = true;
        }

        this.setRequesters();
    }

    private getSlotListText(numOpenSlots, numUnpaidUsers, slotList): string {
        return '<raffle-tool>\n\n' +
        'Number of vacant slots: ' + numOpenSlots + '\n\n' +
        'Number of unpaid users: ' + numUnpaidUsers + '\n\n' +
        'This slot list is created and updated by ' +
        '[The EDC Raffle Tool](https://edc-raffle-tool.firebaseapp.com) by BoyAndHisBlob.\n\n' +
            slotList + '\n\n</raffle-tool>';
    }

    private checkCalledSpot(event: any) {
        if (!this.calledSpotMessageShown &&
            event.target.value === '' && (!this.randomSlot ||
                (event.target.id !== 'raffleParticipant' + (this.randomSlot - 1)))) {

            swal2('Are Called Slots Allowed?',
                'It looks like you are trying to fill a slot that isnt random. ' +
                'Please double check that your raffle allows called slots. You wont get this message again.',
                'question'
            );

            this.calledSpotMessageShown = true;
        }
    }

    private updateAffectedSlots(name: string, event: any) {
        let numAffected = 1;

        this.closePopOver = false;

        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && (raffler.name.toUpperCase() === name.toUpperCase())) {
                if (raffler.paid !== event.target.checked) {
                    raffler.paid = event.target.checked;
                    numAffected++;
                }
            }
        }

        this.paidPopoverProperties = {numAffected: numAffected, paid: event.target.checked};

        this.updateCommentText();

        // close popOver after 3 seconds
        clearInterval(this.popUpTimer);
        this.popUpTimer = setInterval(() => {
            this.closePopOver = true;
            clearInterval(this.popUpTimer);
        }, 3000);

    }

    private showPayPalWarning(event: any) {
        if (!this.payPalMessageShown) {
            swal2('',
                'Entering your PayPal info will cause <strong>PMs to be sent</strong> to participants as you add them to the slot list. ' +
                'Only newly added participants will be PM\'d. You won\'t get this message again.</br></br>' +
                '<strong>Example PM:</strong></br>' + this.payPalPmMessage + '</br>https://www.paypal.me/yourname',
                'info'
            );
            this.payPalMessageShown = true;
        }
    }

    private sendPayPalPm(recipient: string) {
        if (recipient && this.payPalInfo && this.paypalPmRecipients.indexOf(recipient.toUpperCase()) === -1
            && ((this.currentRaffle.subreddit !== 'testingground4bots' && this.currentRaffle.subreddit !== 'raffleTest') || this.userName.toUpperCase() === recipient.toUpperCase())) {

            let payPalFormatted = this.payPalInfo;
            const ppRegEx = new RegExp('(paypal\.me)', 'i');
            if (ppRegEx.test(this.payPalInfo)) {
                payPalFormatted = '[' + this.payPalInfo + '](' + this.redirectUrl + this.payPalInfo + ')';
            }

            const subject = 'PayPal Info For: ' + this.currentRaffle.title;
            this.redditService.sendPm(recipient, subject.substr(0, 100),
                this.payPalPmMessage + payPalFormatted +
                '\n\n^^^.\n\n^(Message auto sent from The EDC Raffle Tool by BoyAndHisBlob.)\n\n').subscribe(res => {
            }, err => {
                    this.loggingService.logMessage('sendPm:' + JSON.stringify(err), LoggingLevel.ERROR);
                    console.error(err);

                    swal2(
                        'Error Sending PayPal PM!',
                        'There was an error sending the PayPal PM to ' + recipient +
                        ' Please send them a PM manually.',
                        'error'
                    );
                });
            this.paypalPmRecipients.push(recipient.toUpperCase());
            this.databaseService.storePaypalPmRecipients(this.userId, this.currentRaffle.name, this.paypalPmRecipients).subscribe(res => {
            });
        }
    }

    private donateSlot() {
        const commentText = 'I am donating a random slot to /u/BoyAndHisBlob as a thank you for creating and maintaining the Raffle Tool.' +
            '\n\nThis slot request will be processed in the order it was received in the queue.';

        if (this.currentRaffle) {
            swal2({
                title: 'Donate Slot?',
                html: 'This will post the below comment to your raffle. Thank you for donating!<br /><br />' + '<i>' + commentText + '</i>',
                type: 'info',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Donate Slot'
            }).then((result) => {
                if (result.value) {
                    this.redditService.postComment(commentText, this.currentRaffle.name).subscribe();

                    swal2(
                        'Donation Comment Posted!',
                        'Please process the slot request in the order it was recieved in the queue and thank you again for your generosity!',
                        'success'
                    );
                }
            });
        }
    }

    private runPaymentConfirmer() {
        this.numPayPmsProcessed = 0;
        this.redditService.getPmsAfter(this.currentRaffle.created_utc).subscribe(messages => {
            if (messages && messages.length) {
                try {
                    this.showPm(messages, messages.length - 1);
                } catch (err) {
                    this.loggingService.logMessage('runPaymentConfirmer stack:' + JSON.stringify(err.stack), LoggingLevel.ERROR);
                    this.loggingService.logMessage('runPaymentConfirmer messages:' + JSON.stringify(messages), LoggingLevel.ERROR);
                    console.error(err);
                    swal2(
                        'Error Running Payment Confirmer!',
                        'Please wait a few minutes and try again. ' +
                        'If the issue persists send a PM to BoyAndHisBlob and confirm payments manually.',
                        'error'
                    );
                }
            } else {
                this.showNoUnpaidPms();
            }
        },
            err => {
                this.loggingService.logMessage('getPmsAfter:' + JSON.stringify(err), LoggingLevel.ERROR);
                console.error(err);

                swal2(
                    'Error Retrieving PMs!',
                    'There was an error retrieving your PMs. This could be an issue with Reddit. ' +
                    'Try again and if the error persists please let BoyAndHisBlob know so he can check the logs.',
                    'error'
                );

            });
    }

    private showPm(messages: any, messageIndex: number) {
        if (messageIndex < 0) {
            if (this.numPayPmsProcessed > 0) {
                // check if we received any new pms since we started checking pms
                this.runPaymentConfirmer();
            } else {
                this.showNoUnpaidPms();
            }
            return;
        } else if (!messages[messageIndex].data.author) {
            this.showPm(messages, messageIndex - 1);
            return;
        }

        const message = messages[messageIndex];
        const slotNumberMap = this.getSlotNumberMap(message.data.author);
        const authorPaid = this.isUserPaid(message.data.author);
        const numTotalSlotsUnpaidRequested = this.getNumUnpaidRequestedSlots(message.data.author);
        const pmReplyElementName = 'pmReplyTextArea';

        let authorHasSlots = false;
        let authorRequestedForAnother = false;

        let txt: any;
        txt = document.createElement('temptxt');
        txt.innerHTML = message.data.body_html;

        let dialogText = '';
        let numTotalSlotsRequested = 0;

        for (const slotOwner of Array.from( slotNumberMap.keys()) ) {
            const numSlotsForOwner = slotNumberMap.get(slotOwner);

            if (slotOwner.toUpperCase() === message.data.author.toUpperCase()) {
                authorHasSlots = true;
            } else {
                authorRequestedForAnother = true;
            }

            dialogText += '<li class="list-group-item text-left">' + slotOwner +
                '<span class="badge badge-default badge-pill">' + numSlotsForOwner + '</span>' +
                '</li>';

            numTotalSlotsRequested += numSlotsForOwner;
        }

        let requestedSlotHtml = '<h3 class="text-left">From: ' + message.data.author + ' (' + numTotalSlotsUnpaidRequested + ' unpaid of ' + numTotalSlotsRequested + ' total requested slots)</h3>' +
            '<h3 class="text-left">Subject: ' + message.data.subject + '</h3>';

        if (authorRequestedForAnother) {
            requestedSlotHtml +=  '<h4 class="text-left"> Requested Slots:</h4>' +
                '<ul class="list-group col-xs-9">' + dialogText + '</ul>';
        }

        requestedSlotHtml += ' <h4 class="text-left col-xs-12">Message Body:</h4> <div class="well text-left col-xs-12">' + txt.innerText + '</div>';
        requestedSlotHtml +=    '<div class="col-xs-12">' +
                                    '<label for="' + pmReplyElementName + '">PM Reply (leave empty to not reply)</label>' +
                                    '<div class="col-xs-12 input-group">' +
                                        '<textarea class="form-control" style="min-width: 100%" id="' + pmReplyElementName + '" rows="3"></textarea>' +
                                    '</div>' +
                                '</div>';

        const contentDiv: any = document.createElement('div');
        contentDiv.innerHTML = requestedSlotHtml;

        if (slotNumberMap.size && !authorPaid && this.raffleProperties.skippedPms.indexOf(message.data.name) === -1) {
            this.loggingService.logMessage('slotNumberMap:' + JSON.stringify(slotNumberMap), LoggingLevel.INFO);
            this.loggingService.logMessage('message:' + JSON.stringify(message), LoggingLevel.INFO);

            this.numPayPmsProcessed++;
            swal({
                title: 'Unpaid Raffle Participant PMs',
                content: contentDiv,
                className: 'payment-confirmation-modal',
                buttons: {
                    markAll: {
                        text: 'Mark All ' + numTotalSlotsRequested + ' Requested Slots Paid',
                        value: 'markAll',
                        visible: authorRequestedForAnother,
                        className: 'btn-primary',
                        closeModal: true,
                    },
                    markUser: {
                        text: 'Mark User Paid',
                        value: 'markUser',
                        visible: authorHasSlots,
                        className: 'btn-primary',
                        closeModal: true,
                    },
                    skip: {
                        text: 'Skip PM',
                        value: 'skip',
                        visible: true,
                        className: 'swal-button--cancel btn-secondary',
                        closeModal: true
                    }
                }
            }).then((value) => {
                switch (value) {
                    case 'markAll':
                        this.markAllRequestedAsPaid(message.data.author);
                        break;
                    case 'markUser':
                        this.markAsPaid(message.data.author);
                        break;
                    case 'skip':
                        break;
                    default: // dont show any more PMs
                        return;
                }

                let replyTextArea: any;
                replyTextArea = document.getElementById(pmReplyElementName);

                if (replyTextArea.value) {
                    this.redditService.postComment(replyTextArea.value, message.data.name).subscribe(response => {
                    }, err => {
                        this.loggingService.logMessage('error sending PM Reply:' + JSON.stringify(err), LoggingLevel.ERROR);
                        console.error('error sending PM Reply:', err);
                    });
                }

                this.raffleProperties.skippedPms.push(message.data.name);
                this.updateRaffleProperties();

                this.showPm(messages, messageIndex - 1);
            });
        } else {
            this.showPm(messages, messageIndex - 1);
        }

    }

    private getNumberSlots(userName: string): number {
        let numUserSlots = 0;
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && (raffler.name.toUpperCase() === userName.toUpperCase())) {
                numUserSlots++;
            }

            if (x + 1 === this.raffleParticipants.length) {
                return numUserSlots;
            }
        }
    }

    private getSlotNumberMap(userName: string): Map<string, number> {
        const slotNumberMap = new Map();
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if ((raffler.name && raffler.name.toUpperCase() === userName.toUpperCase()) ||
                (raffler.requester && raffler.requester.toUpperCase() === userName.toUpperCase())
            )  {
                if (slotNumberMap.has(raffler.name)) {
                    slotNumberMap.set(raffler.name, slotNumberMap.get(raffler.name) + 1);
                } else {
                    slotNumberMap.set(raffler.name, 1);
                }
            }

            if (x + 1 === this.raffleParticipants.length) {
                return slotNumberMap;
            }
        }
    }

    private isUserPaid(userName: string): boolean {
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && !raffler.paid &&
                (raffler.name.toUpperCase() === userName.toUpperCase() ||
                    (raffler.requester && raffler.requester.toUpperCase() === userName.toUpperCase())
                )) {
                return false;
            }

            if (x + 1 === this.raffleParticipants.length) {
                return true;
            }
        }
    }

    private showNoUnpaidPms() {
        const allPaid = this.isAllPaid();

        if (allPaid) {
            swal2('All slots are marked paid, congrats on a successful raffle!',
                '',
                'info'
            );
        } else {
            swal2('No more PMs from unpaid raffle participants.',
                '',
                'info'
            );
        }
    }

    private markAsPaid(userName: string) {
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (raffler.name && (raffler.name.toUpperCase() === userName.toUpperCase())) {
                raffler.paid = true;
            }

            if (x + 1 === this.raffleParticipants.length) {
                this.updateCommentText();
            }
        }
    }

    private isAllPaid(): boolean {
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (!raffler.paid) {
                return false;
            }

            if (x + 1 === this.raffleParticipants.length) {
                return true;
            }
        }
    }

    private slotAssignmentWizard() {
        this.redditService.getTopLevelComments(this.currentRaffle.permalink, this.currentRaffle.name).subscribe(comments => {
            for (let x = 0; x < comments.length; x++) {
                if (comments[x].data.author === 'AutoModerator') {
                    comments.splice(x, 1);
                }
            }

            let nextCommentIndex = -1;
            for (let x = 0; x < comments.length; x++) {
                if (this.confirmedComments.indexOf(comments[x].data.name) === -1) {
                    nextCommentIndex = x;
                    break;
                }
            }
            if (nextCommentIndex >= 0) {
                this.showSlotAssignmentModal(comments, nextCommentIndex);
            } else {
                if (this.interuptSlotAssignmentHelper) {
                    this.showModChatMessage();
                } else {
                    swal2('',
                        'No more slot requests at this time. Check back later.',
                        'info'
                    );
                }

                this.isSlotAssignmentHelperRunning = false;
                this.interuptSlotAssignmentHelper = false;
            }
        }, err => {
            this.loggingService.logMessage('getTopLevelComments:' + JSON.stringify(err), LoggingLevel.ERROR);
            console.error(err);

            swal2(
                'Error Getting Post Comments!',
                'There was an error retrieving comments for your raffle. ' +
                'This could be a temporary Reddit issue. Wait a minute and try again. If the error persists please let BoyAndHisBlob know.',
                'error'
            );
        });
    }

    private showSlotAssignmentModal(comments: any, commentIndex: number) {
        this.isSlotAssignmentHelperRunning = true;
        if (this.interuptSlotAssignmentHelper) {
            this.interuptSlotAssignmentHelper = false;

            this.showModChatMessage();
        } else {
            this.modal.open(SlotConfirmationModalComponent,
                overlayConfigFactory({
                        isBlocking: true,
                        comment: comments[commentIndex],
                        callingComponent: this,
                        numOpenSlots: this.numOpenSlots,
                        inOrderMode: this.inOrderMode
                    },
                    BSModalContext))
                .then(dialogRef => {
                    dialogRef.result.then(result => {
                        this.loggingService.logMessage('result:' + JSON.stringify(result), LoggingLevel.INFO);
                        if (result && result.slotAssignments && result.slotAssignments.length > 0) {
                            this.loggingService.logMessage('comment:' + JSON.stringify(comments[commentIndex]), LoggingLevel.INFO);
                            this.sendConfirmationReply(this.assignSlots(result.slotAssignments), result.confirmationMessageText, comments[commentIndex].data.name, comments[commentIndex].data.author);
                        }

                        if (result) {
                            this.confirmedComments.push(comments[commentIndex].data.name);

                            this.databaseService.storeProcessedComments(this.userId, this.currentRaffle.name, this.confirmedComments).subscribe(res => {
                            },
                                err => {
                                    this.loggingService.logMessage('storeProcessedComments:' + JSON.stringify(err), LoggingLevel.ERROR);
                                    console.error(err);

                                    alert('There was an error marking the slot request as processed! ' +
                                        'To resolve this please close The Raffle Tool and relink to your raffle. ' +
                                        'You might have to process the slot request again. ' +
                                        'Check to see if the requested slots are in the tool after relinking. ' +
                                        'If not then process the request again like you normally would. ' +
                                        'Otherwise skip it since it was already processed.'
                                    );

                                });

                            if (commentIndex < comments.length - 1) {
                                this.showSlotAssignmentModal(comments, commentIndex + 1);
                            } else {
                                //check if more comments since start of wizard
                                this.slotAssignmentWizard();
                            }
                        } else {
                            this.isSlotAssignmentHelperRunning = false;
                            this.interuptSlotAssignmentHelper = false;
                        }
                    }).catch(error => {
                        this.isSlotAssignmentHelperRunning = false;
                        this.interuptSlotAssignmentHelper = false;
                    });
                });
        }
    }

    private assignSlots(slotAssignments: any): any {
        const assignedSlots = [];

        for (let i = 0; i < slotAssignments.length; i++) {
            const slotAssignment = slotAssignments[i];
            let slotsToAssignString = slotAssignment.calledSlots;

            assignedSlots.push({assignee: slotAssignment.username, calledSlots: [], randomSlots: [], inOrderSlots: []});

            if (slotsToAssignString) {
                slotsToAssignString = slotsToAssignString.replace(/\s+/g, '');
                const slotsToAssign = slotsToAssignString.split(',');
                for (let x = 0; x < slotsToAssign.length; x++) {
                    const calledSlot = slotsToAssign[x];
                    if (calledSlot) {
                        assignedSlots[i].calledSlots.push(+calledSlot);
                        this.assignSlot(slotAssignment.username, slotAssignment.requester ? slotAssignment.requester : slotAssignment.username, calledSlot, slotAssignment.donateSlot, false, false);
                        slotAssignment.donateSlot = false;
                    }
                }
            }
        }

        for (let i = 0; i < slotAssignments.length; i++) {
            const slotAssignment = slotAssignments[i];
            if (slotAssignment.randomSlots) {
                for (let x = 0; x < slotAssignment.randomSlots; x++) {
                    this.getRandomUnclaimedSlotNumber().subscribe(randomSlot => {
                        if (randomSlot) {
                            assignedSlots[i].randomSlots.push(randomSlot);
                            this.assignSlot(slotAssignment.username, slotAssignment.requester ? slotAssignment.requester : slotAssignment.username, randomSlot, slotAssignment.donateSlot, false, false);

                            slotAssignment.donateSlot = false;
                        }
                    });
                }
            }
        }

        for (let i = 0; i < slotAssignments.length; i++) {
            const slotAssignment = slotAssignments[i];
            if (slotAssignment.inOrderSlots) {
                this.getNextUnclaimedSlotNumbers(slotAssignment.inOrderSlots).subscribe(inOrderSlots => {
                    if (inOrderSlots) {
                        for (let j = 0; j < inOrderSlots.length; j++) {
                            const inOrderSlot = inOrderSlots[j];
                            assignedSlots[i].inOrderSlots.push(inOrderSlot);
                            this.assignSlot(slotAssignment.username, slotAssignment.requester ? slotAssignment.requester : slotAssignment.username, inOrderSlot, slotAssignment.donateSlot, false, false);
                        }
                        slotAssignment.donateSlot = false;
                    }
                });
            }
        }

        this.updateCommentText();

        return assignedSlots;
    }

    public isSlotAvailable(slotNumber: number): boolean {
        if (slotNumber > 0 && slotNumber <= this.raffleParticipants.length) {
            if (this.raffleParticipants[slotNumber - 1].name) {
                return false;
            }
        } else {
            return false;
        }

        return true;
    }

    private assignSlot(username: string, requester: string, slotNumber: number, paid: boolean, forceAssignment: boolean, updateText: boolean) {
        if (this.isSlotAvailable(slotNumber) || forceAssignment) {
            this.raffleParticipants[slotNumber - 1].name = username;
            this.raffleParticipants[slotNumber - 1].requester = requester;
            this.raffleParticipants[slotNumber - 1].paid = paid;
            if (updateText) {
                this.updateCommentText();
            }
            this.sendPayPalPm(username);

            if (username !== requester) {
                this.sendPayPalPm(requester);
            }
        }
    }

    private sendConfirmationReply(slotAssignments: any, confirmationMessage: string, commentId: string, author: string) {
        this.redditService.postComment(this.getCommentText(slotAssignments, confirmationMessage), commentId).subscribe(response => {
                if (!response || !response.json || !response.json.data) {
                    this.loggingService.logMessage('error sending confirmation response:' + JSON.stringify(response), LoggingLevel.ERROR);
                    console.error('error sending confirmation response', response);
                    let threadLocked = false;
                    if (response.json.errors && response.json.errors.length) {
                        for (let x = 0; x < response.json.errors.length; x++) {
                            const errors = response.json.errors[x];
                            for (let i = 0; i < errors.length; i++) {
                                if (errors[x] === 'THREAD_LOCKED') {
                                    threadLocked = true;
                                }
                            }
                        }
                    }
                    if (threadLocked) {
                        alert('YOUR RAFFLE HAS BEEN LOCKED BY THE MODS!!! Please go look at your post and work with the mods to resolve the issue.');
                    } else {
                        swal2('Error Sending Confirmation Message To ' + author + '!',
                            'If this is the only error message you receive ' +
                            'then check that their slots were assigned properly and manually reply to them. ' +
                            'If you got or get another error message telling you to relink the tool then follow the instructions in that message.',
                            'error'
                        );
                    }
                }
            },
            error => {
                this.loggingService.logMessage('error sending confirmation response:' + JSON.stringify(error), LoggingLevel.ERROR);
                console.error('error sending confirmation response', error);

                swal2('Error Sending Confirmation Message To ' + author + '!',
                    'If this is the only error message you receive ' +
                    'then check that their slots were assigned properly and manually reply to them. ' +
                    'If you got or get another error message telling you to relink the tool then follow the instructions in that message.',
                    'error'
                );
            });
    }

    private getCommentText(slotAssignments: any, commentText: string): string {
        let updatedText = commentText;
        for (let x = 0; x < slotAssignments.length; x++) {
            const slotAssignment = slotAssignments[x];
            const allSlots = slotAssignment.inOrderSlots.join(', ') + slotAssignment.calledSlots.join(', ') + (slotAssignment.calledSlots.length && slotAssignment.randomSlots.length ? ', ' : '') + slotAssignment.randomSlots.join(', ');
            updatedText = updatedText.replace(new RegExp('{' + slotAssignment.assignee + '_ALL_SLOTS' + '}', 'ig'), allSlots);
            updatedText = updatedText.replace(new RegExp('{' + slotAssignment.assignee + '_CALLED_SLOTS' + '}', 'ig'), slotAssignment.calledSlots.join(', '));
            updatedText = updatedText.replace(new RegExp('{' + slotAssignment.assignee + '_RANDOM_SLOTS' + '}', 'ig'), slotAssignment.randomSlots.join(', '));
        }

        return updatedText;
    }

    private loadRaffleStorage(raffleName: string, userId: string) {
        this.databaseService.getProcessedComments(userId, raffleName).subscribe(comments => {
            if (comments) {
                this.confirmedComments = comments;
            }
        }, err => {
            this.loggingService.logMessage('getProcessedComments:' + JSON.stringify(err), LoggingLevel.ERROR);
            console.error(err);

            swal2(
                'Error Getting Previous Processed Comments!',
                'There was an error retrieving comments you already processed. ' +
                'This could cause you to process comments again. Try relinking The Raffle Tool to resolve the issue. ' +
                'If it persists please let BoyAndHisBlob know.',
                'error'
            );
        });

        this.databaseService.getPaypalPmRecipients(userId, raffleName).subscribe(paypalPmRecipients => {
            if (paypalPmRecipients) {
                this.paypalPmRecipients = paypalPmRecipients;
            }
        });

        this.databaseService.getRaffleProperties(userId, raffleName).subscribe(raffleProperties => {
            if (raffleProperties) {
                if (!raffleProperties.skippedPms) {
                    raffleProperties.skippedPms = [];
                }
                this.raffleProperties = raffleProperties;

            } else {
                this.raffleProperties = new RaffleProperties();
            }
        });
    }


    private loadStorage() {

        const hasSeenTermsOfService = JSON.parse(localStorage.getItem(this.tosKey));
        if (hasSeenTermsOfService !== null) {
            this.hasSeenTermsOfService = hasSeenTermsOfService;
        }

        const shownNewFeatureMessageSlotAssignmentHelper = JSON.parse(localStorage.getItem('shownNewFeatureMessageSlotAssignmentHelper'));
        if (shownNewFeatureMessageSlotAssignmentHelper !== null) {
            this.shownNewFeatureMessageSlotAssignmentHelper = shownNewFeatureMessageSlotAssignmentHelper;
        }

        const showAdBlockerMessage = JSON.parse(localStorage.getItem('showAdBlockerMessage'));
        if (showAdBlockerMessage !== null) {
            this.showAdBlockerMessage = showAdBlockerMessage;
        }

        const payPalInfo = JSON.parse(localStorage.getItem('payPalInfo'));
        if (payPalInfo !== null) {
            this.payPalInfo = payPalInfo;
            this.modifyPayPalMe();
        }
    }

    private showNewFeatureMessage() {
        if (!this.shownNewFeatureMessageSlotAssignmentHelper) {
            swal2({
                    title: 'New Feature Available!',
                    html: '<h3><span style="font-weight: 400;">' +
                    'Slot Assignment Helper' +
                    '</span></h3>' +
                    '<p><span style="font-weight: 400;">' +
                    'Clicking the "Slot Assignment Helper" button will cycle you through top level comments and provide ' +
                    'you with an interface to assign slots and reply to the request with a confirmation message ' +
                    'all without having to leave The Raffle Tool.' +
                    '</span></p>' +
                    '<p><span style="font-weight: 400;">' +
                    'See the <a href="https://docs.google.com/document/d/1lz07G4-So9sUXgp46FWY-i7DSJ_RCfGfrBtIU1xNQbw/edit#heading=h.sg5104iphu6x" target="_blank" rel="noopener">complete documentation</a>&nbsp;for more info.' +
                    '</span></p>',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                }
            ).then((result) => {
                if (result.value) {
                    localStorage.setItem('shownNewFeatureMessageSlotAssignmentHelper', JSON.stringify(true));
                } else if (result.dismiss) {
                    localStorage.setItem(this.currentRaffle.name + '_shownNewFeatureMessageSlotAssignmentHelper', JSON.stringify(true));
                }
            });
        }
    }

    private showModAppreciationMessage() {
        if (this.isModtober) {
            swal2({
                    title: 'Modtober is here!',
                    html: '<h3><span style="font-weight: 400;">October is mod appreciation month!</span></h3>\n' +
                    '<p><span style="font-weight: 400;">' +
                    '   <strong>The mods donate a lot of their time</strong> to ensure the community we have here is fun, fair, and safe.' +
                    ' You can <strong>show your appreciation</strong> by donating a slot from your raffle to a random mod of /r/' +
                    this.currentRaffle.subreddit +
                    ' by clicking the button below. <br/> <br/>This will post a comment to your raffle stating you are donating a slot. You should process the request normally.' +
                    '</span></p>',
                    showCloseButton: true,
                    showCancelButton: true,
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Donate Slot!'
                }
            ).then((result) => {
                if (result.value) {
                    this.donateModSlot();
                }
            });
        }
    }

    private selectRaffle(raffles: any): any {
        return Observable.create(observer => {
            if (raffles && raffles.length > 1) {
                this.modal.open(RafflePickerModalComponent,
                    overlayConfigFactory({
                            isBlocking: true,
                            raffles: raffles
                        },
                        BSModalContext))
                    .then(dialogRef => {
                        dialogRef.result.then(raffle => {
                            observer.next(raffle);
                            observer.complete();
                        }).catch(err => {
                            this.loggingService.logMessage('selectRaffle:' + JSON.stringify(err), LoggingLevel.ERROR);
                            console.error(err);
                            observer.error(err);
                            observer.complete();
                        });
                    });
            } else if (raffles && raffles.length === 1) {
                observer.next(raffles[0]);
                observer.complete();
            } else {
                observer.next({});
                observer.complete();
            }

        });

    }

    private showTermsOfService() {
        this.modal.open(TermsOfServiceModalComponent,
            overlayConfigFactory({
                    isBlocking: true
                },
                BSModalContext))
            .then(dialogRef => {
                dialogRef.result.then(userAgreementIndicator => {
                    localStorage.setItem(this.tosKey, JSON.stringify(userAgreementIndicator));
                }).catch(err => {
                    this.loggingService.logMessage('showTermsOfService:' + JSON.stringify(err), LoggingLevel.ERROR);
                    console.error(err);
                });
            });
    }

    private donateModSlot() {
        const mod = this.getRandomMod(this.currentRaffle.subreddit);

        const randomModUrl = this.raffleToolUri + '?modtober_subreddit=' + this.currentRaffle.subreddit;

        const commentText = '#Modtober Is Here!!!\n\n' +
            '/u/BoyAndHisBlob has declared October mod appreciation month in The Raffle Tool. All rafflers and their participants ' +
            'are encouraged to **show appreciation for a [random mod](' + randomModUrl + ')** by donating a slot to them.\n\n' +
            'In the spirit of Modtober I am donating a random slot to /u/' + mod + ' as a thank you for all the time and effort ' +
            'they donate to make /r/' + this.currentRaffle.subreddit + ' a fun, fair, and safe community for everyone.' +
            '\n\nThis slot request will be processed in the order it was received in the queue.';

        this.redditService.postComment(commentText, this.currentRaffle.name).subscribe(response => {
            swal2(
                'Donation Comment Posted!',
                'Please process the slot request in the order it was recieved in the queue and thank you for your generosity!',
                'success'
            );
        });
    }

    private getRandomMod(subreddit: string): string {
        const subredditMods = this.mods[subreddit];

        if (subredditMods && subredditMods.length) {
            const min = 0;
            const max = subredditMods.length - 1;
            const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

            return subredditMods[randomNum];
        } else {
            return null;
        }
    }

    private loadRaffle() {
        this.redditService.getUserDetails().subscribe(userDetailsResponse => {
                if (userDetailsResponse.name) {
                    this.userName = userDetailsResponse.name;
                    this.userId = userDetailsResponse.id;

                    this.redditService.getCurrentRaffleSubmissions(userDetailsResponse.name)
                        .subscribe(submissionsResponse => {
                                if (submissionsResponse && submissionsResponse.length > 0) {
                                    this.selectRaffle(submissionsResponse).subscribe(submission => {
                                        this.currentRaffle = submission;
                                        this.initLoggingService();
                                        this.importRaffleSlots(submission);

                                        this.setSubredditSettings(submission.subreddit);

                                        this.loadRaffleStorage(submission.name, this.userId);

                                        this.sendOneTimeNotifications();

                                        if (this.hasNewFeature) {
                                            this.showNewFeatureMessage();
                                        }
                                        this.showModAppreciationMessage();
                                    });
                                }
                            },
                            err => {
                                this.loggingService.logMessage('getCurrentRaffleSubmissions:' + JSON.stringify(err), LoggingLevel.ERROR);
                                console.error(err);
                            }
                        );
                }
            },
            err => {
                this.loggingService.logMessage('getUserDetails:' + JSON.stringify(err), LoggingLevel.ERROR);
                console.error(err);
            }
        );
    }

    private showModtoberModMessage(subreddit: string) {
        const randomMod = this.getRandomMod(subreddit);

        const randomModUrl = this.raffleToolUri + '?modtober_subreddit=' + subreddit;

        if (randomMod) {
            swal2({
                    title: 'Modtober is here!',
                    html: '<h3 class="text-left"><span style="font-weight: 400;">' + randomMod + ' is your random mod! ' +
                    'Click the "Copy And Close" button to copy suggested slot donation comment text to your clipboard so you can paste it into a Reddit comment.</span></h3>\n',
                    showCloseButton: true,
                    showCancelButton: true,
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Copy And Close'
                }
            ).then((result) => {
                if (result.value) {
                    const commentText = '#Modtober Is Here!!!\n\n' +
                        '/u/BoyAndHisBlob has declared October mod appreciation month in The Raffle Tool. All rafflers and their participants ' +
                        'are encouraged to **show appreciation for a [random mod](' + randomModUrl + ')** by donating a slot to them.\n\n' +
                        'In the spirit of Modtober **I am requesting a random slot for /u/' + randomMod + '** as a thank you for all the time and effort ' +
                        'they donate to make /r/' + subreddit + ' a fun, fair, and safe community for everyone.';

                    const dummy = document.createElement('textarea');
                    document.body.appendChild(dummy);
                    dummy.setAttribute('id', 'dummy_id');
                    const commentControl: any = document.getElementById('dummy_id');
                    commentControl.value = commentText;
                    dummy.select();
                    document.execCommand('copy');
                    document.body.removeChild(dummy);
                }
            });
        }
    }

    private modifyPayPalMe() {
        const ppRegEx = new RegExp('(paypal\.me)', 'i');
        const httpsRegEx = new RegExp('(https://|www\.)paypal\.me', 'i');

        if (ppRegEx.test(this.payPalInfo)) {
            if (!httpsRegEx.test(this.payPalInfo)) {
                this.payPalInfo = this.payPalInfo.replace(ppRegEx, 'https://www.$1');
            }
        }
        localStorage.setItem('payPalInfo', JSON.stringify(this.payPalInfo));

    }

    private shuffleSlots() {
        swal2({
                title: 'Shuffle All Slots?',
                text: 'This only ever makes sense in a random only raffle. If you really want to shuffle everyones slot ' +
                'click the "Shuffle Slots" button below, otherwise click "Cancel"',
                type: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Shuffle Slots'
            }
        ).then((result) => {
            if (result.value) {
                this.shuffleAllSlots();
            }
        });
    }

    private shuffleAllSlots() {
        const participants = this.raffleParticipants;
        for (let i = participants.length; i; i--) {
            const j = Math.floor(Math.random() * i);
            [participants[i - 1], participants[j]] = [participants[j], participants[i - 1]];
        }
        this.updateCommentText();
    }

    private updateFlair(flairId: string, flairText: string) {
        if (this.autoUpdateFlair && this.currentRaffle.link_flair_text !== flairText) {
            this.redditService.updateFlair(this.currentRaffle.name, flairId, flairText).subscribe(resp => {
            });
        }
    }

    private setSubredditSettings(subreddit: string) {
        this.databaseService.getSubredditSettings(subreddit).subscribe(subredditSettings => {
            if (subredditSettings) {
                this.notificationSettings = subredditSettings.notification;
                this.botUsername = subredditSettings.botName;

                const flairSettings = subredditSettings.flair;

                if (flairSettings) {
                    this.collectingPaymentsFlairId = flairSettings.collecting;
                    this.customRainbowFlairId = flairSettings.editable;
                    this.completeFlairId = flairSettings.complete;
                }

                if (flairSettings && flairSettings.editable) {
                    this.canEditFlair = true;
                    this.autoUpdateFlair = true;
                }
            } else {
                swal2({
                        title: 'Error getting subreddit settings!',
                        text: 'Please try relinking the raffle tool. If the error persists please contact BoyAndHisBlob.',
                        type: 'error',
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'OK'
                    }
                );
            }
        }, err => {
            this.loggingService.logMessage('getSubredditSettings:' + JSON.stringify(err), LoggingLevel.ERROR);
            console.error(err);

            swal2(
                'Error Getting Subreddit Specific Settings!',
                'There was an error retrieving subreddit specific settings! ' +
                'Try relinking The Raffle Tool to resolve the issue. ' +
                'If it persists please let BoyAndHisBlob know.',
                'error'
            );
        });
    }

    private callTheBot() {
        if (this.numOpenSlots === 0 && !this.unpaidUsers) {
            swal2({
                    title: 'Call The Bot?',
                    text: 'Click "Call The Bot" to post a comment that will summon the bot to pick a winner.',
                    type: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Call The Bot'
                }
            ).then((result) => {
                if (result.value) {
                    this.redditService.postComment('/u/' + this.botUsername + ' ' + this.numSlots, this.currentRaffle.name).subscribe(res => {
                            this.updateFlair(this.completeFlairId, 'Complete');
                            this.botCalled = true;
                        },
                        err => {
                            this.loggingService.logMessage('callTheBot:' + JSON.stringify(err), LoggingLevel.ERROR);
                            console.error(err);

                            swal2(
                                'Error Calling The Bot!',
                                'There was an error calling the bot. ' +
                                'This could be a Reddit issue. Wait a minute, check your raffle to see if it was definitely not called ' +
                                'and if it wasn\'t, call it manually or try clicking the call the bot button again. ' +
                                'If you call it manually, don\'t forget to change your raffle\'s flair to Complete.',
                                'error'
                            );
                        }
                        );
                }
            });
        } else {
            swal2({
                    title: 'You Cant Call The Bot Yet!',
                    text: 'You can only call the bot when all slots are filled and everyone is paid.',
                    type: 'info',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                }
            );
        }
    }

    private configureAdblockerCheck() {
        const adBlockNotDetected = this.adBlockNotDetected;
        const adBlockDetected = this.adBlockDetected;
        // We look at whether FuckAdBlock already exists.
        if (typeof FuckAdBlock !== 'undefined') {
            // If this is the case, it means that something tries to usurp are identity
            // So, considering that it is a detection
            this.adBlockDetected();
        } else {
            // Otherwise, you import the script FuckAdBlock
            const importFAB = document.createElement('script');
            importFAB.onload = () => {
                // If all goes well, we configure FuckAdBlock
                fuckAdBlock.onDetected(() => {this.adBlockDetected()})
                fuckAdBlock.onNotDetected(adBlockNotDetected);
            };
            importFAB.onerror =  () => {
                // If the script does not load (blocked, integrity error, ...)
                // Then a detection is triggered
                this.adBlockDetected()
            };
            importFAB.integrity = 'sha256-xjwKUY/NgkPjZZBOtOxRYtK20GaqTwUCf7WYCJ1z69w=';
            importFAB.crossOrigin = 'anonymous';
            importFAB.src = 'https://cdnjs.cloudflare.com/ajax/libs/fuckadblock/3.2.1/fuckadblock.min.js';
            document.head.appendChild(importFAB);
        }
    }

    // Function called if AdBlock is not detected
    private adBlockNotDetected() {
        //Do nothing, this is ideal state
        //alert('AdBlock is not enabled');
    }

    // Function called if AdBlock is detected
    private adBlockDetected() {
        if (this.showAdBlockerMessage) {
            //adblockers prevent Loggly from working so fuck 'em
            swal2('Ad Blockers Prevent Slot List Logging!',
                'The Raffle Tool uses Loggly to log your slot list every time it updates. Some ad blockers prevent Loggly from working. ' +
                'It is in your best interest to disable ad blockers on The Raffle Tool so this feature can be used. ' +
                'This will allow us to recover your raffle\'s slot list history. ' +
                'I am sure you would rather have history and not need it than need it and not have it! ' +
                '<strong>THERE ARE NOT ANY ADS ON THIS SITE SO YOU GAIN NOTHING WITH THE AD BLOCKERS ENABLED.</strong> ' +
                'You won\'t get this message again.',
                'info'
            ).then((result) => {
                if (result.value) {
                    localStorage.setItem('showAdBlockerMessage', JSON.stringify(false));
                }
            });
        }
    }

    private sendOneTimeNotifications() {
        this.modToolsId = Md5.hashStr(this.userId + this.currentRaffle.name) + '_' + this.currentRaffle.id;

        this.databaseService.getModTools(this.modToolsId).subscribe(modTools => {
            if (!modTools || !modTools.created) {
                this.databaseService.createModTools(this.modToolsId).subscribe(createModToolsResponse => {
                    if (createModToolsResponse.created) {
                        this.sendNotifications();
                    }
                });
            }
        });
    }

    private sendNotifications() {
        const notification = '@here New Raffle submitted by ' + this.userName + ' in ' + this.currentRaffle.subreddit + ': ' + this.currentRaffle.url;

        this.sendModToolsUri();
        this.sendDiscordNotifications(notification);
    }

    private sendDiscordNotifications(notification: string) {
        if (this.notificationSettings && this.notificationSettings.discord) {
           for (let i = 0; i < this.notificationSettings.discord.length; i++) {
               this.notificationService.sendDiscordNotification(this.notificationSettings.discord[i], notification, 'Raffle Tool').subscribe(res => {
               });
           }
        }
    }

    private sendModToolsUri() {
        const modToolsUri = environment.baseUri + '/mod-tools?modToolsId=' + this.modToolsId;
        const notification = 'The Mod Tools URI for ' + this.currentRaffle.url + ' submitted by ' + this.userName + ' is:\n' + modToolsUri;
        if (this.notificationSettings && this.notificationSettings.mod_tools_discord) {
            this.notificationService.sendDiscordNotification(this.notificationSettings.mod_tools_discord, notification, 'Raffle Tool').subscribe(res => {
            });
        }
    }

    private messageUpdate(messages: any[]) {
        if (messages && messages.length) {
            this.chatMessages = messages;

            if (this.isSlotAssignmentHelperRunning) {
                this.interuptSlotAssignmentHelper = true;
            }

            if (!this.haveShownModChatMessage) {
                this.showModChatMessage();
            }
        }
    }

    private showModChatMessage() {
        this.haveShownModChatMessage = true;

        swal2({
                title: 'You Have A New Mod Chat Message!',
                text: 'Please read the new message in the Mod Chat in the bottom right of the tool before continuing with your raffle. It could be time sensitive.',
                type: 'info',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            }
        );
    }

    private setRequesters() {
        this.databaseService.getRaffleParticipants(this.userId, this.currentRaffle.name).subscribe( savedRaffleParticipants => {
            if (savedRaffleParticipants && savedRaffleParticipants.length === this.raffleParticipants.length) {
                for (let i = 0; i < savedRaffleParticipants.length; i++) {
                    if (savedRaffleParticipants[i].name && savedRaffleParticipants[i].name === this.raffleParticipants[i].name) {
                        this.raffleParticipants[i].requester = savedRaffleParticipants[i].requester;
                    }
                }
            }
        });
    }

    private hasRequesters(participantList: any[]): boolean {

        for (let i = 0; i < this.raffleParticipants.length; i++) {
            if (this.raffleParticipants[i].requester) {
                return true;
            }
        }

        return false;
    }

    private markAllRequestedAsPaid(userName: string) {
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if ((raffler.name && raffler.name.toUpperCase() === userName.toUpperCase()) ||
                (raffler.requester && raffler.requester.toUpperCase() === userName.toUpperCase())
            )  {
                raffler.paid = true;
            }

            if (x + 1 === this.raffleParticipants.length) {
                this.updateCommentText();
            }
        }
    }

    private makeAnnouncement() {
        swal2({
            title: 'Make Announcement',
            text: 'Making an announcement will post a top level comment with the comment text specified and ' +
            'tag every raffler currently participating in your raffle.',
            input: 'textarea',
            inputPlaceholder: 'Type your Reddit comment here',
            confirmButtonText: 'Make Announcement',
            showCancelButton: true,
            inputValidator: (value) => {
                return !value && 'You can\'t make an empty announcement!'
            }
        }).then((text) => {
            if (text && !text.dismiss) {

                swal2({
                    title: 'Are You Sure You Want To Make An Announcement?',
                    text: 'Literally everyone in your raffle will get a notification if you make this announcement. ' +
                    'Do not use this feature lightly as people do not want to be spammed. ' +
                    'If this is something you truly want to communicate to everyone in your raffle then click "Make Announcement" otherwise click "cancel".',
                    confirmButtonText: 'Make Announcement',
                    showCancelButton: true
                }).then((result) => {
                    if (result.value && !result.dismiss) {
                        const tagTrainMessage = 'Raffle [Announcement](' + this.permalinkPlaceholder + ') Made';

                        const uniqueParticipanList = [];
                        for (let x = 0; x < this.raffleParticipants.length; x++) {
                            const raffler = this.raffleParticipants[x];
                            if (raffler.name && uniqueParticipanList.indexOf(raffler.name) === -1) {
                                uniqueParticipanList.push(this.getSanitizedUserName(raffler.name));
                            }
                        }

                        this.sendAnnouncement(text.value, tagTrainMessage, uniqueParticipanList, true);
                    }
                });
            } else if (text && text.dismiss) {
            } else {
                swal2({
                        title: 'Announcement Not Made!',
                        text: 'There was an error reading your comment text.',
                        type: 'error'
                    }
                );
            }
        });
    }

    private sendAnnouncement(announcementText, tagTrainMessage, listOfUsers, sendDiscordNotification: boolean) {
        if (!listOfUsers || !listOfUsers.length) {
            return;
        }

        this.redditService.postComment(announcementText, this.currentRaffle.name).subscribe(response => {
            if (response && response.json && response.json.data && response.json.data.things) {
                const announcement = response.json.data.things[0].data;

                if (sendDiscordNotification) {
                    const notification = '@here Raffle announcement made by ' + this.userName + ': ' + this.publicRedditUrl + announcement.permalink;
                    this.sendDiscordNotifications(notification);
                }

                if (tagTrainMessage.indexOf(this.permalinkPlaceholder) !== -1) {
                    tagTrainMessage = tagTrainMessage.replace(this.permalinkPlaceholder, announcement.permalink)
                }

                this.redditService.createTagTrain(tagTrainMessage, listOfUsers, announcement.name).subscribe( tagTrainResponse => {
                    if (tagTrainResponse === true) {
                        swal2({
                                title: 'Announcement Made!',
                                type: 'success'
                            }
                        );
                    } else {
                        this.loggingService.logMessage('createTagTrain:' + JSON.stringify(tagTrainResponse), LoggingLevel.ERROR);
                        console.error(tagTrainResponse);

                        swal2({
                                title: 'Error Making Announcement!',
                                text: 'There was an error tagging the users of your raffle. ' +
                                'Check your raffle to see who was not tagged so you can tag them manually.',
                                type: 'error'
                            }
                        );
                    }

                },
                    err => {
                        const params = {announcementText: announcementText, tagTrainMessage: tagTrainMessage, listOfUsers: listOfUsers};
                        this.loggingService.logMessage('sendAnnouncement createTagTrain: params:' + JSON.stringify(params) +
                            ' ERR:' + JSON.stringify(err), LoggingLevel.ERROR);
                        console.error(err);
                    });
            } else {
                this.loggingService.logMessage('postComment:' + JSON.stringify(response), LoggingLevel.ERROR);
                console.error(response);
                swal2({
                        title: 'Error Making Announcement!',
                        text: 'There was an error posting your comment. Try again or do it manually.',
                        type: 'error'
                    }
                );
            }
        },
            err => {
                const params = {announcementText: announcementText, tagTrainMessage: tagTrainMessage, listOfUsers: listOfUsers};
                this.loggingService.logMessage('sendAnnouncement postComment: params:' + JSON.stringify(params) +
                    ' ERR:' + JSON.stringify(err), LoggingLevel.ERROR);
                console.error(err);
            });
    }

    private pageUnpaid() {
        swal2({
            title: 'Page Unpaid Users?',
            text: 'Clicking "Page Unpaid" will post the specified comment and tag all unpaid users. Click "Cancel" if you don\'t want to do this.',
            input: 'textarea',
            inputValue: 'Attention unpaid participants: You have 10 minutes from now to pay or I will remove your slots and move to the waitlist.',
            confirmButtonText: 'Page Unpaid',
            showCancelButton: true,
            inputValidator: (value) => {
                return !value && 'You can\'t post an empty comment!'
            }
        }).then((text) => {
            if (text && !text.dismiss) {
                const tagTrainMessage = '[Announcement](' + this.permalinkPlaceholder + ') made for unpaid participants';

                const pageList = [];
                for (let x = 0; x < this.unpaidUsersArray.length; x++) {
                    pageList.push(this.getSanitizedUserName(this.unpaidUsersArray[x]));
                }

                this.sendAnnouncement(text.value, tagTrainMessage, pageList, false);
            } else if (text && text.dismiss) {
            } else {
                swal2({
                        title: 'Page Failed!',
                        text: 'There was an error paging unpaid users.',
                        type: 'error'
                    }
                );
            }
        });
    }

    private removeUnpaid() {
        swal2({
            title: 'Remove Unpaid Users?',
            text: 'Clicking "Remove Unpaid" will remove all users from unpaid slots, post the specified comment, and tag all unpaid users. Click "Cancel" if you don\'t want to do this.',
            input: 'textarea',
            inputValue: 'Attention unpaid participants: your unpaid slots have been removed due to lack of payment.',
            confirmButtonText: 'Remove Unpaid',
            showCancelButton: true,
            inputValidator: (value) => {
                return !value && 'You can\'t post an empty comment!'
            }
        }).then((text) => {
            if (text && !text.dismiss) {
                this.removeUnpaidUsers(text.value);
            } else if (text && text.dismiss) {
            } else {
                swal2({
                        title: 'Failed To Remove Unpaid!',
                        text: 'There was an error removing unpaid users. Please try again or do it manually.',
                        type: 'error'
                    }
                );
            }
        });
    }

    private removeUnpaidUsers(text) {
        // make copy because we modify this when we updateCommentText
        const unpaidUsersArrayCopy = this.unpaidUsersArray.slice();
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (!raffler.paid && raffler.name) {
                raffler.name = '';
                raffler.requester = '';
            }
        }

        this.updateCommentText();

        if (this.notificationSettings && this.notificationSettings.notify_mods_unpaid) {
            const message = 'The following raffle participants were removed from [this raffle](' +
                this.currentRaffle.permalink + ')\n\n' + unpaidUsersArrayCopy.join('\n\n');

            this.redditService.sendPm('/r/' + this.currentRaffle.subreddit,
                'Unpaid Degenerates Removed', message).subscribe(postResponse => {
                },
                err => {
                    this.loggingService.logMessage('notifyModsUnpaid:' + JSON.stringify(err), LoggingLevel.ERROR);
                    console.error(err);
                }
            );
        }

        this.redditService.postComment(text, this.currentRaffle.name).subscribe(response => {
            if (response && response.json && response.json.data && response.json.data.things) {
                const comment = response.json.data.things[0].data;
                const pageList = [];
                for (let x = 0; x < unpaidUsersArrayCopy.length; x++) {
                    const raffler = unpaidUsersArrayCopy[x];
                    if (this.currentRaffle.subreddit !== 'testingground4bots' && this.currentRaffle.subreddit !== 'raffleTest') {
                        pageList.push(raffler);
                    } else {
                        pageList.push(this.userName);
                    }
                }

                this.redditService.tagUsersInComment(pageList, comment.name).subscribe(tagTrainResponse => {
                    if (tagTrainResponse === true) {
                        swal2({
                                title: 'Unpaid Users Removed!',
                                type: 'success'
                            }
                        );
                    } else {
                        swal2({
                                title: 'Error Tagging Unpaid!',
                                text: 'There was an error tagging all the unpaid users of your raffle. ' +
                                'Check your raffle to see who was not tagged so you can tag them manually.',
                                type: 'error'
                            }
                        );
                    }

                },
                    err => {
                        this.loggingService.logMessage('tagRemovedUnpaidUsersComment:' + JSON.stringify(err), LoggingLevel.ERROR);
                        console.error(err);

                        swal2({
                                title: 'Error Tagging Unpaid!',
                                text: 'There was an error tagging all the unpaid users of your raffle. ' +
                                    'Check your raffle to see who was not tagged so you can tag them manually.',
                                type: 'error'
                            }
                        );
                    });
            } else {
                swal2({
                        title: 'Error Paging Unpaid!',
                        text: 'There was an error posting your comment. Try again or do it manually.',
                        type: 'error'
                    }
                );
            }
        },
            err => {
                this.loggingService.logMessage('postRemoveUnpaidComment:' + JSON.stringify(err), LoggingLevel.ERROR);
                console.error(err);

                swal2({
                        title: 'Error Posting Comment!',
                        text: 'There was an error posting your comment to notify unpaid users they were removed. ' +
                            'Check that the unpaid users were removed properly and post the comment manually to inform them.',
                        type: 'error'
                    }
                );
            });
    }

    private tagUsers() {
        swal2({
            title: 'Tag Users?',
            text: 'Enter a permalink and click "Tag Users" to tag everyone who replied to that comment.',
            input: 'text',
            inputPlaceholder: '/r/WatchURaffle/comments/the_rest_of_your_permalink/',
            confirmButtonText: 'Tag Users',
            showCancelButton: true,
            inputValidator: (value) => {
                return new Promise((resolve) => {
                    const permalinkRegex = /^(https:\/\/www\.reddit\.com)?\/?r\/.+$/g;
                    if (permalinkRegex.test(value)) {
                        resolve()
                    } else {
                        resolve('Please enter a premalink, example: /r/WatchURaffle/comments/the_rest_of_your_permalink/')
                    }
                })
            }
        }).then((text) => {
            if (text && !text.dismiss) {
                this.tagUsersInRaffle(text.value.replace('https://www.reddit.com', ''));
            } else if (text && text.dismiss) {
            } else {
                swal2({
                        title: 'Failed To Tag Users!',
                        text: 'There was an error tagging users. Please try again or do it manually.',
                        type: 'error'
                    }
                );
            }
        });
    }

    private tagUsersInRaffle(permalink: string) {
        const commentMessage = 'Tagging users who requested tags [here.](' + permalink + ')';
        const tagTrainMessage = '[Raffle live!](' + this.currentRaffle.permalink + ') You are being tagged because you replied to [this comment.](' + permalink + ')';

        this.redditService.getPostComments(permalink).subscribe((post: any) => {
            const tagList = [];
            const comments = post[0].data.replies.data.children;

            for (let i = 0; i < comments.length; i++) {
                tagList.push(this.getSanitizedUserName(comments[i].data.author));
            }
            if (post[0].data.author === this.userName) {
                this.sendAnnouncement(commentMessage, tagTrainMessage, tagList, false);
            } else {

                swal2({
                    title: 'Tag Users To Raffle?',
                    text: 'The comment you linked to is not your own. Are you sure you want to tag everyone who replied to it?',
                    type: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Tag Users'
                }).then((result) => {
                    if (result.value) {
                        this.sendAnnouncement(commentMessage, tagTrainMessage, tagList, false);
                    }
                });
            }
        },
            err => {
                this.loggingService.logMessage('tagUsersInRaffle getPostComments:' + JSON.stringify(err), LoggingLevel.ERROR);
                console.error(err);
        });
    }

    private getSanitizedUserName(userName): string {
        if (this.currentRaffle.subreddit !== 'testingground4bots' && this.currentRaffle.subreddit !== 'raffleTest') {
            return userName;
        } else {
            return this.userName;
        }
    }

    private getNumUnpaidRequestedSlots(userName: string): number {
        let numRequestedUnpaid = 0;
        for (let x = 0; x < this.raffleParticipants.length; x++) {
            const raffler = this.raffleParticipants[x];
            if (((raffler.name && raffler.name.toUpperCase() === userName.toUpperCase()) ||
                (raffler.requester && raffler.requester.toUpperCase() === userName.toUpperCase())) && !raffler.paid
            )  {
                numRequestedUnpaid += 1;
            }
        }

        return numRequestedUnpaid;
    }

    private initLoggingService() {
        this.loggingService.setCurrentRaffle(this.currentRaffle);
        this.loggingService.setUserName(this.userName);
    }

    private updateCustomFlairText() {
        this.updateRaffleProperties();
        this.updateCommentText();
    }

    private updateRaffleProperties() {
        this.databaseService.storeRaffleProperties(this.userId, this.currentRaffle.name, this.raffleProperties).subscribe(response => {
            },
            err => {
                this.loggingService.logMessage('updateRaffleProperties:' + JSON.stringify(err), LoggingLevel.ERROR);
                console.error(err);
            });
    }
}
