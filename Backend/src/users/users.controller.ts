import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    // ocultar campos sensibles si es necesario
    // @ts-ignore
    delete user.password_hash;
    return user;
  }
}
