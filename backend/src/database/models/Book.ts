import {
  DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional,
  ForeignKey, NonAttribute,
} from "sequelize";
import { sequelize } from "../../config/database";
import type { Author } from "./Author";
import type { Category } from "./Category";
import type { BookFile } from "./BookFile";

export type BookStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export class Book extends Model<InferAttributes<Book>, InferCreationAttributes<Book>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare subtitle: CreationOptional<string | null>;
  declare slug: string;
  declare description: string;
  declare authorId: ForeignKey<Author["id"]>;
  declare language: CreationOptional<string>;
  declare publicationYear: CreationOptional<number | null>;
  declare isbn: CreationOptional<string | null>;
  declare publisher: CreationOptional<string | null>;
  declare pageCount: CreationOptional<number | null>;
  declare coverKey: CreationOptional<string | null>;
  declare keywords: CreationOptional<string[]>;
  declare status: CreationOptional<BookStatus>;
  declare downloadCount: CreationOptional<number>;
  declare readCount: CreationOptional<number>;
  declare rightsNote: CreationOptional<string | null>;
  declare publishedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Populated via `include`
  declare author?: NonAttribute<Author>;
  declare categories?: NonAttribute<Category[]>;
  declare files?: NonAttribute<BookFile[]>;
}

Book.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(300), allowNull: false },
    subtitle: { type: DataTypes.STRING(300), allowNull: true },
    slug: { type: DataTypes.STRING(320), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    authorId: { type: DataTypes.UUID, allowNull: false },
    language: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "en" },
    publicationYear: { type: DataTypes.INTEGER, allowNull: true },
    isbn: { type: DataTypes.STRING(20), allowNull: true },
    publisher: { type: DataTypes.STRING(200), allowNull: true },
    pageCount: { type: DataTypes.INTEGER, allowNull: true },
    coverKey: { type: DataTypes.STRING(255), allowNull: true },
    keywords: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    status: {
      type: DataTypes.ENUM("DRAFT", "PUBLISHED", "ARCHIVED"),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    downloadCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    readCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rightsNote: { type: DataTypes.TEXT, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "books" }
);
