import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthModule } from './state/auth/auth.module';
import { InventoryModule } from './state/inventory/inventory.module';

@NgModule({
  imports: [
    AuthModule,
    InventoryModule,
  ]
})
export class GlobalStoreModule { 
  static forRoot(): ModuleWithProviders<GlobalStoreModule> {
    return {
      ngModule: GlobalStoreModule,
    };
  }
}
