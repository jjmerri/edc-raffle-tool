import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';

import 'rxjs/Rx';

import { OauthService } from '../oauth/services/oauth.service';
import { RedditService} from '../reddit/services/reddit.service';
import { DatabaseService} from '../database/services/database.service';

@Component({
    selector: 'app-mod-tools',
    templateUrl: './mod-tools.component.html'
})
export class ModToolsComponent implements OnInit {
    constructor(private activatedRoute: ActivatedRoute, private databaseService: DatabaseService) {
    }

    ngOnInit() {
    }

}
