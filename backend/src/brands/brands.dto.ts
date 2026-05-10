import { IsString, IsBoolean, MinLength } from 'class-validator'

export class CreateBrandDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsString()
  clerkOrgId: string
}

export class UpdatePolicyDto {
  @IsBoolean()
  returnPolicy: boolean
}
