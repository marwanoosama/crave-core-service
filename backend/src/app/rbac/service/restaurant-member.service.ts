import {CreateRestaurantMemberDTO} from "../dto/restaurant-member.dto";
import {CannotCreateOwnerUserError, RoleNotFoundError} from "../errors";
import {createUser, findUserExistsByEmailOrPhone} from "../../user/repository/users.repo";
import {UserAlreadyExistsError} from "../../auth/errors";
import {findRoleByName} from "../repository/role.repo";
import {db} from "../../../common/knex/knex";
import {SystemRole} from "../../user/enums";
import {MemberStatus} from "../enums";
import {MemberBranch} from "../entity/member-branch.entity";
import {createRestaurantMember} from "../repository/restaurant-member.repo";
import {setMemberBranches} from "../repository/member-branch.repo";
import {generateOTP, hashOTP} from "../../auth/utils";
import {createPasswordReset} from "../../auth/repository/password-reset.repo";
import {toMs} from "../../../common/utils/time";

export class RestaurantMemberService{
    async createRestaurantMember(restaurantId: number, data: CreateRestaurantMemberDTO){
        if(data.role == "owner"){
            throw CannotCreateOwnerUserError;
        }

        const existingUser = await findUserExistsByEmailOrPhone(data.email, data.phoneNumber);
        if(existingUser){
            throw UserAlreadyExistsError;
        }

        const roleId = await findRoleByName(data.role);
        if(!roleId){
            throw RoleNotFoundError;
        }

        const trx = await db.transaction();
        try{
            const now = new Date();
            const user = await createUser({
                email: data.email,
                phone: data.phoneNumber,
                name: data.name,
                passwordHash: "",
                systemRole: SystemRole.RESTAURANT_USER,
                createdAt: now,
                updatedAt: now
            }, trx);

            const member = await createRestaurantMember({
                restaurantId: restaurantId,
                userId: user.id,
                roleId: roleId,
                status: MemberStatus.INACTIVE,
                createdAt: now,
                updatedAt: now
            }, trx);

            const rows = data.branchIds.map(branchId =>
                new MemberBranch({
                    memberId: member.id,
                    branchId: branchId,
                    createdAt: now
                })
            );

            await setMemberBranches(member.id, rows, trx);

            const otp = generateOTP();
            const hashedOtp = hashOTP(otp);
            await createPasswordReset({
                    userId: user.id,
                    otpHash: hashedOtp,
                    expiresAt: new Date(Date.now() + toMs(1, 'h')),
                    createdAt: new Date(),
                }, trx
            )
            // TODO: send email
            console.log(`mocked email sent ${otp}`)

            await trx.commit()

        }catch(err){
            await trx.rollback();
            throw err;
        }
    }
}

export const restaurantMemberService = new RestaurantMemberService();