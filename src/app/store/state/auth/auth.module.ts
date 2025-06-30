import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { AUTH_FEATURE_KEY, authReducer } from './auth.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AuthEffects } from './auth.effect';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        StoreModule.forFeature(AUTH_FEATURE_KEY, authReducer),
        EffectsModule.forFeature([AuthEffects]),
    ],
    exports: [],
    providers: [],
})
export class AuthModule {}
