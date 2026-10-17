import {
    CreateRestaurantMemberDTO,
    UpdateMemberBranchesDTO,
    UpdateRestaurantMemberDto
} from "../dto/restaurant-member.dto";
import {
    CannotAssignBranchesToOwnerError, CannotCreateOwnerUserError, CannotDeleteOwnerError,
    InvalidBranchIdsError, MemberNotFoundError, RoleNotFoundError
} from "../errors";
import {Knex} from "knex";
import {db} from "../../../common/knex/knex";
import {userService, UserService} from "../../user/service/user.service";
import {findRoleByName} from "../repository/role.repo";
import {SystemRole} from "../../user/enums";
import {MemberStatus} from "../enums";
import {MemberBranch} from "../entity/member-branch.entity";
import {
    createRestaurantMember, deleteRestaurantMember,
    findRestaurantMembersByRestaurantId,
    findRestaurantMemberWithRoleName, updateRestaurantMember
} from "../repository/restaurant-member.repo";
import {countBranchesByIdsAndRestaurant, setMemberBranches} from "../repository/member-branch.repo";
import {generateOTP, hashOTP} from "../../auth/utils";
import {createPasswordReset} from "../../auth/repository/password-reset.repo";
import {toMs} from "../../../common/utils/time";
import {getPermissionsDetailsByRoleName} from "../repository/permission.repo";

export class RestaurantMemberService{
    constructor(private readonly userService: UserService) {}

    async createRestaurantMember(restaurantId: number, data: CreateRestaurantMemberDTO){
        if(data.role == "owner"){
            throw CannotCreateOwnerUserError;
        }

        const roleId = await findRoleByName(data.role);
        if(!roleId){
            throw RoleNotFoundError;
        }
        await this.validateBranchOwnership(data.branchIds ?? [], restaurantId);

        const trx = await db.transaction();
        try{
            const now = new Date();
            const user = await this.userService.create({
                email: data.email,
                phone: data.phoneNumber,
                name: data.name,
                password: "",
                systemRole: SystemRole.RESTAURANT_USER,
            }, trx);

            const member = await createRestaurantMember({
                restaurantId: restaurantId,
                userId: user.id,
                roleId: roleId,
                status: MemberStatus.INACTIVE,
                createdAt: now,
                updatedAt: now
            }, trx);

            if(data.branchIds){
                const rows = data.branchIds.map(branchId =>
                    new MemberBranch({
                        memberId: member.id,
                        branchId: branchId,
                        createdAt: now
                    })
                );

                await setMemberBranches(member.id, rows, trx);
            }

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

            return {
                message: "member created successfully",
                member
            }

        }catch(err){
            await trx.rollback();
            throw err;
        }
    }

    async createOwnerMember(restaurantId: number, userId: number, trx?: Knex.Transaction){
        const roleId = await findRoleByName('owner', trx);
        if(!roleId){
            throw RoleNotFoundError;
        }

        const now = new Date();
        return await createRestaurantMember({
            restaurantId: restaurantId,
            userId: userId,
            roleId: roleId,
            status: MemberStatus.ACTIVE,
            createdAt: now,
            updatedAt: now
        }, trx);
    }

    async listRestaurantMembers(restaurantId: number){
        const members = await findRestaurantMembersByRestaurantId(restaurantId);
        return {data: members}
    }

    async updateRestaurantMember(restaurantId: number, memberId: number, data: UpdateRestaurantMemberDto){
        const member = await findRestaurantMemberWithRoleName(memberId);
        if(!member || Number(member.member.restaurantId) !== Number(restaurantId)){
            throw MemberNotFoundError;
        }

        const updateData: {roleId?: number, status?: string} = {};
        if (data.role) {
            const roleId = await findRoleByName(data.role);
            if (!roleId) throw RoleNotFoundError;
            updateData.roleId = roleId;
        }
        if (data.status) {
            updateData.status = data.status;
        }

        await updateRestaurantMember(memberId, updateData);
        return {message: "Member updated successfully"};
    }

    async deleteRestaurantMember(restaurantId: number, memberId: number){
        const member = await findRestaurantMemberWithRoleName(memberId);
        if(!member || Number(member.member.restaurantId) !== Number(restaurantId)){
            throw MemberNotFoundError;
        }

        if(member.roleName === "owner"){
            throw CannotDeleteOwnerError;
        }

        await deleteRestaurantMember(memberId);
        return {message: "Member deleted successfully"};
    }

    async updateRestaurantMemberBranches(restaurantId: number, memberId: number, data: UpdateMemberBranchesDTO){
        const member = await findRestaurantMemberWithRoleName(memberId);
        if(!member || Number(member.member.restaurantId) !== Number(restaurantId)){
            throw MemberNotFoundError;
        }

        if (member.roleName === 'owner') {
            throw CannotAssignBranchesToOwnerError;
        }

        await this.validateBranchOwnership(data.branchIds, restaurantId);

        const now = new Date();
        const rows = data.branchIds.map(branchId => new MemberBranch({
            branchId,
            memberId: member.member.id,
            createdAt: now,
        }));
        await setMemberBranches(memberId, rows);

        return {
            message: "Member branch assignments updated successfully",
            branchIds: data.branchIds,
        };
    }

    async getRolePermissions(roleName: string){
        const permissions = await getPermissionsDetailsByRoleName(roleName);
        return {
            role: roleName,
            permissions
        }
    }

    // Helpers
    async validateBranchOwnership(branchIds: number[], restaurantId: number){
        if (!branchIds || branchIds.length === 0) return;
        const branchesCount = await countBranchesByIdsAndRestaurant(branchIds, restaurantId);
        if (branchesCount !== branchIds.length) {
            throw InvalidBranchIdsError;
        }
    }
}

export const restaurantMemberService = new RestaurantMemberService(userService);