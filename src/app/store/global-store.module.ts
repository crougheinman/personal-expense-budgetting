import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthModule } from './state/auth/auth.module';

@NgModule({
  imports: [
    AuthModule,
  ]
})
export class GlobalStoreModule { 
  static forRoot(): ModuleWithProviders<GlobalStoreModule> {
    return {
      ngModule: GlobalStoreModule,
    };
  }
}
