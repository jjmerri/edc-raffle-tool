import {Routes, RouterModule, PreloadAllModules} from '@angular/router';
import {HomeRoutes} from './home/home.routes';
import {ModuleWithProviders} from '@angular/core';
import {ModToolsRoutes} from './mod-tools/mod-tools.routes';

export const appRoutes: Routes = [
    ...HomeRoutes,
    ...ModToolsRoutes
];

export const appRoutingProviders: any[] = [
];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
