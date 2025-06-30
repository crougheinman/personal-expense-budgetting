import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthModule } from '@angular/fire/auth';

@NgModule({
  declarations: [],
  imports: [
    AuthModule
  ]
})
export class GlobalStoreModule { 
  static forRoot(): ModuleWithProviders<GlobalStoreModule> {
    return {
      ngModule: GlobalStoreModule,
    };
  }
}
