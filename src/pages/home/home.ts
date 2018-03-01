import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
//import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { OracleService } from '../../providers/oracle/oracle';
import { Match } from '../../models/match';

import { DatePipe } from '@angular/common';

import * as firebase from 'firebase';
import 'firebase/firestore';


// https://stackoverflow.com/questions/48105557/how-to-use-google-cloud-firestore-on-ionic-without-angularfire

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [DatePipe]
})
export class HomePage {
  public idMatch: string;
  public day_matchs: string;
  matchs: Array<any>;
  isLoaded = false;
  private afs : any;

  // postsCol: AngularFirestoreCollection<Match>;
  // postDoc: AngularFirestoreDocument<Match>;
  posts: Observable<Match[]>;
  post: Observable<Match>;


  constructor(
    public navCtrl: NavController,
    public events: Events,
    //private afs: AngularFirestore,
    private datePipe: DatePipe,
    private oracleService: OracleService
  ) {
    this.afs = firebase.firestore();
    // recupero id recipient passato nell'url della pg
    this.idMatch = location.search.split('idMatch=')[1];
    if(this.idMatch)this.idMatch = this.idMatch.split('&')[0];
    this.day_matchs = location.search.split('day_matchs=')[1];
    if(this.day_matchs)this.day_matchs = this.day_matchs.split('&')[0];
    // subscribe elenco messaggi
    // this.events.subscribe('listMessages:added-'+this.conversationWith, this.addHandler);
    // this.events.subscribe('listMessages:changed-'+this.conversationWith, this.changedHandler);
  }

  // /**
  //  * on subcribe add message
  //  */
  // addHandler:any = (uid, messages) => {
  //   console.log('addHandler', uid, messages);
  //   this.messages = messages;
  //   this.doScroll();
  // }
  // /**
  //  * on subcribe change message
  //  */
  // changedHandler:any = (uid, messages) => {
  //   console.log('changedHandler', uid, messages);
  //   this.messages = messages;
  //   this.doScroll();
  // }

  ngOnInit(): void {
    if (!this.idMatch) {
      // caso 1
      // se id incontro non esiste richiamo func php che passa json con elenco quote partite
      this.getMatchs();
    }
  }

  getMatchs(): void {
    this.matchs = [];
    this.isLoaded = false;
    // chiamo la func php che carica
    // http://www.oddsmath.com/api/v1/events-by-league.json/?language=en&country_code=IT&league_id=
    // con id = 1315 (campionato serie A italia)
    let days: number = 0;
    if(!this.day_matchs){
      var ora = +new DatePipe('en-EN').transform(new Date(), 'h'); // 1-12
      var minuti = +new DatePipe('en-EN').transform(new Date(), 'mm'); // 1-59
      // controllo ogni ora - controllo 2 volte al giorno da 3gg a 12gg
      if( minuti > 30 ){
        days = ora;
        console.log('now date: ', days);
        const day = this.getDayMatchs(days);
        this.loadeEventsByDay(day);
      } 
    } else {
      days = +this.day_matchs;
      const day = this.getDayMatchs(days);
      this.loadeEventsByDay(day);
    }
    
      
    //const day = this.getDayMatchs(days);
    // let startDay = 0;
    // if(days<2){
    //   startDay = days;
    // } else if(days < 4) {
    //   startDay = 2;
    // } else if(days < 7) {
    //   startDay = 4;
    // } else {
    //   startDay = 7;
    // }   
    // 
    // for(let i=startDay; i<=days; i++){
    //   const day = this.getDayMatchs(i);
    //   this.loadeEventsByLeague(day);
    // }
  }


  loadeEventsByDay(day){
    this.oracleService.loadeEventsByDay(day)
    .subscribe(
      data => {
        console.log('SEARCH date: ', data);
        // Caution: use "of" and not "in"
        for (const key of Object.keys(data)) {
          // const events = data[key].json().events;
          const events = data[key].events;
          for (const keyEvent of Object.keys(events)) {
            this.matchs.push(
              {key: keyEvent, value: events[keyEvent]}
            );
          }
        }
        // creo un array con tutti gli incontri del campionato
        // e passo al controllo
        console.log('MATCHS: ', this.matchs);
        this.oracleService.checkMatchsDB(this.matchs);
      },
      errMsg => {
        this.isLoaded = true;
        console.log('SEARCH ERROR MESSAGE', errMsg);
      },
      () => {
        this.isLoaded = true;
        console.log('SEARCH COMPLETE');
      }    
    );
  }


  getDayMatchs(days): string{
    //2018-03-16
    let date = new Date();
    const today = this.datePipe.transform(date, 'yyyy-MM-dd');
    console.log('ORA datePipe::::', today);
    if(!days || days === 0){
      return today;
    }
    else {
      date.setDate( date.getDate() +  days);
      const day = this.datePipe.transform(date, 'yyyy-MM-dd');
      console.log('day datePipe::::', day);
      return day;
    }
    
  }
  


  // createMatch(partita): void {
  //   const now = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
  //   console.log('ORA datePipe::::', now);
  //   const urlNodeFirebase = '/matchs/';
  //   console.log('createSenderConversation.conversationsPathDb::', urlNodeFirebase);
  //   const matchObj = firebase.database().ref(urlNodeFirebase);
  //   const match = {
  //     id: partita.id,
  //     last_update: now,
  //     bookmaker_count: partita.bookmaker_count,
  //     league_id: partita.league_id,
  //     awayteam_country: partita.awayteam_country,
  //     awayteam_country_id: partita.awayteam_country_id,
  //     awayteam_id: partita.awayteam_id,
  //     awayteam_name: partita.awayteam_name,
  //     hometeam_country: partita.hometeam_country,
  //     hometeam_country_id: partita.hometeam_country_id,
  //     hometeam_id: partita.hometeam_id,
  //     hometeam_name: partita.hometeam_name,
  //     max_1: partita.max_1,
  //     max_X: partita.max_X,
  //     max_2: partita.max_2,
  //     margin: partita.margin,
  //     time: partita.time,
  //     url: partita.url,
  //     x_hash: partita['x_hash'],
  //     x_id: partita['x_id']
  //   };
  //   matchObj.set(match);
  // }


}
