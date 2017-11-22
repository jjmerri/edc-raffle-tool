import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';

@Component({
    selector: 'app-mod-tools',
    templateUrl: './mod-tools.component.html'
})
export class ModToolsComponent implements OnInit {
    private modToolsId = '';
    constructor(private activatedRoute: ActivatedRoute) {
    }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            if (params['modToolsId']) {
                this.modToolsId = params['modToolsId'];
            }
        });
    }

}
