import {ApplicationConfig, InjectionToken, provideExperimentalZonelessChangeDetection, provideZoneChangeDetection} from '@angular/core';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';

/** Injection token for an injectable (and thus more testable) window object. */
export const WINDOW = new InjectionToken<Window>('window');

/** App configuration. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideNoopAnimations(),
    {provide: WINDOW, useValue: window},

  ]
};
