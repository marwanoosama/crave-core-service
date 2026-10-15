import {authService, AuthService} from "../service/auth.service";
import {NextFunction, Request, Response} from "express";
import {validateBody} from "../../../common/validation/validation";
import {ForgetPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {setAuthCookies} from "../../../common/utils/cookie";
import {env} from "../../../common/config/env";
import {toMs} from "../../../common/utils/time";

export class AuthController{
    constructor(private readonly authService: AuthService){

    }

    register = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(RegisterDTO, req.body);
            const result = await this.authService.register(data);

            setAuthCookies(res, result.accessToken, result.refreshToken);

            res.status(201).json(result);
        } catch(err) {
            next(err);
        }
    }

    login = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(LoginDTO, req.body);
            const result = await this.authService.login(data);

            setAuthCookies(res, result.accessToken, result.refreshToken);

            res.status(200).json(result)
        }
        catch (err) {
            next(err);
        }
    }

    forgetPassword = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(ForgetPasswordDTO, req.body);
            await this.authService.forgetPassword(data);
            res.status(200).json({
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
            res.status(200).json({
                "message": "Password reset successfully, please login again",
            })
        }
        catch(err) {
            next(err);
        }
    }

    acceptInvite = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.acceptInvite(data);
            res.status(200).json({
                "message": "Invitation accepted successfully, please login again",
            })
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
            res.status(200).json({message: "success"});
        } catch(err) {
            next(err);
        }
    }
}

export const authController = new AuthController(authService);