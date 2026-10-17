import {IsEmail, IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, IsEnum} from "class-validator";
import {MemberStatus} from "../enums";

export class CreateRestaurantMemberDTO {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber!: string;

    @IsString()
    @IsNotEmpty()
    role!: string;

    @IsArray()
    @IsOptional()
    branchIds!: number[];
}

export class UpdateRestaurantMemberDto{
    @IsString()
    @IsOptional()
    role!: string;

    @IsEnum(MemberStatus)
    @IsOptional()
    status!: MemberStatus;
}

export class UpdateMemberBranchesDTO {
    @IsArray()
    @IsNumber({}, { each: true })
    branchIds!: number[];
}
