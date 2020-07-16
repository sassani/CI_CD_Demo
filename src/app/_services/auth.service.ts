import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ICredentialDto } from '../_interfaces/DTOs/ICredentialDto';
import { RequestTypes } from '../constants';
import { TokenService } from './token.service';
import { BehaviorSubject, of } from 'rxjs';
import { Credential } from '../_models/credential';
import { tap, catchError, mapTo, share } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ErrorService } from './error.service';
import { environment } from '../../environments/environment';
import { ProfileService } from './profile.service';

const BASE_URL = 'identity/auth';
@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private readonly CLIENT_ID: string = environment.clientId;
    private credential = new Credential();
    // private lastCredentialId: string = null;
    public credential$ = new BehaviorSubject<Credential>(this.credential);
    public isPending$ = new BehaviorSubject<boolean>(false);
    private rememberMe: boolean = false;




    constructor(
        private apiService: ApiService,
        private tokenService: TokenService,
        private errorService: ErrorService,
        private profileService: ProfileService,
        private router: Router,
    ) {}

    public authWithCredential(email: string, password: string, rememberMe: boolean = false) {
        const crd: ICredentialDto = {
            RequestType: RequestTypes.ID_TOKEN,
            ClientId: this.CLIENT_ID,
            Email: email,
            Password: password
        }
        this.rememberMe = rememberMe;
        return this.authenticate(crd);
        // var s1 = this.authenticate(crd).subscribe(() => { s1.unsubscribe() });
    }

    public authoAuthenticate() {
        if (!!this.tokenService.retriveRefreashToken()) {
            return this.renewAccessToken().subscribe();
        }
    }

    public renewAccessToken() {
        const crDto: ICredentialDto = {
            RequestType: RequestTypes.REFRESH_TOKEN,
            RefreshToken: null
        }

        if (!!this.credential.RefreshToken) {
            crDto.RefreshToken = this.credential.RefreshToken;
        } else if (!!this.tokenService.retriveRefreashToken()) {
            crDto.RefreshToken = this.tokenService.retriveRefreashToken();
        } else {
            // there is now refreshToken. redirect to login
            this.router.navigate(['/auth']);
            return of(false);
        }

        return this.authenticate(crDto);
    }

    private authenticate(crDto: ICredentialDto) {
        this.isPending$.next(true);
        return this.apiService.post(BASE_URL, crDto).pipe(
            tap(
                auth => {
                    this.tokenService.tokenMapper(this.credential, auth['data'].authToken);
                    if (this.rememberMe) this.tokenService.storeRefreshToken(this.credential.RefreshToken);

                    let redirectTo = localStorage.getItem('redirect-to');
                    localStorage.removeItem('redirect-to');
                    if (!redirectTo) redirectTo = '/myworkspace';
                    this.router.navigate([redirectTo]);// TODO: support query params
                    this.profileService.getProfile();//TODO: check for first time
                    this.credential$.next(this.credential);
                    this.isPending$.next(false);
                }),
                mapTo(this.credential),
                catchError(err => {
                    this.isPending$.next(false);
                let cr = new Credential();
                cr.Errors = this.errorService.getErrors(err);
                this.credential$.next(cr);
                return of(false);
            }), share());
    }

    public setEmailVerified() {
        this.credential.IsEmailVerified = true;
        this.credential$.next(this.credential);
    }

    public signOut() {
        this.apiService.delete(BASE_URL).subscribe(
            () => {
                this.tokenService.clearTokens();
                this.credential = new Credential();
                // this.profileService.profile$.unsubscribe();
                this.credential$.next(this.credential);
            },
            err => {
                this.credential.Errors = this.errorService.getErrors(err);
            })
    }
}
