import {findUserById, updateUser} from "../repository/users.repo";
import {UserNotFoundError} from "../errors";
import {UpdateUserDTO} from "../dto/user.dto";

export class UserService {
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

export const userService = new UserService();