import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { INVENTORY_FEATURE_KEY, inventoryReducer } from './inventory.reducer';
import { EffectsModule } from '@ngrx/effects';
import { InventoryEffects } from './inventory.effect';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        StoreModule.forFeature(INVENTORY_FEATURE_KEY, inventoryReducer),
        EffectsModule.forFeature([InventoryEffects]),
    ],
    exports: [],
    providers: [],
})
export class InventoryModule {}
