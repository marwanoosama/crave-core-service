import {ForgetPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {findUserByEmail, updateUserPassword} from "../../user/repository/users.repo";
import {UserService} from "../../user/service/user.service";
import {RestaurantMemberService} from "../../rbac/service/restaurant-member.service";
import {
    CannotSignupAsSystemAdmin,
    IncorrectCredentials,
    InvalidOTPError,
    RestaurantRequiredError
} from "../errors";
import {SystemRole} from "../../user/enums";
import {
    comparePassword,
    createAccessToken,
    createRefreshToken,
    generateOTP,
    hashOTP,
    hashPassword,
    verifyRefreshToken,
} from "../utils";
import {
    createPasswordReset,
    findLatestPasswordResetByUserId,
    updatePasswordResetConsumedAt
} from "../repository/password-reset.repo";
import {RestaurantService} from "../../restaurant/service/restaurant.service";
import {db} from "../../../lib/knex/knex";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {
    activateMemberByUserId,
    findRestaurantMemberWithRole
} from "../../rbac/repository/restaurant-member.repo";
import {findBranchIdsByMemberId} from "../../rbac/repository/member-branch.repo";
import {IEmailProvider} from "../../../pkg/email/email.interface";
import {passwordResetEmail} from "../templates/password-reset"

@injectable()
export class AuthService {

    constructor(
        @inject(TOKENS.RestaurantService) private readonly restaurantService: RestaurantService,
        @inject(TOKENS.UserService) private readonly userService: UserService,
        @inject(TOKENS.RestaurantMemberService) private readonly memberService: RestaurantMemberService,
        @inject(TOKENS.EmailProvider) private readonly emailProvider: IEmailProvider
    ) {}

    register= async(data: RegisterDTO) =>{
        if (data.role == SystemRole.SYSTEM_ADMIN) {
            throw CannotSignupAsSystemAdmin
        }

        const trx = await db.transaction();
        let user, restaurant;
        let restaurantMemberInfo: null | { restaurantId: number, restaurantRole: string, branchIds: number[] } = null;
        try {
            user = await this.userService.create({
                email: data.email,
                phone: data.phone,
                name: data.name,
                password: data.password,
                systemRole: data.role,
            }, trx);

            if (data.role == SystemRole.RESTAURANT_USER) {
                if (data.restaurant == undefined) {
                    throw RestaurantRequiredError;
                }

                restaurant = await this.restaurantService.create(user.id, data.restaurant, trx);
                await this.memberService.createOwnerMember(restaurant.id, user.id, trx);

                restaurantMemberInfo = {
                    restaurantId: restaurant.id,
                    restaurantRole: 'owner',
                    branchIds: [],
                }
            }

            await trx.commit();
        }catch(err){
            await trx.rollback();
            throw err;
        }

        const payload ={userId: user.id, role: user.systemRole, email: user.email, ...restaurantMemberInfo};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

        return{
            message: "successfully registered user",
            accessToken,
            refreshToken,
            user:{
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
                createdAt: user.createdAt,
            },
            restaurant: restaurant
        }
    }

    login = async(data: LoginDTO) =>{
        const user = await findUserByEmail(data.email);
        if(!user){
            throw IncorrectCredentials;
        }

        const match = await comparePassword(data.password, user.passwordHash);
        if(!match){
            throw IncorrectCredentials;
        }

        let restaurantMemberInfo = null;
        if(user.systemRole == SystemRole.RESTAURANT_USER){
            const memberInfo = await findRestaurantMemberWithRole(user.id);
            const branchIds = await findBranchIdsByMemberId(memberInfo.member.id);

            if(memberInfo){
                restaurantMemberInfo = {
                    restaurantId: memberInfo.member.restaurantId,
                    restaurantRole: memberInfo.roleName,
                    branchIds
                }
            }
        }
        const payload ={userId: user.id, role: user.systemRole, email: user.email, ...restaurantMemberInfo};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

        return{
            message: "successfully logged in",
            accessToken,
            refreshToken,
            user:{
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
                createdAt: user.createdAt,
            }
        }
    }

    forgetPassword = async(data: ForgetPasswordDTO )=> {
        const user = await findUserByEmail(data.email);
        if(!user) {
            return
        }
        const otp =  generateOTP();
        const hashedOtp = hashOTP(otp);
        await createPasswordReset({
                userId: user.id,
                otpHash: hashedOtp,
                expiresAt: new Date(Date.now() + (10*60*1000)),
                createdAt: new Date(),
            }
        )
        // TODO: send email
        console.log(`mocked email sent ${otp}`)
        const email = passwordResetEmail(otp);
        await this.emailProvider.send(data.email, email.subject, email.html);

    }

    resetPassword =  async(data: ResetPasswordDTO) => {
        const user = await findUserByEmail(data.email);
        if (!user) {
            throw InvalidOTPError
        }
        const reset = await findLatestPasswordResetByUserId(user.id);
        console.log(reset)
        if(!reset) {
            throw InvalidOTPError
        }
        const inputOTPHash = hashOTP(data.otp)

        if(inputOTPHash != reset.otpHash || reset.isExpired() ) {
            throw InvalidOTPError
        }
        const hashedPassword = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, hashedPassword);
        await updatePasswordResetConsumedAt(reset.id);

        return user;
    }

    refresh = async(refreshToken: string) => {
        if (!refreshToken) {
            throw IncorrectCredentials;
        }
        const payload = verifyRefreshToken(refreshToken);
        const accessToken = createAccessToken({userId: payload.userId, role: payload.role, email: payload.email});
        return {accessToken};
    }

    acceptInvite = async(data: ResetPasswordDTO) => {
        const user = await this.resetPassword(data)
        await activateMemberByUserId(user.id)
    }
}
