import {AuthService} from "../service/auth.service";
import {NextFunction, Request, Response} from "express";
import {validateBody} from "../../../lib/validation/validation";
import {ForgetPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {setAuthCookies} from "../../../lib/utils/cookie";
import {env} from "../../../lib/config/env";
import {toMs} from "../../../pkg/utils/time";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";

@injectable()
export class AuthController{
    constructor(@inject(TOKENS.AuthService) private readonly authService: AuthService){

    }

    register = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(RegisterDTO, req.body);
            const result = await this.authService.register(data);

            setAuthCookies(res, result.accessToken, result.refreshToken);

            sendSuccess(res, result, 201);
        } catch(err) {
            next(err);
        }
    }

    login = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(LoginDTO, req.body);
            const result = await this.authService.login(data);

            setAuthCookies(res, result.accessToken, result.refreshToken);

            sendSuccess(res, result)
        }
        catch (err) {
            next(err);
        }
    }

    forgetPassword = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(ForgetPasswordDTO, req.body);
            await this.authService.forgetPassword(data);

            sendSuccess(res, {
                "message": "email sent with otp"
            });
        }catch(err) {
            next(err);
        }
    }

    resetPassword = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.resetPassword(data);
            sendSuccess(res, {
                "message": "password reset successfully, try again"
            });
        }
        catch(err) {
            next(err);
        }
    }

    acceptInvite = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.acceptInvite(data);
            sendSuccess(res, {
                "message": "Invitation accepted successfully, please login again"
            });

        }
        catch(err) {
            next(err);
        }
    }

    refresh = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.refresh(req.cookies.refresh_token);
            res.cookie("access_token", result.accessToken, {
                httpOnly: true,
                secure: env.isProduction,
                maxAge: toMs(1, 'h'),
            });

            sendSuccess(res, {message: "success"});
        } catch(err) {
            next(err);
        }
    }
}
