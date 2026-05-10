import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator'

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsString()
  description: string

  @IsNumber()
  @Min(1)
  price: number

  @IsNumber()
  @Min(0)
  stock: number

  @IsOptional()
  @IsString()
  imageUrl?: string
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) name?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsNumber() @Min(1) price?: number
  @IsOptional() @IsNumber() @Min(0) stock?: number
  @IsOptional() @IsString() imageUrl?: string
}
