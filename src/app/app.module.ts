import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';



// import { AngularFireModule } from 'angularfire2';
// import { AngularFirestoreModule } from 'angularfire2/firestore';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { OracleService } from '../providers/oracle/oracle';

import {enableProdMode} from '@angular/core';
enableProdMode();


const firebaseConfig = {
  apiKey: 'AIzaSyAHlfic2F9KUyTSzW-rW1xTQXhCci97bYA',
  authDomain: 'oracle-dp.firebaseapp.com',
  databaseURL: 'https://oracle-dp.firebaseio.com',
  projectId: 'oracle-dp',
  storageBucket: 'oracle-dp.appspot.com',
  messagingSenderId: '859895054535'
};

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    // AngularFireModule.initializeApp(firebaseConfig),
    // AngularFirestoreModule.enablePersistence()
  ],
 
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    OracleService
  ]
})
export class AppModule {}
