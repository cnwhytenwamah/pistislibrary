import { DataTypes, Model, InferAttributes, InferCreationAttributes } from "sequelize";
import { sequelize } from "../../config/database";

/** Join table: a book can belong to many categories. */
export class BookCategory extends Model<
  InferAttributes<BookCategory>,
  InferCreationAttributes<BookCategory>
> {
  declare bookId: string;
  declare categoryId: string;
}

BookCategory.init(
  {
    bookId: { type: DataTypes.UUID, primaryKey: true },
    categoryId: { type: DataTypes.UUID, primaryKey: true },
  },
  { sequelize, tableName: "book_categories", timestamps: false }
);
