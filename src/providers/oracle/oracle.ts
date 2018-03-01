import { Injectable, Component } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';
import 'rxjs/add/operator/map';
import { DatePipe, registerLocaleData } from '@angular/common';


import { Match } from '../../models/match';
import { Giocata } from '../../models/giocata';
import { HttpClient } from '@angular/common/http';

// We MUST import both the firebase AND firestore modules like so
import * as firebase from 'firebase';
import 'firebase/firestore';
import { identifierModuleUrl } from '@angular/compiler';


// @Component({
//   providers: [DatePipe]
// })
@Injectable()
export class OracleService {

  private BASE_URL = 'http://www.dariodepascalis.com/depa_predictor/brain/';
  private http: Http;
  private afs : any;

  
  constructor(
    http: Http
    //private datePipe: DatePipe
  ) {
    this.http = http;
     // Initialise access to the firestore service
     this.afs = firebase.firestore();
  }
  // FUNZIONI LOAD JSON
  /**
   * 
   */
  loadeEventsByDay(dayMatchs): Observable<any> {
    //2018-02-27
    const url = this.BASE_URL+'events-by-league.php?day_matchs='+dayMatchs;
    // const link = 'http://www.oddsmath.com/api/v1/events-by-day.json/?language=en&country_code=IT&timezone=Europe%2FRome&day=2018-03-16&grouping_mode=1';
    //const itaA = 1315;
    //const url = 'http://www.dariodepascalis.com/depa_predictor/events-by-league.php?league_id='+itaA;
    // http://www.oddsmath.com/api/v1/events-by-league.json/?language=en&country_code=IT&league_id=
    // con id = 1315 (campionato serie A italia)
    
    //$url = "http://www.oddsmath.com/football/matches/today/";
    //var now = new DatePipe('en-EN').transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const headers: Headers = new Headers();
    headers.append('Cache-Control', 'no-cache');
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Basic b3JhY3VsdW06MTIzNDU2Nzg=');
    let options = new RequestOptions({ headers: headers });
  
    console.log('url events-by-league: ', url);
    return this.http
    .get(url, options)
    .map(res => <any[]>(res.json().data));
  }

  // FUNZIONI DI VERIFICA INCONTRI //
  /**
   * 
   */
  checkMatchsDB(matchs) {
    for (const match of matchs) {
      this.checkMatch(match.value);
    }
  }
  /**
   * 
   * @param partita 
   */
  checkMatch(partita) {
    console.log('QUOTE ::: ', partita)
    if(partita.margin>-1){
      const matchId = partita.id.toString();
      let docRef = this.afs.doc('matchs/' + matchId);
      const that = this;
      docRef.get().then(function(doc) {
          if (doc.exists) {
            console.log("AGGIORNO MATCH!");
            that.updateMatch(doc.data(), partita);
          } else {
            console.log("AGGIUNGO MATCH!");
            that.addMatch(partita);
          }
      }).catch(function(error) {
          console.log("Error getting document:", error);
      });
    }
  }

  addMatch(partita){
    // aggiungo elemento
    var now = new DatePipe('en-EN').transform(new Date(), 'yyyy-MM-dd HH:mm:ss ');
    //const now = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const matchId = partita.id.toString();
    partita.closed = false;
    var match = this.setMatch(partita);
    
    if(match.margin>=-1){
      console.log(' AGGIUNTO NUOVO ELEMENTO ::: ', matchId, match);
      this.afs.collection('matchs').doc(matchId).set(match);
    }
    
    // AL PRIMO GIRO NN CALCOLO NULLA
  }

  /**
   * 
   * @param data 
   * @param partita 
   */
  updateMatch(dataFirebase, partita){
    // const now = new DatePipe('en-EN').transform(new Date(), 'yyyy-MM-dd HH:mm:ss ');
    // const dataStart = new Date(partita.time);
    // let hourStart:any = new Date(partita.time).getHours()+1;
    // dataStart.setHours(hourStart);
    // const start = new DatePipe('en-EN').transform(dataStart, 'yyyy-MM-dd HH:mm:ss ');
    console.log('0- PARTITA.livescore:', partita.livescore);
    this.calcoloQuote(partita, dataFirebase);
  }

  calcoloQuote(partita, dataFirebase) {
    const matchId = partita.id.toString();
    const quote_last = [];
    quote_last.push(partita.max_1);
    quote_last.push(partita.max_X);
    quote_last.push(partita.max_2);
    let quota_1 = dataFirebase.max_1;
    let quota_X = dataFirebase.max_X;
    let quota_2 = dataFirebase.max_2;
    let aggiorna = false;
    let segnoQuotaCambiata = null;
    let percentualeCambioQuota = 0;
    console.log('partita.max :: '+partita.max_1+' '+partita.max_X+' '+partita.max_2);
    console.log('data.max :: '+dataFirebase.max_1+' '+dataFirebase.max_X+' '+dataFirebase.max_2);
    if ( partita.max_1 > dataFirebase.max_1 ) {
      const percentualeCambioQuotaTEMP = (partita.max_1 - dataFirebase.max_1)/dataFirebase.max_1;
      if(percentualeCambioQuotaTEMP>percentualeCambioQuota){
        percentualeCambioQuota = percentualeCambioQuotaTEMP;
        quota_1 = partita.max_1;
        segnoQuotaCambiata = '1';
        aggiorna = true;
      }
    }
    if ( partita.max_X > dataFirebase.max_X ) {
      const percentualeCambioQuotaTEMP = (partita.max_X - dataFirebase.max_X)/dataFirebase.max_X;
      if(percentualeCambioQuotaTEMP>percentualeCambioQuota){
        percentualeCambioQuota = percentualeCambioQuotaTEMP;
        quota_X = partita.max_X;
        segnoQuotaCambiata = 'X';
        aggiorna = true;
      }
    }
    if ( partita.max_2 > dataFirebase.max_2 ) {
      const percentualeCambioQuotaTEMP = (partita.max_2 - dataFirebase.max_2)/dataFirebase.max_2;
      if(percentualeCambioQuotaTEMP>percentualeCambioQuota){
        percentualeCambioQuota = percentualeCambioQuotaTEMP;
        quota_2 = partita.max_2;
        segnoQuotaCambiata = '2';
        aggiorna = true;
      }
    }

    if(!partita.livescore && segnoQuotaCambiata) {
      console.log('1- AGGIORNO PARTITA', segnoQuotaCambiata);
      this.aggiornoQuote(partita, matchId, quota_1,quota_X,quota_2,segnoQuotaCambiata,quote_last);
    } else {
      console.log('2- CHIUDO PARTITA');
      this.chiudoQuote(partita, quote_last)
    }

  }

  aggiornoQuote(partita,matchId,quota_1,quota_X,quota_2,segnoQuotaCambiata,quote_last) {
    //if ( aggiorna === true ) {
      const that = this;
      // aggiorno elemento
      var match = this.setMatch(partita);
      match.max_1 = quota_1;
      match.max_2 = quota_2;
      match.max_X = quota_X;
      match.closed = false;
      // aggiorno margin e arrotondo a 4 cifre
      const posta = 1+(quota_1/quota_X)+(quota_1/quota_2);
      const margin = (quota_1-posta)*100/posta;
      match.margin = Math.round( margin * 1000 ) / 1000;
      this.afs.collection('matchs').doc(matchId).set(match);
      
      const margin_max = match.margin;
      const start_match = partita.time;
      // richiamo pg php che analizza e salva quota e restituisce previsione
      this.loadeLiveOdds(match.id, segnoQuotaCambiata, quote_last, margin_max, false)
      .subscribe(
        data => {
          // salvo dentro firebase
          console.log('HO AGGIORNATO LE QUOTE SU MYSQL: ', data);
          that.addGiocata(data);
        },
        errMsg => {
          console.log('ERROR MESSAGE', errMsg);
        },
        () => {
          console.log('COMPLETE');
        }
      );
    // }
    // else {
    //   console.log('QUOTE NON CAMBIATE!!! NESSUN AGGIORNAMENTO ::: ');
    // }
  }

  chiudoQuote(partita,quote_last) {
    const that = this;
    const matchId = partita.id.toString();
    var match = this.setMatch(partita);
    match.closed = true;
    const margin_max = match.margin;
    this.afs.collection('matchs').doc(matchId).set(match);
    // richiamo pg php che analizza e salva quota e restituisce previsione
    this.loadeLiveOdds(match.id, '', quote_last, margin_max, true)
    .subscribe(
      data => {
        // chiudo quote su mysql
        console.log('HO CHIUSO QUOTE SU MYSQL! ', data);
      },
      errMsg => {
        console.log('ERROR MESSAGE', errMsg);
      },
      () => {
        console.log('COMPLETE');
      }
    );
  }

  addGiocata(data){
    //console.log('addGiocata : ', data);
    // se numGiocateTrovate > 0 siignifica che esiste una previsione
    if (data.segno_analizzato && data.segno_analizzato.trim() && data.numGiocateTrovate>0){
      const giocata = this.setGiocata(data);
      console.log('ESISTE UNA PREVISIONE, AGGIUNGO GIOCATA SU FIREBASE : ', giocata);
      // const chiave = this.createGuid();
      const key = String(giocata.event_id);    
      this.afs.collection('giocate').doc(key).set(giocata);
    }
  }

  // private createGuid() {
  //   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //      // tslint:disable-next-line:no-bitwise
  //      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  //      return v.toString(16);
  //   });
  //  }

  setGiocata(data):Giocata {
    
/*
    ANALISI GIOCATA 
    id
    id GIOCATE
    data
    event_id 
    max_1_live
      bookmaker
      quota_1
      quota_2
      quota_X
      uid
      updated
      x_id
    max_2_live
      bookmaker
      quota_1
      quota_2
      quota_X
      uid
      updated
      x_id
    margin 

*/

    const segno_analizzato = data.segno_analizzato;
    let quota_analizzata;
    let bookmaker;
    let x_id;
    if(segno_analizzato == '1'){
      quota_analizzata = data.quota_analizzata['quota_1'];
      bookmaker =  data.quota_analizzata['bookmaker'];
      x_id = data.quota_analizzata['x_id'];
    } 
    else if(segno_analizzato == 'X'){
      quota_analizzata = data.quota_analizzata['quota_X'];
      bookmaker = data.quota_analizzata['bookmaker'];
      x_id = data.quota_analizzata['x_id'];
    } 
    else if(segno_analizzato == '2') {
      quota_analizzata = data.quota_analizzata['quota_2'];
      bookmaker = data.quota_analizzata['bookmaker'];
      x_id = data.quota_analizzata['x_id'];
    }
    console.log('quota_analizzata : ', quota_analizzata);
    //margin_live: data.margin_live,
    const giocata = {
      event_id: data.event_id,
      hometeam_name: data.hometeam_name,
      awayteam_name: data.awayteam_name,
      margin_live: data.margin_live,
      quota_analizzata: quota_analizzata,
      bookmaker: bookmaker,
      x_id: x_id,
      segno_analizzato: data.segno_analizzato,
      event_time: data.event_time,

      numeroGiocateTrovate: data.numGiocateTrovate,
      previsioneMarginMax: (data.previsioneMarginMax)?data.previsioneMarginMax:0,
      previsioneMarginMaxRelativo: (data.previsione_margin_max_relativo)?data.previsione_margin_max_relativo:0,
      previsioneMarginEnd: (data.previsione_margin_end)?data.previsione_margin_end:0,
      previsioneQuotaLast: (data.previsione_quota_last)?data.previsione_quota_last:0
    }
    return giocata;
  }

  /**
   * 
   * @param partita 
   */
  setMatch(partita): Match {
    var now = new DatePipe('en-EN').transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
    //const now = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
    console.log('ORA datePipe::::', now);
    const match = {
      id: partita.id,
      last_update: now,
      bookmaker_count: partita.bookmaker_count,
      league_id: partita.league_id,
      awayteam_country: partita.awayteam_country,
      awayteam_country_id: partita.awayteam_country_id,
      awayteam_id: partita.awayteam_id,
      awayteam_name: partita.awayteam_name,
      hometeam_country: partita.hometeam_country,
      hometeam_country_id: partita.hometeam_country_id,
      hometeam_id: partita.hometeam_id,
      hometeam_name: partita.hometeam_name,
      max_1: partita.max_1,
      max_X: partita.max_X,
      max_2: partita.max_2,
      margin: partita.margin,
      time: partita.time,
      url: partita.url,
      x_hash: partita['x-hash'],
      x_id: partita['x-id'],
      closed: partita.closed
      // livescore: partita.livescore
    };
    return match;
  }
  
  /**
   * 
   */

 
  loadeLiveOdds(oid, segnoQuotaCambiata, quote_last, margin_max, closed): Observable<any> {
    // $event_id = $_GET['event_id'];
    // $array_quote_last = $_GET['quote_last'];
    // $margin_max = $_GET['margin_max'];
    // $start_match = $_GET['start_match'];
    let params= "?event_id="+oid;
    params += "&segno_quota_cambiata="+segnoQuotaCambiata;
    params += "&quote_last="+quote_last;
    params += "&margin_max="+margin_max;
    // params += "&start_match="+start_match;
    params += "&closed="+closed;


    const url = this.BASE_URL+'live-odds.php'+params;
    const headers: Headers = new Headers();
    headers.append('Cache-Control', 'no-cache');
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Basic b3JhY3VsdW06MTIzNDU2Nzg=');
    let options = new RequestOptions({ headers: headers });

    console.log('url events-by-league: ', url);
    return this.http
    .get(url, options)
    .map(res => <any[]>(res.json()));
  }

  // loadeLiveOddsPOST(oid, quote_last, margin_max, start_match): void {
  //   const url = this.BASE_URL+'live-odds.php';
  //   // const url =  'http://www.dariodepascalis.com/oracle/events-by-league.php?idMatch=1315';
  //   // const headers = new Headers();
  //   // //headers.append('Accept', 'application/json');
  //   // headers.append('Content-type', 'application/json');
  //   // headers.append("Access-Control-Allow-Origin", "*");
  //   // headers.append("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  //   // headers.append("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

  //   let headers = new Headers();
  //   headers.append('Access-Control-Allow-Origin' , '*');
  //   headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
  //   headers.append('Accept','application/json');
  //   headers.append('content-type','application/json');
  //   let options = new RequestOptions({ headers:headers});

  //   // let headers = new Headers();
  //   // headers.append('Content-Type', 'application/json; charset=utf-8');
  //   // headers.append('Accept', '/');
  //   // headers.append('Access-Control-Allow-Credentials', 'true');
  //   // headers.append('Upgrade-Insecure-Requests','1');
  //   // headers.append('withCredentials','true');
  //   // headers.append('Access-Control-Allow-Origin','*');
  //   // headers.append('Access-Control-Allow-Credentials', 'true');
  //   // headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  //   // headers.append('Access-Control-Allow-Headers', 'Content-Type,Authorization,Upgrade-Insecure-Requests');
  //   // const options = new RequestOptions({ headers: headers });
  
  //   const body = {
  //     //'idMatch': `${registrationId}`,
  //     'event_id': `${oid}`,
  //     'quote_last': `${quote_last}`,
  //     'margin_max': `${margin_max}`,
  //     'start_match': `${start_match}`,
  //   };
  //   console.log('POST BODY ', body);
  //   console.log('POST BODY stringify ', JSON.stringify(body));

  //   this.http.post(url, JSON.stringify(body), options)
  //     .map(res => res.json())
  //     .subscribe(data => {
  //       console.log('---> POST REQUEST ', data);
  //     },
  //     error => {
  //       console.log(error);
  //     });
  // }
  // loadOriginalProducts(): Observable<any> {
  //   const url =  'http://www.dariodepascalis.com/depa_predictor/events-by-league_firebase.php';
  //   console.log('url load original product in search-page ', url);
  //   return this.http
  //   .get(url)
  //   .map(res => <Match[]>(res.json()));
  // }

  // loadProductDetails(id: number): Observable<Match> {
  //   const url = ${BASE_URL}/products?output_format=JSON&display=full&filter[id]=[${id}]&ws_key=${WS_KEY};
  //   console.log('urlFor_loadProductDetails ', url);
  //   return this.http
  //     .get(${url})
  //     .map(res => <Product:angry:res.json().products[0]));
  // }





  /** GET hero by id. Return `undefined` when id not found

  getHeroNo404<Data>(id: number): Observable<Match> {
    const url = `${this.heroesUrl}/?id=${id}`;
    return this.http.get<Match[]>(url)
      .pipe(
        map(heroes => heroes[0]), // returns a {0|1} element array
        tap(h => {
          const outcome = h ? `fetched` : `did not find`;
          this.log(`${outcome} hero id=${id}`);
        }),
        catchError(this.handleError<Hero>(`getHero id=${id}`))
      );
  }

  /** GET hero by id. Will 404 if id not found 
  getHero(id: number): Observable<Hero> {
    const url = `${this.heroesUrl}/${id}`;
    return this.http.get<Hero>(url).pipe(
      tap(_ => this.log(`fetched hero id=${id}`)),
      catchError(this.handleError<Hero>(`getHero id=${id}`))
    );
  }

  /* GET heroes whose name contains search term 
  searchHeroes(term: string): Observable<Hero[]> {
    if (!term.trim()) {
      // if not search term, return empty hero array.
      return of([]);
    }
    return this.http.get<Hero[]>(`api/heroes/?name=${term}`).pipe(
      tap(_ => this.log(`found heroes matching "${term}"`)),
      catchError(this.handleError<Hero[]>('searchHeroes', []))
    );
  }

  //////// Save methods //////////

  /** POST: add a new hero to the server 
  addHero (hero: Hero): Observable<Hero> {
    return this.http.post<Hero>(this.heroesUrl, hero, httpOptions).pipe(
      tap((hero: Hero) => this.log(`added hero w/ id=${hero.id}`)),
      catchError(this.handleError<Hero>('addHero'))
    );
  }

  /** DELETE: delete the hero from the server 
  deleteHero (hero: Hero | number): Observable<Hero> {
    const id = typeof hero === 'number' ? hero : hero.id;
    const url = `${this.heroesUrl}/${id}`;

    return this.http.delete<Hero>(url, httpOptions).pipe(
      tap(_ => this.log(`deleted hero id=${id}`)),
      catchError(this.handleError<Hero>('deleteHero'))
    );
  }

  /** PUT: update the hero on the server 
  updateHero (hero: Hero): Observable<any> {
    return this.http.put(this.heroesUrl, hero, httpOptions).pipe(
      tap(_ => this.log(`updated hero id=${hero.id}`)),
      catchError(this.handleError<any>('updateHero'))
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * param operation - name of the operation that failed
   * param result - optional value to return as the observable result
   *
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a HeroService message with the MessageService *
  private log(message: string) {
    this.messageService.add('HeroService: ' + message);
  }
  */
}


/*
Copyright 2017 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/