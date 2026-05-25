import { HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { DefaultException } from '../../common/exceptions/default.exception'
import { UserService } from '../user/user.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

const BCRYPT_SALT_ROUNDS = 10

export interface AuthResult {
  token: string
  userId: string
  username: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const exist = await this.userService.findByUsername(dto.username)
    if (exist) {
      throw new DefaultException('username already exists', HttpStatus.CONFLICT)
    }
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS)
    const user = await this.userService.createUser(dto.username, hashedPassword)
    return this.signToken(user._id.toString(), user.username)
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userService.findByUsername(dto.username)
    if (!user) {
      throw new DefaultException('username or password is incorrect', HttpStatus.UNAUTHORIZED)
    }
    const matched = await bcrypt.compare(dto.password, user.password)
    if (!matched) {
      throw new DefaultException('username or password is incorrect', HttpStatus.UNAUTHORIZED)
    }
    return this.signToken(user._id.toString(), user.username)
  }

  private signToken(userId: string, username: string): AuthResult {
    const token = this.jwtService.sign({ sub: userId, username })
    return { token, userId, username }
  }
}
