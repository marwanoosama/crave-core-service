import {validate} from "class-validator";
import {AppError} from "../error/AppError";
import {plainToInstance} from "class-transformer";

// for dto's
export async function validateBody <T extends Object>(cls: new () => T, body: unknown) : Promise<T> {
    // map the req body to the wanted dto
    const instance = plainToInstance(cls, body); // dto: {email, phone, password} , body: {email, phone, system_role}
    const errors = await validate(instance, {whitelist: true}); // looks at the decorators in the dto and validates

    if(errors.length > 0) {
        const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
        throw new AppError(messages.join(', \n'), 400)
    }
    return instance;
}