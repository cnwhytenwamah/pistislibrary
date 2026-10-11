import {
  DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database";

export class Author extends Model<InferAttributes<Author>, InferCreationAttributes<Author>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare bio: CreationOptional<string | null>;
  declare photoKey: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Author.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    photoKey: { type: DataTypes.STRING(255), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "authors" }
);
