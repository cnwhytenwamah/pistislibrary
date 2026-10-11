import { User } from "./User";
import { RefreshToken } from "./RefreshToken";
import { Author } from "./Author";
import { Category } from "./Category";
import { Book } from "./Book";
import { BookCategory } from "./BookCategory";
import { BookFile } from "./BookFile";
import { Download } from "./Download";

User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

Author.hasMany(Book, { foreignKey: "authorId", as: "books" });
Book.belongsTo(Author, { foreignKey: "authorId", as: "author" });

// Books <-> categories (many-to-many through book_categories)
Book.belongsToMany(Category, {
  through: BookCategory, foreignKey: "bookId", otherKey: "categoryId", as: "categories",
});
Category.belongsToMany(Book, {
  through: BookCategory, foreignKey: "categoryId", otherKey: "bookId", as: "books",
});

Book.hasMany(BookFile, { foreignKey: "bookId", as: "files", onDelete: "CASCADE" });
BookFile.belongsTo(Book, { foreignKey: "bookId", as: "book" });

User.hasMany(Download, { foreignKey: "userId", as: "downloads", onDelete: "CASCADE" });
Book.hasMany(Download, { foreignKey: "bookId", as: "downloads", onDelete: "CASCADE" });
BookFile.hasMany(Download, { foreignKey: "bookFileId", as: "downloads", onDelete: "SET NULL" });
Download.belongsTo(User, { foreignKey: "userId", as: "user" });
Download.belongsTo(Book, { foreignKey: "bookId", as: "book" });
Download.belongsTo(BookFile, { foreignKey: "bookFileId", as: "bookFile" });

export { User, RefreshToken, Author, Category, Book, BookCategory, BookFile, Download };
