import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {injectable} from "tsyringe";
import {
    createUser,
    findUserById,
    findUserExistsByEmailOrPhone,
    updateUser
} from "../repository/users.repo";
import {UserNotFoundError} from "../errors";
import {UpdateUserDTO} from "../dto/user.dto";
import {SystemRole} from "../enums";
import {hashPassword} from "../../auth/utils";
import {UserAlreadyExistsError} from "../../auth/errors";

export interface CreateUserData {
    email: string;
    phone: string;
    name: string;
    password: string;
    systemRole: SystemRole;
}

@injectable()
export class UserService {
    create = async (data: CreateUserData, conn: Knex = db) => {
        const existing = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if(existing){
            throw UserAlreadyExistsError;
        }

        const now = new Date();
        return await createUser({
            email: data.email,
            phone: data.phone,
            name: data.name,
            passwordHash: data.password ? await hashPassword(data.password) : "",
            systemRole: data.systemRole,
            createdAt: now,
            updatedAt: now,
        }, conn);
    }

    getByUserId = async (id: number) => {
        const user = await findUserById(id);
        if(!user){
            throw UserNotFoundError
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            systemRole: user.systemRole
        }
    }

    updateProfile = async (userId: number, data: UpdateUserDTO) => {
        const user = await findUserById(userId);
        if (!user) {
            throw UserNotFoundError;
        }
        const updated = await updateUser(userId, data);
        return {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            phone: updated.phone,
            systemRole: updated.systemRole,
        };
    }
}

