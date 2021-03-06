import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ICredentialDto, RequestTypes } from '../_interfaces/DTOs/ICredentialDto';

@Injectable({
    providedIn: 'root'
})
export class CredentialService {

    constructor(private apiService: ApiService) { }

    sendForgotPasswordEmail(email: string) {
        return this.apiService.get(`credential/forgotpassword/${email}`);
    }

    changePasswordAuthorized(newPass: string, oldPass: string) {
        let crDto: ICredentialDto = {
            RequestType: RequestTypes.CHANGE_PASSWORD,
            Password: oldPass,
            NewPassword: newPass,
        }
        return this.apiService.put('credential/password', crDto);
    }

    changePasswordByToken(newPass:string, token:string){
        let crDto: ICredentialDto = {
            RequestType: RequestTypes.FORGOT_PASSWORD,
            ResetPasswordToken: token,
            NewPassword: newPass,
        }
        return this.apiService.put('credential/forgotpassword',crDto);
    }
}
