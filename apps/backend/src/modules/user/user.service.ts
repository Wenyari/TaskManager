import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { UserDocument, UserModel } from './schemas/user.schema'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserDocument.name) private readonly userModel: Model<UserDocument>
  ) {}

  async findByUsername(username: string): Promise<UserModel | null> {
    return this.userModel.findOne({ username }).exec()
  }

  async findById(userId: string): Promise<UserModel | null> {
    return this.userModel.findById(userId).exec()
  }

  async createUser(username: string, hashedPassword: string): Promise<UserModel> {
    const user = new this.userModel({ username, password: hashedPassword })
    return user.save()
  }
}
