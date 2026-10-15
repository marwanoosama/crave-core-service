import {ForgetPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {
    createUser,
    findUserByEmail,
    findUserExistsByEmailOrPhone,
    updateUserPassword
} from "../../user/repository/users.repo";
import {
    CannotSignupAsSystemAdmin,
    IncorrectCredentials,
    InvalidOTPError,
    RestaurantRequiredError,
    UserAlreadyExistsError
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
import {restaurantService, RestaurantService} from "../../restaurant/service/restaurant.service";
import {db} from "../../../common/knex/knex";
import {
    activateMemberByUserId,
    createRestaurantMember,
    findRestaurantMemberWithRole
} from "../../rbac/repository/restaurant-member.repo";
import {findBranchIdsByMemberId} from "../../rbac/repository/member-branch.repo";

export class AuthService {

    constructor(private readonly restaurantService: RestaurantService) {}

    register= async(data: RegisterDTO) =>{
        if (data.role == SystemRole.SYSTEM_ADMIN) {
            throw CannotSignupAsSystemAdmin
        }

        const existing = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if(existing){
            throw UserAlreadyExistsError
        }

        const hashedPassword = await hashPassword(data.password);

        const now = new Date();
        const trx = await db.transaction();
        let user, restaurant;
        try {
            user = await createUser({
                email: data.email,
                phone: data.phone,
                name: data.name,
                passwordHash: hashedPassword,
                systemRole: data.role,
                createdAt: now,
                updatedAt: now,
            }, trx);

            if (data.role == SystemRole.RESTAURANT_USER) {
                if (data.restaurant == undefined) {
                    throw RestaurantRequiredError;
                }

                restaurant = await this.restaurantService.create(user.id, data.restaurant, trx);
                // TODO: insert the member and set the member info in the jwt payload
                //  await createRestaurantMember({restaurantId: restaurant.id, userId: user.id, roleId: 1, })
            }

            await trx.commit();
        }catch(err){
            await trx.rollback();
            throw err;
        }

        const payload ={userId: user.id, role: user.systemRole, email: user.email}; //
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
    }

    resetPassword =  async(data: ResetPasswordDTO ) => {
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
        console.log(inputOTPHash);
        console.log(reset.otpHash);

        console.log(reset.isExpired());
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

    acceptInvite = async(data: ResetPasswordDTO )=> {
        const user = await this.resetPassword(data)
        await activateMemberByUserId(user.id)
    }
}

export const authService = new AuthService(restaurantService);