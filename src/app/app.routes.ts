import {Routes, RouterModule, PreloadAllModules} from '@angular/router';
import {HomeRoutes} from './home/home.routes';
import {ModuleWithProviders} from '@angular/core';

export const appRoutes: Routes = [
    ...HomeRoutes
];

export const appRoutingProviders: any[] = [
];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
