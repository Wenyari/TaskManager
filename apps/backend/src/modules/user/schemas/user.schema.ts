import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { UserDocument as IUserDocument } from '@taskmanager/shared'

// Mongoose Schema 类，AGENTS.md 第 5 条：数据库 schema 类以 Document 结尾
@Schema({ timestamps: true, collection: 'users' })
export class UserDocument implements IUserDocument {
  @Prop({ required: true, unique: true, trim: true })
  username: string

  @Prop({ required: true })
  password: string

  createdAt: Date

  updatedAt: Date
}

export type UserModel = HydratedDocument<UserDocument>

export const UserSchema = SchemaFactory.createForClass(UserDocument)
