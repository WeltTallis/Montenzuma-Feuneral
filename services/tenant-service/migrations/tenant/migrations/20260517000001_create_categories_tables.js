/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const categoriesExists = await knex.schema.hasTable("categories");
  if (!categoriesExists) {
    await knex.schema.createTable("categories", (table) => {
      table.increments("id").primary();
      table.string("name", 255).notNullable();
      table.string("slug", 255).notNullable().unique();
      table.string("image", 500);
      table.enum("status", ["active", "inactive"]).defaultTo("active");
      table.integer("product_count").defaultTo(0);
      table.string("created_at", 255);
      table.string("updated_at", 255);

      table.index("slug");
      table.index("status");
    });
    console.log("✅ Categories table created");
  }

  const subcategoriesExists = await knex.schema.hasTable("subcategories");
  if (!subcategoriesExists) {
    await knex.schema.createTable("subcategories", (table) => {
      table.increments("id").primary();
      table.integer("category_id").unsigned().notNullable();
      table.string("name", 255).notNullable();
      table.string("slug", 255).notNullable().unique();
      table.string("image", 500);
      table.enum("status", ["active", "inactive"]).defaultTo("active");
      table.string("created_at", 255);
      table.string("updated_at", 255);

      table.foreign("category_id").references("id").on("categories").onDelete("CASCADE");
      table.index("category_id");
      table.index("slug");
    });
    console.log("✅ Subcategories table created");
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("subcategories");
  await knex.schema.dropTableIfExists("categories");
};
