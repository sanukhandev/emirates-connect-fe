import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavComponent } from './layout/top-nav/top-nav.component';
import { SiteFooterComponent } from './layout/site-footer/site-footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavComponent, SiteFooterComponent],
  template: '<app-top-nav /><router-outlet /><app-site-footer />',
})
export class App {}
