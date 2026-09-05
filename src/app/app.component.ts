import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FarmersComponent } from './components/farmers/farmers.component';
import { CattleComponent } from './components/cattle/cattle.component';
import { AiTrackingComponent } from './components/ai-tracking/ai-tracking.component';
import { PdDiagnosisComponent } from './components/pd-diagnosis/pd-diagnosis.component';
import { PregnancyCareComponent } from './components/pregnancy-care/pregnancy-care.component';
import { CalvingComponent } from './components/calving/calving.component';
import { FamilyTreeComponent } from './components/family-tree/family-tree.component';
import { BillsComponent } from './components/bills/bills.component';
import { SmsMessengerComponent } from './components/sms-messenger/sms-messenger.component';
import { ReportsComponent } from './components/reports/reports.component';
import { LoginComponent } from './components/login/login.component';
import { DataService } from './services/data.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    DashboardComponent,
    FarmersComponent,
    CattleComponent,
    AiTrackingComponent,
    PdDiagnosisComponent,
    PregnancyCareComponent,
    CalvingComponent,
    FamilyTreeComponent,
    BillsComponent,
    SmsMessengerComponent,
    ReportsComponent,
    LoginComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'satviq-ui';
  dataService = inject(DataService);
  authService = inject(AuthService);

  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  activeView = 'dashboard';

  onViewSelected(viewId: string) {
    this.activeView = viewId;
  }

  toggleSidebarCollapse() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen = false;
  }
}
